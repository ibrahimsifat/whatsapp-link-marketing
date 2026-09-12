/**
 * GET /api/contacts/stats
 *
 * Aggregate counters plus the distinct category list used by the filters.
 * Computed with SQL aggregates rather than by counting rows in JavaScript, so
 * the cost does not grow with the size of the contact list.
 */

import { handleRoute, ok } from "@/lib/api/response"
import { requireSession } from "@/lib/auth/guard"
import { getContactCategories, getContactStats } from "@/lib/db/repositories/contacts"
import { getSendSummary } from "@/lib/db/repositories/send-history"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = handleRoute(async () => {
  await requireSession()

  const [stats, categories, sends] = await Promise.all([
    getContactStats(),
    getContactCategories(),
    getSendSummary(),
  ])

  return ok({ ...stats, categories, sends }, "Statistics loaded")
})
