/**
 * Login attempt repository (rate limiting)
 *
 * Attempts are persisted rather than counted in process memory. On a serverless
 * host each request may hit a different, cold instance, so an in-memory counter
 * is trivially bypassed by an attacker simply retrying until they land on a
 * fresh instance.
 */

import { and, count, eq, gte, lt, or } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { authAttempts } from "@/lib/db/schema"

/** Failed attempts allowed from one IP (or for one email) per window. */
export const MAX_ATTEMPTS = 8

/** Rolling window length in milliseconds. */
export const WINDOW_MS = 15 * 60 * 1000

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export async function recordAttempt(input: {
  email: string
  ip: string
  success: boolean
  userAgent?: string | null
}): Promise<void> {
  const db = getDb()
  await db.insert(authAttempts).values({
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    ip: input.ip || "unknown",
    success: input.success,
    userAgent: input.userAgent?.slice(0, 300) ?? null,
    createdAt: new Date().toISOString(),
  })
}

/**
 * Count recent failures for an IP/email pair.
 *
 * Fails open: if D1 is unreachable the operator must still be able to log in,
 * and a brute-force attempt would be failing on the same outage anyway.
 */
export async function checkRateLimit(email: string, ip: string): Promise<RateLimitStatus> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

  try {
    const db = getDb()
    const [row] = await db
      .select({ value: count() })
      .from(authAttempts)
      .where(
        and(
          eq(authAttempts.success, false),
          gte(authAttempts.createdAt, windowStart),
          or(eq(authAttempts.ip, ip || "unknown"), eq(authAttempts.email, email.toLowerCase())),
        ),
      )

    const failures = row?.value ?? 0

    return {
      allowed: failures < MAX_ATTEMPTS,
      remaining: Math.max(0, MAX_ATTEMPTS - failures),
      retryAfterSeconds: failures >= MAX_ATTEMPTS ? Math.ceil(WINDOW_MS / 1000) : 0,
    }
  } catch (error) {
    console.error("[auth] Rate limit check failed, allowing the attempt:", error)
    return { allowed: true, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0 }
  }
}

/** Drop attempts older than the window so the table cannot grow without bound. */
export async function pruneOldAttempts(olderThanMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db = getDb()
    const cutoff = new Date(Date.now() - olderThanMs).toISOString()
    await db.delete(authAttempts).where(lt(authAttempts.createdAt, cutoff))
  } catch (error) {
    console.error("[auth] Failed to prune old login attempts:", error)
  }
}
