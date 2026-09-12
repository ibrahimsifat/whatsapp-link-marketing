/**
 * /api/send-history
 *
 * GET  - paginated audit log
 * POST - record one or more sends, optionally flipping the contacts to "sent"
 *
 * The bulk sender calls POST once at the end of a run rather than per message,
 * so a 500-contact campaign costs a couple of requests instead of a thousand.
 */

import type { NextRequest } from "next/server"

import { created, handleRoute, ok } from "@/lib/api/response"
import { parseQuery, sendHistoryCreateSchema, sendHistoryQuerySchema } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import { bulkUpdateStatus } from "@/lib/db/repositories/contacts"
import { listSendHistory, recordSends } from "@/lib/db/repositories/send-history"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export const GET = handleRoute(async (request: NextRequest) => {
  await requireSession()

  const query = parseQuery(sendHistoryQuerySchema, new URL(request.url))
  const result = await listSendHistory(query)

  return ok(result.entries, "Send history loaded", {
    page: result.page,
    perPage: result.perPage,
    total: result.total,
    totalPages: result.totalPages,
  })
})

export const POST = handleRoute(async (request: NextRequest) => {
  const session = await requireSession()

  const { entries, markContactsSent } = sendHistoryCreateSchema.parse(await request.json())

  const recorded = await recordSends(entries.map((entry) => ({ ...entry, actor: session.email })))

  let contactsUpdated = 0
  if (markContactsSent) {
    const sentIds = entries
      .filter((entry) => entry.status === "sent" && entry.contactId)
      .map((entry) => entry.contactId as string)

    if (sentIds.length > 0) {
      contactsUpdated = await bulkUpdateStatus([...new Set(sentIds)], "sent")
    }
  }

  return created({ recorded, contactsUpdated }, `Recorded ${recorded} send${recorded === 1 ? "" : "s"}`)
})
