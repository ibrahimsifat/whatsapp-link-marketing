/**
 * Route guard
 *
 * Middleware already blocks unauthenticated traffic, but every API route
 * re-checks the session anyway. Middleware matchers are configuration, and
 * configuration drifts — a route added under a path the matcher misses would be
 * silently public. Authorisation belongs next to the data it protects.
 */

import type { NextResponse } from "next/server"

import { UnauthorizedError, unauthorized } from "@/lib/api/response"
import { getSession } from "./session"
import type { SessionClaims } from "./jwt"

export { UnauthorizedError }

/**
 * Return the current session or throw.
 *
 * Use inside a `handleRoute` wrapper, which converts the throw into a 401.
 */
export async function requireSession(): Promise<SessionClaims> {
  const session = await getSession()
  if (!session) throw new UnauthorizedError()
  return session
}

/** Non-throwing variant for handlers that want to branch on auth themselves. */
export async function withSession(): Promise<
  { session: SessionClaims; response: null } | { session: null; response: NextResponse }
> {
  const session = await getSession()
  if (!session) return { session: null, response: unauthorized() }
  return { session, response: null }
}
