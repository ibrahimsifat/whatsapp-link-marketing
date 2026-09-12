/**
 * /api/templates
 *
 * GET  - every message template
 * POST - create a template
 *
 * Templates are seeded on first read so a fresh database is never empty and the
 * operator sees the same starter set the app always shipped with.
 */

import type { NextRequest } from "next/server"

import { created, handleRoute, ok } from "@/lib/api/response"
import { templateInputSchema } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import { createTemplate, listTemplates, seedDefaultTemplates } from "@/lib/db/repositories/templates"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = handleRoute(async () => {
  await requireSession()

  let templates = await listTemplates()

  if (templates.length === 0) {
    // Idempotent seed: safe even if two requests race, because the insert uses
    // ON CONFLICT DO NOTHING against the primary key.
    await seedDefaultTemplates()
    templates = await listTemplates()
  }

  return ok(templates, "Templates loaded")
})

export const POST = handleRoute(async (request: NextRequest) => {
  await requireSession()

  const input = templateInputSchema.parse(await request.json())

  const id = input.id ?? crypto.randomUUID()

  const template = await createTemplate({
    ...input,
    id,
    // No groupId means this is a new template rather than a translation of an
    // existing one, so it starts a group of its own.
    groupId: input.groupId ?? id,
    specificCategory: input.specificCategory ?? undefined,
    imageUrl: input.imageUrl ?? undefined,
  })

  return created(template, "Template created")
})
