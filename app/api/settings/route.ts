/**
 * /api/settings
 *
 * GET - all settings as a key/value map
 * PUT - upsert one or more settings in a single transactional batch
 *
 * This is where the custom message now lives. Previously it was in the
 * operator's localStorage, so it vanished on a different machine or browser.
 */

import type { NextRequest } from "next/server"

import { handleRoute, ok } from "@/lib/api/response"
import { settingsPatchSchema } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import { getSettings, setSettings } from "@/lib/db/repositories/settings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = handleRoute(async () => {
  await requireSession()
  return ok(await getSettings(), "Settings loaded")
})

export const PUT = handleRoute(async (request: NextRequest) => {
  await requireSession()

  const patch = settingsPatchSchema.parse(await request.json())
  await setSettings(patch)

  return ok(patch, "Settings saved")
})
