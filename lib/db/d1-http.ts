/**
 * Cloudflare D1 HTTP client
 *
 * D1's native binding is only available inside the Workers runtime. On a Node
 * host (Vercel, a VPS, Docker) the database is reached through Cloudflare's
 * REST API instead. This module is the single place that speaks HTTP to D1.
 *
 * It deliberately uses the `/raw` endpoint rather than `/query`: `/raw` returns
 * positional rows (`{ columns, rows }`), which is exactly the shape Drizzle's
 * sqlite-proxy driver expects, and it avoids the ambiguity of duplicate column
 * names in joins.
 *
 * Responsibilities:
 *  - request signing (bearer token)
 *  - timeouts, because an unbounded fetch hangs a serverless function until the
 *    platform kills it, burning the whole invocation budget
 *  - retry with exponential backoff and jitter, for transient failures only
 *  - turning Cloudflare's error envelope into a typed, throwable error
 */

import { getEnv } from "@/lib/env"

// ============================================================================
// TYPES
// ============================================================================

export type SqlParam = string | number | boolean | null

export interface D1Statement {
  sql: string
  params?: SqlParam[]
}

export interface D1Meta {
  duration?: number
  rows_read?: number
  rows_written?: number
  last_row_id?: number
  changes?: number
  changed_db?: boolean
  served_by?: string
}

/** Result of a single statement executed through the `/raw` endpoint. */
export interface D1RawResult {
  columns: string[]
  /** Rows as arrays of positional values. */
  rows: SqlParam[][]
  meta: D1Meta
  success: boolean
}

interface CloudflareMessage {
  code?: number
  message: string
}

interface CloudflareEnvelope<T> {
  result: T
  success: boolean
  errors: CloudflareMessage[]
  messages: CloudflareMessage[]
}

/**
 * One statement result as Cloudflare returns it.
 *
 * `results` is a `{ columns, rows }` object from `/raw`, an array of row objects
 * from `/query`, or absent for a statement with no result set.
 */
interface D1ResultEntry {
  results?: { columns?: string[]; rows?: SqlParam[][] } | Record<string, SqlParam>[]
  meta?: D1Meta
  success?: boolean
}

// ============================================================================
// ERRORS
// ============================================================================

/** Any failure originating from the D1 HTTP transport or from SQLite itself. */
export class D1Error extends Error {
  readonly status: number
  readonly code?: number
  readonly sql?: string
  readonly retryable: boolean

  constructor(
    message: string,
    options: { status?: number; code?: number; sql?: string; retryable?: boolean; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = "D1Error"
    this.status = options.status ?? 0
    this.code = options.code
    this.sql = options.sql
    this.retryable = options.retryable ?? false
  }
}

/** Thrown when a write violates a UNIQUE constraint, e.g. a duplicate phone. */
export class UniqueConstraintError extends D1Error {
  constructor(message: string, sql?: string) {
    super(message, { status: 409, sql })
    this.name = "UniqueConstraintError"
  }
}

// ============================================================================
// INTERNALS
// ============================================================================

const CF_API_BASE = "https://api.cloudflare.com/client/v4"

/** HTTP statuses worth retrying: rate limits, gateway hiccups, upstream resets. */
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Exponential backoff with full jitter, capped at 2s. */
function backoffDelay(attempt: number): number {
  const base = Math.min(2_000, 150 * 2 ** attempt)
  return Math.round(Math.random() * base)
}

function isUniqueViolation(message: string): boolean {
  return /UNIQUE constraint failed/i.test(message)
}

function describeErrors(errors: CloudflareMessage[]): string {
  if (!errors?.length) return "Unknown D1 error"
  return errors.map((e) => (e.code ? `[${e.code}] ${e.message}` : e.message)).join("; ")
}

/** Normalise a `/raw` payload, tolerating the object-array shape of `/query`. */
function normaliseResult(entry: D1ResultEntry): D1RawResult {
  const results = entry?.results
  const meta: D1Meta = entry?.meta ?? {}

  // `/raw` shape: { columns: [...], rows: [[...]] }
  if (results && !Array.isArray(results) && Array.isArray(results.rows)) {
    return {
      columns: results.columns ?? [],
      rows: results.rows,
      meta,
      success: entry?.success ?? true,
    }
  }

  // `/query` shape: an array of row objects. Derive column order from the first row.
  if (Array.isArray(results)) {
    const columns = results.length > 0 ? Object.keys(results[0]) : []
    return {
      columns,
      rows: results.map((row) => columns.map((c) => row[c])),
      meta,
      success: entry?.success ?? true,
    }
  }

  // A statement with no result set: INSERT/UPDATE/DELETE without RETURNING.
  return { columns: [], rows: [], meta, success: entry?.success ?? true }
}

// ============================================================================
// CLIENT
// ============================================================================

export class D1HttpClient {
  private readonly accountId: string
  private readonly databaseId: string
  private readonly token: string
  private readonly timeoutMs: number
  private readonly maxRetries: number

  constructor(config?: {
    accountId?: string
    databaseId?: string
    token?: string
    timeoutMs?: number
    maxRetries?: number
  }) {
    const env = getEnv()
    this.accountId = config?.accountId ?? env.CLOUDFLARE_ACCOUNT_ID
    this.databaseId = config?.databaseId ?? env.CLOUDFLARE_D1_DATABASE_ID
    this.token = config?.token ?? env.CLOUDFLARE_API_TOKEN
    this.timeoutMs = config?.timeoutMs ?? env.D1_TIMEOUT_MS
    this.maxRetries = config?.maxRetries ?? env.D1_MAX_RETRIES
  }

  private get endpoint(): string {
    return `${CF_API_BASE}/accounts/${this.accountId}/d1/database/${this.databaseId}/raw`
  }

  /** Execute one statement and return its positional result set. */
  async execute(statement: D1Statement): Promise<D1RawResult> {
    const [result] = await this.send(statement)
    return result ?? { columns: [], rows: [], meta: {}, success: true }
  }

  /**
   * Execute several statements in order.
   *
   * IMPORTANT: this is NOT a transaction. Cloudflare's REST API accepts exactly
   * one `{ sql, params }` object per request, so there is no way to send several
   * parameterised statements as one atomic unit — the transactional `batch()`
   * primitive only exists for the native Workers binding. Statements are
   * therefore issued sequentially, and a failure part-way through leaves the
   * earlier writes applied.
   *
   * Because of that, bulk operations in the repositories are written as a
   * SINGLE statement using `json_each()` rather than as many statements here.
   * This method exists for the handful of genuinely independent writes.
   */
  async executeMany(statements: D1Statement[]): Promise<D1RawResult[]> {
    const results: D1RawResult[] = []
    for (const statement of statements) {
      results.push(await this.execute(statement))
    }
    return results
  }

  /** Cheap liveness probe used by the health endpoint. */
  async ping(): Promise<{ ok: true; durationMs: number }> {
    const started = Date.now()
    await this.execute({ sql: "SELECT 1" })
    return { ok: true, durationMs: Date.now() - started }
  }

  // --------------------------------------------------------------------------

  private async send(statement: D1Statement): Promise<D1RawResult[]> {
    // The REST API takes exactly one statement per request. Sending an array
    // here is rejected by Cloudflare, so the shape is fixed.
    const body = { sql: statement.sql, params: statement.params ?? [] }
    const firstSql = statement.sql
    let lastError: D1Error | null = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) await sleep(backoffDelay(attempt - 1))

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
          cache: "no-store",
        })

        const text = await response.text()
        let payload: CloudflareEnvelope<D1ResultEntry[]>

        try {
          payload = JSON.parse(text)
        } catch {
          throw new D1Error(`D1 returned a non-JSON response (HTTP ${response.status}): ${text.slice(0, 300)}`, {
            status: response.status,
            sql: firstSql,
            retryable: RETRYABLE_STATUSES.has(response.status),
          })
        }

        if (!response.ok || !payload.success) {
          const message = describeErrors(payload.errors)

          if (isUniqueViolation(message)) {
            throw new UniqueConstraintError(message, firstSql)
          }

          throw new D1Error(`D1 request failed: ${message}`, {
            status: response.status,
            code: payload.errors?.[0]?.code,
            sql: firstSql,
            retryable: RETRYABLE_STATUSES.has(response.status),
          })
        }

        return (payload.result ?? []).map(normaliseResult)
      } catch (error) {
        if (error instanceof UniqueConstraintError) throw error

        if (error instanceof D1Error) {
          lastError = error
          if (!error.retryable || attempt === this.maxRetries) throw error
          continue
        }

        // AbortError (timeout) and network-level failures are transient.
        const isAbort = error instanceof Error && error.name === "AbortError"
        lastError = new D1Error(
          isAbort
            ? `D1 request timed out after ${this.timeoutMs}ms`
            : `D1 network error: ${error instanceof Error ? error.message : String(error)}`,
          { sql: firstSql, retryable: true, cause: error },
        )

        if (attempt === this.maxRetries) throw lastError
      } finally {
        clearTimeout(timer)
      }
    }

    throw lastError ?? new D1Error("D1 request failed for an unknown reason", { sql: firstSql })
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

declare global {
  var __d1HttpClient: D1HttpClient | undefined
}

/**
 * Shared client instance.
 *
 * Cached on `globalThis` so Next.js dev-server hot reloads, which re-evaluate
 * modules, do not allocate a new client on every request.
 */
export function getD1Client(): D1HttpClient {
  if (!globalThis.__d1HttpClient) {
    globalThis.__d1HttpClient = new D1HttpClient()
  }
  return globalThis.__d1HttpClient
}
