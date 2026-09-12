/**
 * Send history repository
 *
 * Append-only audit log. Nothing here updates or deletes rows in normal
 * operation: the value of the log is that it records what actually happened,
 * including for contacts that were later removed.
 */

import { and, count, desc, eq, gte, sql } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { sendHistory, type NewSendHistoryRow, type SendHistoryRow } from "@/lib/db/schema"

const MAX_PREVIEW_LENGTH = 500

/**
 * Rows per INSERT.
 *
 * D1 binds at most 100 parameters per statement and this table writes 10
 * columns per row, so 10 rows is the ceiling. A bulk send of 500 contacts is
 * therefore 50 requests; acceptable because it happens once at the end of a
 * run, and unlike the contacts import it is not on the critical path.
 */
const INSERT_CHUNK_SIZE = 10

export interface RecordSendInput {
  contactId?: string | null
  contactNormalized: string
  companyName?: string | null
  templateId?: string | null
  message?: string | null
  status?: "sent" | "failed" | "skipped"
  error?: string | null
  actor?: string | null
}

function toRow(input: RecordSendInput, now: string): NewSendHistoryRow {
  return {
    id: crypto.randomUUID(),
    contactId: input.contactId ?? null,
    contactNormalized: input.contactNormalized,
    companyName: input.companyName ?? null,
    templateId: input.templateId ?? null,
    messagePreview: input.message ? input.message.slice(0, MAX_PREVIEW_LENGTH) : null,
    status: input.status ?? "sent",
    error: input.error ?? null,
    actor: input.actor ?? null,
    sentAt: now,
  }
}

export async function recordSend(input: RecordSendInput): Promise<void> {
  const db = getDb()
  await db.insert(sendHistory).values(toRow(input, new Date().toISOString()))
}

/** Log a whole bulk send in as few round-trips as the parameter limit allows. */
export async function recordSends(inputs: RecordSendInput[]): Promise<number> {
  if (inputs.length === 0) return 0

  const db = getDb()
  const now = new Date().toISOString()
  const rows = inputs.map((input) => toRow(input, now))

  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    await db.insert(sendHistory).values(rows.slice(i, i + INSERT_CHUNK_SIZE))
  }

  return rows.length
}

export interface SendHistoryQuery {
  contactId?: string
  status?: "sent" | "failed" | "skipped"
  since?: string
  page?: number
  perPage?: number
}

export async function listSendHistory(query: SendHistoryQuery = {}): Promise<{
  entries: SendHistoryRow[]
  page: number
  perPage: number
  total: number
  totalPages: number
}> {
  const db = getDb()
  const page = Math.max(1, query.page ?? 1)
  const perPage = Math.min(200, Math.max(1, query.perPage ?? 50))

  const conditions = []
  if (query.contactId) conditions.push(eq(sendHistory.contactId, query.contactId))
  if (query.status) conditions.push(eq(sendHistory.status, query.status))
  if (query.since) conditions.push(gte(sendHistory.sentAt, query.since))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [entries, totalResult] = await Promise.all([
    db
      .select()
      .from(sendHistory)
      .where(where)
      .orderBy(desc(sendHistory.sentAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(sendHistory).where(where),
  ])

  const total = totalResult[0]?.value ?? 0

  return { entries, page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) }
}

/** Totals for the dashboard: overall and for the last 24 hours. */
export async function getSendSummary(): Promise<{
  total: number
  sent: number
  failed: number
  last24h: number
}> {
  const db = getDb()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [row] = await db
    .select({
      total: count(),
      sent: sql<number>`SUM(CASE WHEN ${sendHistory.status} = 'sent' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN ${sendHistory.status} = 'failed' THEN 1 ELSE 0 END)`,
      last24h: sql<number>`SUM(CASE WHEN ${sendHistory.sentAt} >= ${since} THEN 1 ELSE 0 END)`,
    })
    .from(sendHistory)

  return {
    total: Number(row?.total ?? 0),
    sent: Number(row?.sent ?? 0),
    failed: Number(row?.failed ?? 0),
    last24h: Number(row?.last24h ?? 0),
  }
}
