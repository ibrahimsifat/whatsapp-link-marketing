/**
 * API response helpers
 *
 * Every route returns the same envelope, so the client has exactly one shape to
 * handle: `{ success, data?, message, errors?, meta? }`.
 *
 * `handleRoute` is the important piece. Wrapping a handler in it guarantees
 * that an unexpected throw becomes a structured 500 instead of a stack trace
 * leaking to the browser, and that known failure modes (validation, unique
 * constraints, database outages) map onto the right HTTP status.
 */

import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { D1Error, UniqueConstraintError } from "@/lib/db/d1-http"
import { ConfigurationError } from "@/lib/env"
import { R2ConfigurationError, R2Error } from "@/lib/r2"

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message: string
  errors?: string[]
  meta?: Record<string, unknown>
}

// ============================================================================
// SUCCESS
// ============================================================================

export function ok<T>(data: T, message = "OK", meta?: Record<string, unknown>): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ success: true, data, message, ...(meta ? { meta } : {}) })
}

export function created<T>(data: T, message = "Created"): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ success: true, data, message }, { status: 201 })
}

// ============================================================================
// FAILURE
// ============================================================================

export function fail(message: string, status = 400, errors?: string[]): NextResponse<ApiEnvelope<never>> {
  return NextResponse.json({ success: false, message, ...(errors ? { errors } : {}) }, { status })
}

export const unauthorized = (message = "Authentication required") => fail(message, 401)
export const notFound = (message = "Not found") => fail(message, 404)

/**
 * Thrown by `requireSession`. Declared here rather than in the auth module so
 * `toErrorResponse` can recognise it without creating an import cycle.
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

// ============================================================================
// ERROR TRANSLATION
// ============================================================================

/** Map a thrown error onto an HTTP response, without leaking internals. */
export function toErrorResponse(error: unknown): NextResponse<ApiEnvelope<never>> {
  if (error instanceof UnauthorizedError) {
    return unauthorized(error.message)
  }

  if (error instanceof ConfigurationError) {
    console.error("[api] Configuration error:", error.message)
    // The detail names environment variables, which is exactly what a developer
    // needs during setup and exactly what should not be echoed to the public in
    // production. Hence the split.
    return fail(
      process.env.NODE_ENV === "production"
        ? "The server is not configured correctly. Check the server logs."
        : `Server misconfigured:\n${error.details}`,
      500,
    )
  }

  if (error instanceof ZodError) {
    return fail(
      "Validation failed",
      422,
      error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`),
    )
  }

  if (error instanceof UniqueConstraintError) {
    return fail("That record already exists", 409)
  }

  if (error instanceof D1Error) {
    console.error("[api] Database error:", { message: error.message, sql: error.sql, status: error.status })
    // 503 rather than 500: the request itself was fine, the datastore was not,
    // and the caller can sensibly retry.
    return fail("The database is temporarily unavailable. Please try again.", 503)
  }

  if (error instanceof R2ConfigurationError) {
    return fail(error.message, 503)
  }

  if (error instanceof R2Error) {
    console.error("[api] R2 upload error:", { message: error.message, status: error.status })
    return fail("The image upload failed. Please try again.", 502)
  }

  console.error("[api] Unhandled error:", error)
  return fail("An unexpected error occurred", 500)
}

/**
 * Wrap a route handler so no error escapes unformatted.
 *
 * Usage: `export const GET = handleRoute(async (req) => ok(await load()))`
 */
export function handleRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args)
    } catch (error) {
      return toErrorResponse(error)
    }
  }
}
