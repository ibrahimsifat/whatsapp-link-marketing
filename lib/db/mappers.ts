/**
 * Row <-> domain mappers
 *
 * The database speaks snake_case with JSON-encoded text columns; the UI speaks
 * the camelCase `Contact` / `MessageTemplate` types it already had before D1
 * existed. Keeping the translation in one place means the React components did
 * not have to learn anything about the storage format.
 */

import type { Contact, MessageTemplate } from "@/app/types/contact"
import type { ContactRow, MessageTemplateRow, NewContactRow, NewMessageTemplateRow } from "./schema"

// ============================================================================
// JSON HELPERS
// ============================================================================

/**
 * Parse a JSON text column without ever throwing.
 *
 * A single malformed row must not take down a whole list request, so a parse
 * failure degrades to the fallback value and is logged instead.
 */
function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return (parsed ?? fallback) as T
  } catch {
    console.warn("[db] Failed to parse JSON column, falling back to default")
    return fallback
  }
}

function stringifyJson(value: unknown): string | null {
  if (value === undefined || value === null) return null
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

// ============================================================================
// CONTACTS
// ============================================================================

export function rowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    original: row.original,
    normalized: row.normalized,
    whatsappLink: row.whatsappLink,
    companyName: row.companyName ?? undefined,
    companyCategory: row.companyCategory ?? undefined,
    website: row.website ?? undefined,
    city: row.city ?? undefined,
    language: row.language ?? undefined,
    hasWebsite: Boolean(row.hasWebsite),
    status: row.status,
    sentAt: row.sentAt ?? undefined,
    lastUpdated: row.updatedAt,
    source: row.source,
    notes: row.notes ?? undefined,
    dynamicData: parseJson<Contact["dynamicData"]>(row.dynamicData, undefined),
  }
}

export function contactToRow(
  contact: Contact,
  options: { importBatchId?: string | null; now?: string } = {},
): NewContactRow {
  const now = options.now ?? new Date().toISOString()

  return {
    id: contact.id,
    original: contact.original,
    normalized: contact.normalized,
    whatsappLink: contact.whatsappLink,
    companyName: contact.companyName ?? null,
    companyCategory: contact.companyCategory ?? null,
    website: contact.website ?? null,
    city: contact.city ?? null,
    language: contact.language ?? null,
    hasWebsite: Boolean(contact.hasWebsite),
    status: contact.status ?? "pending",
    sentAt: contact.sentAt ?? null,
    source: contact.source || "manual",
    notes: contact.notes ?? null,
    dynamicData: stringifyJson(contact.dynamicData),
    importBatchId: options.importBatchId ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

// ============================================================================
// TEMPLATES
// ============================================================================

export function rowToTemplate(row: MessageTemplateRow): MessageTemplate & { isDefault: boolean } {
  return {
    id: row.id,
    // Pre-multilingual rows predate the column; such a row is its own group.
    groupId: row.groupId ?? row.id,
    name: row.name,
    category: row.category,
    content: row.content,
    variables: parseJson<string[]>(row.variables, []),
    targetAudience: row.targetAudience,
    specificCategory: row.specificCategory ?? undefined,
    language: row.language,
    isFallback: Boolean(row.isFallback),
    imageUrl: row.imageUrl ?? undefined,
    isDefault: Boolean(row.isDefault),
  }
}

export function templateToRow(
  template: MessageTemplate,
  options: { isDefault?: boolean; now?: string } = {},
): NewMessageTemplateRow {
  const now = options.now ?? new Date().toISOString()

  return {
    id: template.id,
    groupId: template.groupId || template.id,
    name: template.name,
    category: template.category || "General",
    content: template.content,
    variables: stringifyJson(template.variables ?? []) ?? "[]",
    targetAudience: template.targetAudience ?? "all",
    specificCategory: template.specificCategory ?? null,
    language: template.language || "en",
    isFallback: template.isFallback ?? false,
    imageUrl: template.imageUrl ?? null,
    isDefault: options.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  }
}
