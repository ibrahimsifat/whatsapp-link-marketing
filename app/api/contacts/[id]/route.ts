/**
 * /api/contacts/[id]
 *
 * GET    - one contact
 * PATCH  - partial update (including status changes)
 * DELETE - remove a contact
 */

import type { NextRequest } from "next/server"

import { handleRoute, notFound, ok } from "@/lib/api/response"
import { contactPatchSchema } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import { deleteContact, getContactById, updateContact } from "@/lib/db/repositories/contacts"
import type { Contact } from "@/app/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

export const GET = handleRoute(async (_request: NextRequest, { params }: Params) => {
  await requireSession()

  const { id } = await params
  const contact = await getContactById(id)

  return contact ? ok(contact, "Contact loaded") : notFound("Contact not found")
})

export const PATCH = handleRoute(async (request: NextRequest, { params }: Params) => {
  await requireSession()

  const { id } = await params
  const patch = contactPatchSchema.parse(await request.json())

  const contact = await updateContact(id, patch as Partial<Contact>)
  return contact ? ok(contact, "Contact updated") : notFound("Contact not found")
})

export const DELETE = handleRoute(async (_request: NextRequest, { params }: Params) => {
  await requireSession()

  const { id } = await params
  const deleted = await deleteContact(id)

  return deleted ? ok({ id }, "Contact deleted") : notFound("Contact not found")
})
