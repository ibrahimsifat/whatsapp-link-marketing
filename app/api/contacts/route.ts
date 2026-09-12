/**
 * /api/contacts
 *
 * GET  - paginated, filtered, searchable contact list
 * POST - create a single contact
 *
 * Filtering, sorting and pagination all happen in SQL. The browser no longer
 * downloads the entire contact list to render one page of twenty rows.
 */

import type { NextRequest } from "next/server"

import { created, handleRoute, ok } from "@/lib/api/response"
import { contactInputSchema, contactListQuerySchema, parseQuery } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import { createContact, listContacts } from "@/lib/db/repositories/contacts"
import type { Contact } from "@/app/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = handleRoute(async (request: NextRequest) => {
  await requireSession()

  const query = parseQuery(contactListQuerySchema, new URL(request.url))
  const result = await listContacts(query)

  return ok(result.contacts, "Contacts loaded", {
    page: result.page,
    perPage: result.perPage,
    total: result.total,
    totalPages: result.totalPages,
  })
})

export const POST = handleRoute(async (request: NextRequest) => {
  await requireSession()

  const body = await request.json()
  const input = contactInputSchema.parse(body)
  const now = new Date().toISOString()

  const contact = await createContact({
    ...input,
    id: input.id ?? crypto.randomUUID(),
    companyName: input.companyName ?? undefined,
    companyCategory: input.companyCategory ?? undefined,
    website: input.website ?? undefined,
    notes: input.notes ?? undefined,
    sentAt: input.sentAt ?? undefined,
    dynamicData: input.dynamicData ?? undefined,
    lastUpdated: now,
  } as Contact)

  return created(contact, "Contact created")
})
