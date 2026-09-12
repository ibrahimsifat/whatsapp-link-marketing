/**
 * POST /api/contacts/import
 *
 * Bulk insert/merge from a file upload, Google Sheets import, or manual entry.
 * Deduplication is enforced by the unique index on `normalized`, so two
 * simultaneous imports of the same list cannot both insert the same number.
 */

import type { NextRequest } from "next/server"

import { handleRoute, ok } from "@/lib/api/response"
import { contactImportSchema } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import { importContacts } from "@/lib/db/repositories/contacts"
import type { Contact } from "@/app/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
/** Large imports need more than the default serverless budget. */
export const maxDuration = 60

export const POST = handleRoute(async (request: NextRequest) => {
  const session = await requireSession()

  const { contacts, source, filename } = contactImportSchema.parse(await request.json())
  const now = new Date().toISOString()

  const normalised = contacts.map(
    (contact) =>
      ({
        ...contact,
        id: contact.id ?? crypto.randomUUID(),
        companyName: contact.companyName ?? undefined,
        companyCategory: contact.companyCategory ?? undefined,
        website: contact.website ?? undefined,
        notes: contact.notes ?? undefined,
        sentAt: contact.sentAt ?? undefined,
        dynamicData: contact.dynamicData ?? undefined,
        source: contact.source || source,
        lastUpdated: now,
      }) as Contact,
  )

  const result = await importContacts(normalised, {
    source,
    filename: filename ?? undefined,
    actor: session.email,
  })

  const parts = [`${result.inserted} new`]
  if (result.updated > 0) parts.push(`${result.updated} updated`)
  if (result.duplicatesInPayload > 0) parts.push(`${result.duplicatesInPayload} duplicate rows skipped`)

  return ok(result, `Imported ${result.received} contacts: ${parts.join(", ")}`)
})
