/**
 * GET /api/auth/me
 *
 * Returns the current operator. The client uses this to hydrate its auth state
 * without ever seeing the token itself, which stays HttpOnly.
 */

import { handleRoute, ok } from "@/lib/api/response"
import { requireSession } from "@/lib/auth/guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = handleRoute(async () => {
  const session = await requireSession()

  return ok({
    email: session.email,
    role: session.role,
    sessionId: session.sid,
    expiresAt: session.exp ? new Date(session.exp * 1000).toISOString() : null,
  })
})
