/**
 * Authentication proxy (the Next.js 16 replacement for middleware.ts)
 *
 * Runs before every matched request and enforces one rule: no session, no
 * access. Pages redirect to /login; API routes get a 401 JSON envelope so the
 * client can react without trying to parse an HTML redirect.
 *
 * It also refreshes sessions that are close to expiring, which keeps a daily
 * user permanently signed in while still expiring abandoned sessions.
 *
 * This runs on the Edge runtime: no Node APIs, no database access. It only
 * verifies the JWT signature, which `jose` does with Web Crypto.
 */

import { NextResponse, type NextRequest } from "next/server"

import { getSessionMaxAge, shouldRefresh, signSessionToken, verifySessionToken } from "@/lib/auth/jwt"
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session"

/** Paths reachable without a session. */
const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/health"])

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname)
}

function isApiRequest(pathname: string): boolean {
  return pathname.startsWith("/api/")
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const claims = await verifySessionToken(token)

  // --- Already signed in: keep them off the login page ----------------------
  if (pathname === "/login" && claims) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // --- Not signed in --------------------------------------------------------
  if (!claims) {
    if (isApiRequest(pathname)) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const loginUrl = new URL("/login", request.url)
    // Preserve the destination so the user lands where they meant to go.
    if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  // --- Signed in: slide the expiry forward when it is close ------------------
  const response = NextResponse.next()

  if (shouldRefresh(claims)) {
    try {
      const { token: refreshed } = await signSessionToken({ email: claims.email, sid: claims.sid })
      response.cookies.set(SESSION_COOKIE, refreshed, sessionCookieOptions(getSessionMaxAge()))
    } catch (error) {
      // A failed refresh must not break the request; the existing token is
      // still valid, and the user simply gets another chance next time.
      console.error("[proxy] Session refresh failed:", error)
    }
  }

  return response
}

export const config = {
  /**
   * Everything except Next.js internals and static assets. Auth is opt-out, not
   * opt-in: a new route is protected by default.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml|webmanifest)$).*)"],
}
