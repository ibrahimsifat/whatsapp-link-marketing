/**
 * /api/templates/[id]
 *
 * PATCH  - update one language variant
 * DELETE - remove one language variant, or the whole template with ?group=1
 *
 * `id` addresses a single variant. Deleting a variant promotes a sibling to
 * fallback if needed; deleting with `?group=1` removes every language version
 * of the template, which is what the editor's "delete template" does.
 */

import type { NextRequest } from "next/server"

import { handleRoute, notFound, ok } from "@/lib/api/response"
import { templatePatchSchema } from "@/lib/api/schemas"
import { requireSession } from "@/lib/auth/guard"
import {
  deleteTemplateGroup,
  deleteTemplateVariant,
  getTemplateById,
  updateTemplate,
} from "@/lib/db/repositories/templates"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

export const PATCH = handleRoute(async (request: NextRequest, { params }: Params) => {
  await requireSession()

  const { id } = await params
  const patch = templatePatchSchema.parse(await request.json())

  const template = await updateTemplate(id, {
    ...patch,
    specificCategory: patch.specificCategory ?? undefined,
    imageUrl: patch.imageUrl ?? undefined,
  })

  return template ? ok(template, "Template updated") : notFound("Template not found")
})

export const DELETE = handleRoute(async (request: NextRequest, { params }: Params) => {
  await requireSession()

  const { id } = await params
  const deleteWholeGroup = new URL(request.url).searchParams.get("group") === "1"

  if (deleteWholeGroup) {
    const existing = await getTemplateById(id)
    if (!existing) return notFound("Template not found")

    const removed = await deleteTemplateGroup(existing.groupId)
    return ok({ id, groupId: existing.groupId, removed }, `Template deleted (${removed} language versions)`)
  }

  const { deleted, groupDeleted } = await deleteTemplateVariant(id)
  if (!deleted) return notFound("Template not found")

  return ok({ id, groupDeleted }, groupDeleted ? "Template deleted" : "Language version deleted")
})
