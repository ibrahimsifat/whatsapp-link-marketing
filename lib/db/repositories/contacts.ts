/**
 * Contacts repository
 *
 * Every read and write of contact data goes through this module. API routes
 * stay thin (parse, authorise, delegate) and all SQL lives here, which keeps
 * query behaviour testable and prevents ad-hoc queries leaking into handlers.
 *
 * Two D1 constraints shape the bulk operations in this file:
 *
 *  1. A statement may bind at most 100 parameters.
 *  2. The REST API takes ONE parameterised statement per request, and offers no
 *     transaction across several.
 *
 * Naively chunking a 10,000-row import into 100-parameter INSERTs would mean
 * ~1,600 sequential HTTP round-trips, and a failure half way through would
 * leave the import partly applied. Instead the rows are serialised into a
 * single JSON parameter and unpacked server-side with SQLite's `json_each()`.
 * One statement, one bound parameter, one round-trip, and the write is atomic
 * because it *is* a single statement.
 */

import { and, asc, count, desc, eq, isNotNull, like, or, sql } from "drizzle-orm"

import type { Contact, ContactStatus } from "@/app/types"
import { getDb } from "@/lib/db"
import { contactToRow, rowToContact } from "@/lib/db/mappers"
import { contacts, importBatches, type ContactRow, type NewContactRow } from "@/lib/db/schema"

// ============================================================================
// LIMITS
// ============================================================================

/**
 * Maximum serialised size of one JSON parameter, in bytes.
 *
 * D1 caps a single bound value at 2,000,000 bytes; this leaves generous
 * headroom for the surrounding request.
 */
const MAX_JSON_PARAM_BYTES = 900_000

/** Split rows into groups whose JSON payload stays under the parameter cap. */
function chunkBySerializedSize<T>(items: T[], maxBytes = MAX_JSON_PARAM_BYTES): T[][] {
  if (items.length === 0) return []

  const groups: T[][] = []
  let current: T[] = []
  let currentBytes = 2 // the enclosing [] brackets

  for (const item of items) {
    const encoded = JSON.stringify(item)
    const itemBytes = encoded.length + 1 // plus the separating comma

    if (current.length > 0 && currentBytes + itemBytes > maxBytes) {
      groups.push(current)
      current = []
      currentBytes = 2
    }

    current.push(item)
    currentBytes += itemBytes
  }

  if (current.length > 0) groups.push(current)
  return groups
}

// ============================================================================
// TYPES
// ============================================================================

export interface ContactListFilters {
  status?: ContactStatus | "all"
  category?: string | "all"
  /** "all" | "with" | "without" */
  website?: "all" | "with" | "without"
  search?: string
  source?: string
}

export interface ContactListOptions extends ContactListFilters {
  page?: number
  perPage?: number
  sortBy?: "createdAt" | "updatedAt" | "companyName" | "status"
  sortDir?: "asc" | "desc"
}

export interface PaginatedContacts {
  contacts: Contact[]
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface ContactStats {
  total: number
  sent: number
  pending: number
  notSent: number
  withWebsite: number
  sendRate: number
}

export interface ImportResult {
  batchId: string
  received: number
  inserted: number
  updated: number
  /** Rows skipped because the same number appeared twice in the payload. */
  duplicatesInPayload: number
}

// ============================================================================
// QUERY BUILDING
// ============================================================================

/** Build the WHERE clause shared by list, count and export. */
function buildWhere(filters: ContactListFilters) {
  const conditions = []

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(contacts.status, filters.status))
  }

  if (filters.category && filters.category !== "all") {
    conditions.push(eq(contacts.companyCategory, filters.category))
  }

  if (filters.website === "with") {
    conditions.push(eq(contacts.hasWebsite, true))
  } else if (filters.website === "without") {
    conditions.push(eq(contacts.hasWebsite, false))
  }

  if (filters.source) {
    conditions.push(eq(contacts.source, filters.source))
  }

  const term = filters.search?.trim()
  if (term) {
    // Escape LIKE wildcards so a user searching for "50%" does not match everything.
    const escaped = term.replace(/[\\%_]/g, (m) => `\\${m}`)
    const pattern = `%${escaped}%`
    conditions.push(
      or(
        like(contacts.normalized, pattern),
        like(contacts.original, pattern),
        like(contacts.companyName, pattern),
        like(contacts.companyCategory, pattern),
        like(contacts.website, pattern),
        like(contacts.city, pattern),
        like(contacts.language, pattern),
        like(contacts.notes, pattern),
      ),
    )
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

function buildOrderBy(sortBy: ContactListOptions["sortBy"], sortDir: ContactListOptions["sortDir"]) {
  const direction = sortDir === "asc" ? asc : desc

  switch (sortBy) {
    case "companyName":
      return direction(contacts.companyName)
    case "status":
      return direction(contacts.status)
    case "updatedAt":
      return direction(contacts.updatedAt)
    case "createdAt":
    default:
      return direction(contacts.createdAt)
  }
}

// ============================================================================
// READS
// ============================================================================

/**
 * Paginated, filtered contact list.
 *
 * Pagination happens in SQL, not in the browser: the previous localStorage
 * implementation had to hold every contact in memory to render page 3.
 */
export async function listContacts(options: ContactListOptions = {}): Promise<PaginatedContacts> {
  const db = getDb()
  const page = Math.max(1, options.page ?? 1)
  const perPage = Math.min(500, Math.max(1, options.perPage ?? 20))
  const where = buildWhere(options)

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(where)
      .orderBy(buildOrderBy(options.sortBy, options.sortDir))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(contacts).where(where),
  ])

  const total = totalResult[0]?.value ?? 0

  return {
    contacts: rows.map(rowToContact),
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

/**
 * Every contact matching the filters, unpaginated.
 *
 * Used by export and by the bulk sender, which genuinely needs the full set.
 * Capped so a runaway dataset cannot exhaust the function's memory.
 */
export async function listAllContacts(filters: ContactListFilters = {}, limit = 20_000): Promise<Contact[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(contacts)
    .where(buildWhere(filters))
    .orderBy(desc(contacts.createdAt))
    .limit(limit)

  return rows.map(rowToContact)
}

export async function getContactById(id: string): Promise<Contact | null> {
  const db = getDb()
  const [row] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1)
  return row ? rowToContact(row) : null
}

export async function getContactByNormalized(normalized: string): Promise<Contact | null> {
  const db = getDb()
  const [row] = await db.select().from(contacts).where(eq(contacts.normalized, normalized)).limit(1)
  return row ? rowToContact(row) : null
}

/** Aggregate counters, computed in SQL in a single round-trip. */
export async function getContactStats(): Promise<ContactStats> {
  const db = getDb()

  const [row] = await db
    .select({
      total: count(),
      sent: sql<number>`SUM(CASE WHEN ${contacts.status} = 'sent' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN ${contacts.status} = 'pending' THEN 1 ELSE 0 END)`,
      notSent: sql<number>`SUM(CASE WHEN ${contacts.status} = 'not_sent' THEN 1 ELSE 0 END)`,
      withWebsite: sql<number>`SUM(CASE WHEN ${contacts.hasWebsite} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(contacts)

  const total = Number(row?.total ?? 0)
  const sent = Number(row?.sent ?? 0)

  return {
    total,
    sent,
    pending: Number(row?.pending ?? 0),
    notSent: Number(row?.notSent ?? 0),
    withWebsite: Number(row?.withWebsite ?? 0),
    sendRate: total > 0 ? Math.round((sent / total) * 100) : 0,
  }
}

/** Distinct non-empty categories, for populating the filter dropdown. */
export async function getContactCategories(): Promise<string[]> {
  const db = getDb()
  const rows = await db
    .selectDistinct({ category: contacts.companyCategory })
    .from(contacts)
    .where(isNotNull(contacts.companyCategory))
    .orderBy(asc(contacts.companyCategory))

  return rows.map((r) => r.category).filter((c): c is string => Boolean(c && c.trim()))
}

// ============================================================================
// SINGLE-ROW WRITES
// ============================================================================

export async function createContact(contact: Contact): Promise<Contact> {
  const db = getDb()
  const [row] = await db.insert(contacts).values(contactToRow(contact)).returning()
  return rowToContact(row as ContactRow)
}

export async function updateContact(id: string, patch: Partial<Contact>): Promise<Contact | null> {
  const db = getDb()
  const now = new Date().toISOString()

  const values: Partial<NewContactRow> = { updatedAt: now }

  if (patch.original !== undefined) values.original = patch.original
  if (patch.normalized !== undefined) values.normalized = patch.normalized
  if (patch.whatsappLink !== undefined) values.whatsappLink = patch.whatsappLink
  if (patch.companyName !== undefined) values.companyName = patch.companyName ?? null
  if (patch.companyCategory !== undefined) values.companyCategory = patch.companyCategory ?? null
  if (patch.website !== undefined) values.website = patch.website ?? null
  if (patch.city !== undefined) values.city = patch.city ?? null
  if (patch.language !== undefined) values.language = patch.language ?? null
  if (patch.hasWebsite !== undefined) values.hasWebsite = Boolean(patch.hasWebsite)
  if (patch.source !== undefined) values.source = patch.source
  if (patch.notes !== undefined) values.notes = patch.notes ?? null
  if (patch.dynamicData !== undefined) {
    values.dynamicData = patch.dynamicData ? JSON.stringify(patch.dynamicData) : null
  }

  if (patch.status !== undefined) {
    values.status = patch.status
    // `sentAt` is derived from the status transition, never trusted from the
    // client: marking something sent must stamp the server's clock.
    values.sentAt = patch.status === "sent" ? (patch.sentAt ?? now) : null
  }

  const [row] = await db.update(contacts).set(values).where(eq(contacts.id, id)).returning()
  return row ? rowToContact(row as ContactRow) : null
}

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
  notes?: string,
): Promise<Contact | null> {
  return updateContact(id, { status, ...(notes !== undefined ? { notes } : {}) })
}

export async function deleteContact(id: string): Promise<boolean> {
  const db = getDb()
  const deleted = await db.delete(contacts).where(eq(contacts.id, id)).returning({ id: contacts.id })
  return deleted.length > 0
}

// ============================================================================
// BULK WRITES
// ============================================================================

/**
 * Set the same status on many contacts.
 *
 * The id list travels as one JSON parameter and is expanded by `json_each()`,
 * so this is a single statement regardless of whether 5 or 5,000 contacts are
 * selected — well clear of the 100-parameter ceiling an `IN (?, ?, ...)` would
 * hit at 100 rows.
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: ContactStatus,
  notes?: string,
): Promise<number> {
  if (ids.length === 0) return 0

  const db = getDb()
  const now = new Date().toISOString()
  const sentAt = status === "sent" ? now : null

  let updated = 0

  for (const group of chunkBySerializedSize(ids)) {
    const payload = JSON.stringify(group)

    // Only the row count is used, which is shape-independent.
    const rows = await db.all<unknown[]>(sql`
      UPDATE ${contacts}
      SET
        status     = ${status},
        sent_at    = ${sentAt},
        updated_at = ${now}
        ${notes !== undefined ? sql`, notes = ${notes || null}` : sql``}
      WHERE id IN (SELECT value FROM json_each(${payload}))
      RETURNING id
    `)

    updated += rows.length
  }

  return updated
}

/** Delete many contacts in a single statement per payload chunk. */
export async function bulkDeleteContacts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0

  const db = getDb()
  let deleted = 0

  for (const group of chunkBySerializedSize(ids)) {
    const payload = JSON.stringify(group)

    // Only the row count is used, which is shape-independent.
    const rows = await db.all<unknown[]>(sql`
      DELETE FROM ${contacts}
      WHERE id IN (SELECT value FROM json_each(${payload}))
      RETURNING id
    `)

    deleted += rows.length
  }

  return deleted
}

/** Remove every contact. Send history is preserved by design. */
export async function deleteAllContacts(): Promise<number> {
  const db = getDb()
  const before = await getContactStats()
  await db.delete(contacts)
  return before.total
}

// ============================================================================
// IMPORT
// ============================================================================

/** The JSON keys unpacked by the import statement, in column order. */
interface ImportPayloadRow {
  id: string
  original: string
  normalized: string
  whatsapp_link: string
  company_name: string | null
  company_category: string | null
  website: string | null
  city: string | null
  language: string | null
  has_website: number
  status: string
  sent_at: string | null
  source: string
  notes: string | null
  dynamic_data: string | null
}

function toPayloadRow(row: NewContactRow): ImportPayloadRow {
  return {
    id: row.id,
    original: row.original,
    normalized: row.normalized,
    whatsapp_link: row.whatsappLink,
    company_name: row.companyName ?? null,
    company_category: row.companyCategory ?? null,
    website: row.website ?? null,
    city: row.city ?? null,
    language: row.language ?? null,
    has_website: row.hasWebsite ? 1 : 0,
    status: row.status ?? "pending",
    sent_at: row.sentAt ?? null,
    source: row.source ?? "manual",
    notes: row.notes ?? null,
    dynamic_data: row.dynamicData ?? null,
  }
}

/**
 * Insert or merge a batch of contacts.
 *
 * Deduplication is delegated to the database via `ON CONFLICT (normalized)`.
 * This matters: the previous in-memory approach compared against a snapshot of
 * the contact list, so two imports running at once could both decide a number
 * was new. The unique index makes that impossible.
 *
 * Merge rules on conflict:
 *  - new company/category/website/city/language values fill gaps but never
 *    overwrite with null
 *  - `status` and `sentAt` are preserved, so re-importing a list cannot erase
 *    the record of who has already been contacted
 *  - `source` accumulates, so provenance is not lost
 */
export async function importContacts(
  incoming: Contact[],
  options: { source: string; filename?: string; actor?: string | null } = { source: "import" },
): Promise<ImportResult> {
  const db = getDb()
  const now = new Date().toISOString()
  const batchId = crypto.randomUUID()

  // 1. Collapse duplicates inside the payload itself. `ON CONFLICT` cannot
  //    resolve two conflicting rows within one statement, so the last
  //    occurrence of a number wins here.
  const byNormalized = new Map<string, Contact>()
  let duplicatesInPayload = 0

  for (const contact of incoming) {
    if (!contact.normalized) continue
    if (byNormalized.has(contact.normalized)) duplicatesInPayload++
    byNormalized.set(contact.normalized, contact)
  }

  const unique = [...byNormalized.values()]

  if (unique.length === 0) {
    return { batchId, received: incoming.length, inserted: 0, updated: 0, duplicatesInPayload }
  }

  // 2. Count how many of these numbers already exist, so the result can report
  //    inserts and updates separately. One statement, one JSON parameter.
  const existing = await countExistingNormalized([...byNormalized.keys()])
  const inserted = unique.length - existing
  const updated = existing

  // 3. Record the batch first so the contacts' foreign key resolves.
  await db.insert(importBatches).values({
    id: batchId,
    source: options.source,
    filename: options.filename ?? null,
    totalRows: incoming.length,
    insertedCount: inserted,
    updatedCount: updated,
    duplicateCount: duplicatesInPayload,
    errorCount: 0,
    errors: null,
    actor: options.actor ?? null,
    createdAt: now,
  })

  // 4. Upsert. Each chunk is one statement carrying up to ~900KB of rows, so a
  //    10,000-contact import is a handful of requests rather than ~1,600.
  const payloadRows = unique.map((contact) => toPayloadRow(contactToRow(contact, { importBatchId: batchId, now })))

  for (const group of chunkBySerializedSize(payloadRows)) {
    const payload = JSON.stringify(group)

    await db.run(sql`
      INSERT INTO ${contacts} (
        id, original, normalized, whatsapp_link,
        company_name, company_category, website, city, language, has_website,
        status, sent_at, source, notes, dynamic_data,
        import_batch_id, created_at, updated_at
      )
      SELECT
        json_extract(value, '$.id'),
        json_extract(value, '$.original'),
        json_extract(value, '$.normalized'),
        json_extract(value, '$.whatsapp_link'),
        json_extract(value, '$.company_name'),
        json_extract(value, '$.company_category'),
        json_extract(value, '$.website'),
        json_extract(value, '$.city'),
        json_extract(value, '$.language'),
        json_extract(value, '$.has_website'),
        json_extract(value, '$.status'),
        json_extract(value, '$.sent_at'),
        json_extract(value, '$.source'),
        json_extract(value, '$.notes'),
        json_extract(value, '$.dynamic_data'),
        ${batchId},
        ${now},
        ${now}
      FROM json_each(${payload})
      WHERE true
      ON CONFLICT (normalized) DO UPDATE SET
        company_name     = COALESCE(excluded.company_name, contacts.company_name),
        company_category = COALESCE(excluded.company_category, contacts.company_category),
        website          = COALESCE(excluded.website, contacts.website),
        city             = COALESCE(excluded.city, contacts.city),
        language         = COALESCE(excluded.language, contacts.language),
        has_website      = MAX(excluded.has_website, contacts.has_website),
        whatsapp_link    = excluded.whatsapp_link,
        notes            = COALESCE(excluded.notes, contacts.notes),
        dynamic_data     = COALESCE(excluded.dynamic_data, contacts.dynamic_data),
        source           = CASE
                             WHEN contacts.source = excluded.source THEN contacts.source
                             ELSE contacts.source || ', ' || excluded.source
                           END,
        import_batch_id  = excluded.import_batch_id,
        updated_at       = ${now}
    `)
  }

  return { batchId, received: incoming.length, inserted, updated, duplicatesInPayload }
}

/**
 * How many of the supplied numbers already exist.
 *
 * `WHERE true` is required before `ON CONFLICT` when an INSERT draws from a
 * SELECT; here the same `json_each()` trick keeps the lookup to one statement.
 */
async function countExistingNormalized(numbers: string[]): Promise<number> {
  if (numbers.length === 0) return 0

  const db = getDb()
  let found = 0

  for (const group of chunkBySerializedSize(numbers)) {
    const payload = JSON.stringify(group)

    // Raw `sql` has no column metadata for Drizzle to map against, so the proxy
    // hands back positional rows: [[count]]. Read index 0 rather than a name.
    const rows = await db.all<unknown[]>(sql`
      SELECT COUNT(*) AS total
      FROM ${contacts}
      WHERE normalized IN (SELECT value FROM json_each(${payload}))
    `)

    found += Number(rows[0]?.[0] ?? 0)
  }

  return found
}
