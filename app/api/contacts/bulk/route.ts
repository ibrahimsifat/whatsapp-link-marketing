/**
 * /api/contacts/bulk
 *
 * PATCH  - set the same status on many contacts
 * DELETE - remove many contacts, or all of them
 *
 * These exist because the previous implementation looped one request per
 * contact. Selecting 500 contacts and marking them sent meant 500 sequential
 * writes; here it is a handful of batched statements.
 */

import type { NextRequest } from "next/server"

import { handleRoute, ok } from "@/lib/api/response"
import { bulkDeleteSchema, bulkStatusSchema } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import { bulkDeleteContacts, bulkUpdateStatus, deleteAllContacts } from "@/lib/db/repositories/contacts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const PATCH = handleRoute(async (request: NextRequest) => {
  await requireSession()

  const { ids, status, notes } = bulkStatusSchema.parse(await request.json())
  const updated = await bulkUpdateStatus(ids, status, notes ?? undefined)

  return ok({ updated }, `Updated ${updated} contact${updated === 1 ? "" : "s"}`)
})

export const DELETE = handleRoute(async (request: NextRequest) => {
  await requireSession()

  // `?all=true` clears the table. Requiring an explicit flag means a malformed
  // id list can never be mistaken for "delete everything".
  const all = new URL(request.url).searchParams.get("all") === "true"

  if (all) {
    const deleted = await deleteAllContacts()
    return ok({ deleted }, `Cleared ${deleted} contact${deleted === 1 ? "" : "s"}`)
  }

  const { ids } = bulkDeleteSchema.parse(await request.json())
  const deleted = await bulkDeleteContacts(ids)

  return ok({ deleted }, `Deleted ${deleted} contact${deleted === 1 ? "" : "s"}`)
})
