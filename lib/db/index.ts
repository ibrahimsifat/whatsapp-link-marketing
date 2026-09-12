/**
 * Database connection
 *
 * Binds Drizzle's `sqlite-proxy` driver to the Cloudflare D1 HTTP transport.
 *
 * The proxy driver hands us raw SQL plus positional parameters and expects
 * positional rows back. The contract differs per method and is easy to get
 * subtly wrong, so it is spelled out here:
 *
 *   - "all" / "values" -> { rows: [[col1, col2], [col1, col2]] }  (array of rows)
 *   - "get"            -> { rows: [col1, col2] }                  (ONE flat row)
 *   - "run"            -> { rows: [] }                            (no result set)
 *
 * Returning an array of arrays for "get" silently yields garbage objects rather
 * than an error, which is why `toProxyResult` is centralised and commented.
 */

import { drizzle } from "drizzle-orm/sqlite-proxy"
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy"

import { getEnv } from "@/lib/env"
import { getD1Client, type D1RawResult, type SqlParam } from "./d1-http"
import * as schema from "./schema"

export * from "./schema"
export { D1Error, UniqueConstraintError } from "./d1-http"

export type Database = SqliteRemoteDatabase<typeof schema>

type ProxyMethod = "run" | "all" | "values" | "get"

/** Map a D1 result set onto the shape the proxy driver expects for `method`. */
function toProxyResult(result: D1RawResult, method: ProxyMethod): { rows: unknown[] } {
  const rows = result?.rows ?? []

  if (method === "get") {
    // A single flat row, or an empty array when nothing matched.
    return { rows: (rows[0] as SqlParam[] | undefined) ?? [] }
  }

  if (method === "run") {
    return { rows: [] }
  }

  return { rows }
}

function createDatabase(): Database {
  const env = getEnv()
  const client = getD1Client()

  return drizzle<typeof schema>(
    // --- single statement ---------------------------------------------------
    async (sql, params, method) => {
      const result = await client.execute({ sql, params: params as SqlParam[] })
      return toProxyResult(result, method)
    },
    // --- batch --------------------------------------------------------------
    // Sequential, NOT atomic: Cloudflare's REST API accepts one parameterised
    // statement per request, so `db.batch()` cannot roll back here the way it
    // does with a native Workers binding. It is kept working (and correct) for
    // independent writes; anything that must not half-apply is written as a
    // single `json_each()` statement in the repositories instead.
    async (queries) => {
      const results = await client.executeMany(
        queries.map((q) => ({ sql: q.sql, params: q.params as SqlParam[] })),
      )
      return results.map((result, i) => toProxyResult(result, queries[i].method))
    },
    {
      schema,
      logger: env.DB_LOGGING,
    },
  )
}

// ============================================================================
// SINGLETON
// ============================================================================

declare global {
  var __db: Database | undefined
}

/**
 * The shared database handle.
 *
 * Cached on `globalThis` so the Next.js dev server does not build a new Drizzle
 * instance on every hot reload, and so a warm serverless instance reuses the
 * same client across requests.
 *
 * This is lazy on purpose: importing the module must not throw when the
 * environment is missing, otherwise the build itself fails. Errors surface at
 * the first query instead, where they can be handled and reported.
 */
export function getDb(): Database {
  if (!globalThis.__db) {
    globalThis.__db = createDatabase()
  }
  return globalThis.__db
}

/**
 * Connection health check.
 *
 * Never throws — returns a structured result so `/api/health` can report a
 * degraded database without turning into a 500 itself.
 */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean
  latencyMs: number | null
  error: string | null
}> {
  const started = Date.now()
  try {
    await getD1Client().ping()
    return { ok: true, latencyMs: Date.now() - started, error: null }
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
