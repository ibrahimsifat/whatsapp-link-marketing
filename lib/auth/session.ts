/**
 * Session cookie handling
 *
 * The JWT lives in an HttpOnly cookie, never in localStorage. Anything readable
 * by JavaScript is readable by an XSS payload; an HttpOnly cookie is not, and
 * it is attached to same-origin requests automatically so the client never has
 * to manage a token at all.
 *
 * Cookie attributes:
 *   HttpOnly  - invisible to document.cookie
 *   SameSite  - "lax": sent on top-level navigation (so a bookmarked page
 *               works) but not on cross-site POSTs, which blocks CSRF
 *   Secure    - HTTPS only in production; omitted in dev so http://localhost works
 *   Path "/"  - the whole app is behind auth
 */

import { cookies } from "next/headers"
import type { NextResponse } from "next/server"

import { getSessionMaxAge, signSessionToken, verifySessionToken, type SessionClaims } from "./jwt"

export const SESSION_COOKIE = "wlm_session"

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

/** Read and verify the session from the incoming request's cookies. */
export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/** Attach a freshly signed session cookie to a response. */
export async function setSessionCookie(response: NextResponse, email: string, sid?: string): Promise<void> {
  const { token } = await signSessionToken({ email, sid })
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(getSessionMaxAge()))
}

/** Expire the session cookie. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0))
}
