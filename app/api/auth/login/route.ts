/**
 * POST /api/auth/login
 *
 * Verifies the hard-coded operator credentials and issues a session cookie.
 */

import { NextResponse, type NextRequest } from "next/server"

import { fail, handleRoute, ok } from "@/lib/api/response"
import { loginSchema } from "@/lib/api/schemas"
import { verifyCredentials } from "@/lib/auth/credentials"
import { setSessionCookie } from "@/lib/auth/session"
import { checkRateLimit, pruneOldAttempts, recordAttempt } from "@/lib/db/repositories/auth-attempts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Best-effort client IP, reading the headers a proxy actually sets. */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? "unknown"
}

export const POST = handleRoute(async (request: NextRequest) => {
  const body = await request.json().catch(() => null)
  if (!body) return fail("Request body must be valid JSON", 400)

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    // Deliberately vague: field-level detail here would confirm which half of
    // the credential pair was wrong.
    return fail("Email and password are required", 422)
  }

  const { email, password } = parsed.data
  const ip = clientIp(request)
  const userAgent = request.headers.get("user-agent")

  // --- Rate limit -----------------------------------------------------------
  const limit = await checkRateLimit(email, ip)
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many failed attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    )
  }

  // --- Verify ---------------------------------------------------------------
  const { valid, email: operatorEmail } = await verifyCredentials(email, password)

  // Logging the attempt must never block or fail the login itself.
  void recordAttempt({ email, ip, success: valid, userAgent }).catch((error) =>
    console.error("[auth] Failed to record login attempt:", error),
  )

  if (!valid) {
    return fail("Invalid email or password", 401)
  }

  // Housekeeping, fire-and-forget.
  void pruneOldAttempts()

  const response = ok({ email: operatorEmail, role: "admin" as const }, "Signed in successfully")
  await setSessionCookie(response, operatorEmail)
  return response
})
