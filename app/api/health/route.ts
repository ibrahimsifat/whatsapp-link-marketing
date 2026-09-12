/**
 * GET /api/health
 *
 * Public liveness probe. Reports database reachability and latency, and always
 * responds: a health check that 500s tells a monitor nothing useful.
 */

import { NextResponse } from "next/server"

import { checkDatabaseHealth } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const database = await checkDatabaseHealth()

  return NextResponse.json(
    {
      success: database.ok,
      message: database.ok ? "Healthy" : "Database unreachable",
      data: {
        status: database.ok ? "healthy" : "degraded",
        database,
        timestamp: new Date().toISOString(),
      },
    },
    { status: database.ok ? 200 : 503 },
  )
}
