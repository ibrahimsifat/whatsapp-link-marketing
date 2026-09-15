/**
 * Excel export for the contact database.
 *
 * The server already streams the full contact set as JSON, so the workbook is
 * built in the browser from that response rather than adding a second
 * server-side serialiser. SheetJS is already bundled for spreadsheet *import*,
 * so this costs nothing extra.
 */

import * as XLSX from "xlsx"

import type { Contact } from "../types/contact"
import { WhatsAppService } from "./whatsapp-service"
import { languageLabel, normalizeLanguage } from "@/lib/i18n/languages"

/** The fixed columns, in the order they appear in the sheet. */
const COLUMNS: Array<{ header: string; width: number; value: (contact: Contact) => string }> = [
  { header: "Company", width: 34, value: (c) => c.companyName ?? "" },
  { header: "Phone", width: 18, value: (c) => c.normalized },
  { header: "Original Phone", width: 18, value: (c) => c.original },
  { header: "Category", width: 26, value: (c) => c.companyCategory ?? "" },
  { header: "City", width: 16, value: (c) => c.city ?? "" },
  { header: "Language", width: 14, value: (c) => c.language ?? "" },
  // The normalised code alongside the raw cell, so a sheet mixing "Arabic",
  // "arabic" and "ar-SA" can still be grouped or filtered reliably.
  {
    header: "Language (matched)",
    width: 18,
    value: (c) => {
      const code = normalizeLanguage(c.language)
      return code ? languageLabel(code) : ""
    },
  },
  { header: "Website", width: 32, value: (c) => c.website ?? "" },
  { header: "Has Website", width: 12, value: (c) => (c.hasWebsite ? "Yes" : "No") },
  { header: "Status", width: 12, value: (c) => c.status },
  { header: "Sent At", width: 22, value: (c) => c.sentAt ?? "" },
  { header: "Source", width: 22, value: (c) => c.source },
  { header: "Notes", width: 30, value: (c) => c.notes ?? "" },
  // Always the universal form: the spreadsheet may be opened on a phone, and
  // wa.me opens the WhatsApp app there while still working on a desktop.
  { header: "WhatsApp Link", width: 46, value: (c) => (c.whatsappLink ? WhatsAppService.retargetLink(c.whatsappLink, "wa_me") : "") },
  { header: "Last Updated", width: 22, value: (c) => c.lastUpdated ?? "" },
]

/**
 * Guard against CSV/Excel formula injection.
 *
 * A cell starting with `=`, `+`, `-` or `@` is executed as a formula when the
 * file is opened, and this data came from spreadsheets uploaded by third
 * parties. Prefixing an apostrophe makes Excel treat it as text.
 */
function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

/**
 * Build an .xlsx workbook from a contact list.
 *
 * Any custom spreadsheet columns captured at import time (`dynamicData`) are
 * appended after the fixed columns, so an export round-trips everything the
 * original sheet carried instead of silently dropping it.
 */
export function buildContactsWorkbook(contacts: Contact[]): XLSX.WorkBook {
  const dynamicKeys = [
    ...new Set(contacts.flatMap((contact) => (contact.dynamicData ? Object.keys(contact.dynamicData) : []))),
  ].sort()

  const header = [...COLUMNS.map((column) => column.header), ...dynamicKeys]

  const rows = contacts.map((contact) => [
    ...COLUMNS.map((column) => safeCell(column.value(contact))),
    ...dynamicKeys.map((key) => safeCell(String(contact.dynamicData?.[key] ?? ""))),
  ])

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows])

  sheet["!cols"] = [...COLUMNS.map((column) => ({ wch: column.width })), ...dynamicKeys.map(() => ({ wch: 20 }))]
  // Header filter dropdowns, so the sheet is sortable by city or language the
  // moment it opens. (Freeze panes are not available in the bundled SheetJS
  // build, so the header row is left to Excel's own view settings.)
  sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } }) }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "Leads")

  return workbook
}

/** Build the workbook and hand it to the browser as a download. */
export function downloadContactsWorkbook(contacts: Contact[], filename: string): void {
  XLSX.writeFile(buildContactsWorkbook(contacts), filename, { bookType: "xlsx", compression: true })
}
