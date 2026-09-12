/**
 * GET /api/contacts/export
 *
 * Streams the filtered contact set as CSV or JSON.
 *
 * Export happens server-side so it reflects the whole database, not just the
 * page the browser currently holds, and so a 20,000-row export never has to be
 * assembled in the client's memory.
 */

import type { NextRequest } from "next/server"

import { handleRoute } from "@/lib/api/response"
import { contactListQuerySchema, parseQuery } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import { listAllContacts } from "@/lib/db/repositories/contacts"
import type { Contact } from "@/app/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const CSV_COLUMNS: Array<{ header: string; value: (c: Contact) => unknown }> = [
  { header: "Phone", value: (c) => c.normalized },
  { header: "Original", value: (c) => c.original },
  { header: "Company", value: (c) => c.companyName ?? "" },
  { header: "Category", value: (c) => c.companyCategory ?? "" },
  { header: "Website", value: (c) => c.website ?? "" },
  { header: "City", value: (c) => c.city ?? "" },
  { header: "Language", value: (c) => c.language ?? "" },
  { header: "Has Website", value: (c) => (c.hasWebsite ? "Yes" : "No") },
  { header: "Status", value: (c) => c.status },
  { header: "Sent At", value: (c) => c.sentAt ?? "" },
  { header: "Source", value: (c) => c.source },
  { header: "Notes", value: (c) => c.notes ?? "" },
  { header: "WhatsApp Link", value: (c) => c.whatsappLink },
  { header: "Last Updated", value: (c) => c.lastUpdated },
]

/**
 * Quote a CSV field.
 *
 * The leading-character guard defuses CSV injection: a value starting with
 * `=`, `+`, `-` or `@` is executed as a formula when the file is opened in
 * Excel, and this data comes from uploaded spreadsheets.
 */
function csvEscape(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value)
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}

function toCsv(contacts: Contact[]): string {
  const header = CSV_COLUMNS.map((col) => csvEscape(col.header)).join(",")
  const rows = contacts.map((contact) => CSV_COLUMNS.map((col) => csvEscape(col.value(contact))).join(","))
  // A UTF-8 BOM so Excel renders non-ASCII company names correctly.
  return `﻿${[header, ...rows].join("\r\n")}`
}

export const GET = handleRoute(async (request: NextRequest) => {
  await requireSession()

  const url = new URL(request.url)
  const format = url.searchParams.get("format") === "json" ? "json" : "csv"
  const filters = parseQuery(contactListQuerySchema, url)
  const contacts = await listAllContacts(filters)

  const date = new Date().toISOString().split("T")[0]
  const filename = `whatsapp-contacts-${date}.${format}`

  const body =
    format === "json"
      ? JSON.stringify({ exportedAt: new Date().toISOString(), total: contacts.length, contacts }, null, 2)
      : toCsv(contacts)

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  }) as never
})
