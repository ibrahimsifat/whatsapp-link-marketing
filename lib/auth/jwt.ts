/**
 * JWT issuing and verification
 *
 * Uses `jose` rather than `jsonwebtoken` because the token has to be verified
 * inside Next.js middleware, which runs on the Edge runtime where Node's
 * `crypto` module is unavailable. `jose` is built on Web Crypto and runs in
 * both places unchanged.
 *
 * Tokens are signed with HS256. There is a single issuer and a single consumer
 * (this app), so a symmetric secret is the right trade-off — no key
 * distribution problem to solve.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose"

const ISSUER = "whatsapp-link-marketing"
const AUDIENCE = "whatsapp-link-marketing:web"

export interface SessionClaims extends JWTPayload {
  /** Subject: the operator's email. */
  sub: string
  email: string
  role: "admin"
  /** Random per-session id, useful for correlating logs. */
  sid: string
}

let cachedKey: Uint8Array | null = null

/**
 * Read the signing secret straight from `process.env`.
 *
 * This module is imported by Edge middleware, which must not depend on the full
 * server env schema — middleware has no business failing to start because a
 * database credential is missing. Hence the direct, narrow read here rather
 * than `getEnv()`.
 */
function getSigningKey(): Uint8Array {
  if (!cachedKey) {
    const secret = process.env.JWT_SECRET
    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET is missing or shorter than 32 characters")
    }
    cachedKey = new TextEncoder().encode(secret)
  }
  return cachedKey
}

/** Session lifetime in seconds. Defaults to 7 days. */
export function getSessionMaxAge(): number {
  const parsed = Number(process.env.SESSION_MAX_AGE)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 60 * 60 * 24 * 7
}

/** Issue a signed session token. */
export async function signSessionToken(input: { email: string; sid?: string }): Promise<{
  token: string
  expiresAt: Date
  sid: string
}> {
  const sid = input.sid ?? crypto.randomUUID()
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAtSeconds = issuedAt + getSessionMaxAge()

  const token = await new SignJWT({ email: input.email, role: "admin", sid })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.email)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(issuedAt)
    .setNotBefore(issuedAt)
    .setExpirationTime(expiresAtSeconds)
    .sign(getSigningKey())

  return { token, expiresAt: new Date(expiresAtSeconds * 1000), sid }
}

/**
 * Verify a token and return its claims, or `null` if it is invalid.
 *
 * Never throws: callers treat a `null` result as "not authenticated", and an
 * expired or tampered token is an expected condition, not an exceptional one.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSigningKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
      // Small tolerance for clock skew between the signing and verifying hosts.
      clockTolerance: 5,
    })

    if (!payload.sub || payload.role !== "admin") return null

    return payload as SessionClaims
  } catch {
    return null
  }
}

/**
 * Whether a token is close enough to expiry to be worth reissuing.
 *
 * Sliding sessions: an operator who uses the app daily is never logged out,
 * while an abandoned session still expires on schedule.
 */
export function shouldRefresh(claims: SessionClaims, thresholdSeconds = 60 * 60 * 24): boolean {
  if (!claims.exp) return false
  const secondsRemaining = claims.exp - Math.floor(Date.now() / 1000)
  return secondsRemaining > 0 && secondsRemaining < thresholdSeconds
}
