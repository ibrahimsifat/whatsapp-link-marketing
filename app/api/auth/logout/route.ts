/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. Idempotent: logging out twice is not an error.
 */

import { clearSessionCookie } from "@/lib/auth/session"
import { handleRoute, ok } from "@/lib/api/response"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const POST = handleRoute(async () => {
  const response = ok({ signedOut: true }, "Signed out successfully")
  clearSessionCookie(response)
  return response
})
