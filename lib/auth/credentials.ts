/**
 * Credential verification
 *
 * The application has a single hard-coded operator account, supplied through
 * the environment. There is no user table and no sign-up flow.
 *
 * Both comparisons are constant-time. A naive `===` on a secret leaks its
 * contents through timing: the comparison returns on the first differing byte,
 * so an attacker can recover the value one character at a time.
 */

import { getEnv } from "@/lib/env"

/** SHA-256 as lowercase hex, via Web Crypto so it runs on Node and the Edge. */
export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Compare two strings without leaking their contents through timing.
 *
 * Both inputs are hashed first, which also makes the comparison length-safe:
 * digests are always 32 bytes, so the loop count reveals nothing about the
 * length of the secret.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(a)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(b)),
  ])

  const viewA = new Uint8Array(digestA)
  const viewB = new Uint8Array(digestB)

  let diff = 0
  for (let i = 0; i < viewA.length; i++) {
    diff |= viewA[i] ^ viewB[i]
  }

  return diff === 0
}

export interface CredentialCheck {
  valid: boolean
  email: string
}

/**
 * Verify a submitted email/password pair against the configured operator.
 *
 * Always performs the full password comparison even when the email is wrong, so
 * the response time does not reveal whether an email address is the valid one.
 */
export async function verifyCredentials(email: string, password: string): Promise<CredentialCheck> {
  const env = getEnv()
  const normalizedEmail = email.trim().toLowerCase()

  const emailMatches = await timingSafeEqual(normalizedEmail, env.AUTH_EMAIL.trim().toLowerCase())

  let passwordMatches: boolean
  if (env.AUTH_PASSWORD_HASH) {
    const submittedHash = await sha256Hex(password)
    passwordMatches = await timingSafeEqual(submittedHash, env.AUTH_PASSWORD_HASH.toLowerCase())
  } else {
    passwordMatches = await timingSafeEqual(password, env.AUTH_PASSWORD ?? "")
  }

  return {
    valid: emailMatches && passwordMatches,
    email: env.AUTH_EMAIL,
  }
}
