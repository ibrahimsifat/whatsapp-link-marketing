/**
 * Message templates repository
 */

import { and, asc, eq, ne } from "drizzle-orm"

import type { MessageTemplate } from "@/app/types/contact"
import { DEFAULT_TEMPLATES } from "@/app/constants/app-constants"
import { getDb } from "@/lib/db"
import { rowToTemplate, templateToRow } from "@/lib/db/mappers"
import { messageTemplates, type MessageTemplateRow, type NewMessageTemplateRow } from "@/lib/db/schema"

export type StoredTemplate = MessageTemplate & { isDefault: boolean }

export async function listTemplates(): Promise<StoredTemplate[]> {
  const db = getDb()
  const rows = await db.select().from(messageTemplates).orderBy(asc(messageTemplates.name))
  return rows.map(rowToTemplate)
}

export async function getTemplateById(id: string): Promise<StoredTemplate | null> {
  const db = getDb()
  const [row] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id)).limit(1)
  return row ? rowToTemplate(row) : null
}

/** Every variant belonging to one template. */
export async function listGroupVariants(groupId: string): Promise<StoredTemplate[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(messageTemplates)
    .where(eq(messageTemplates.groupId, groupId))
    .orderBy(asc(messageTemplates.language))
  return rows.map(rowToTemplate)
}

/**
 * Clear the fallback flag on every other variant in a group.
 *
 * The invariant is "exactly one fallback per group": two would make resolution
 * depend on row order, and zero would leave contacts whose language is not
 * covered with no message at all. Both writes that can break it - create and
 * update - pass through here.
 */
async function clearOtherFallbacks(groupId: string, keepId: string): Promise<void> {
  const db = getDb()
  await db
    .update(messageTemplates)
    .set({ isFallback: false, updatedAt: new Date().toISOString() })
    .where(and(eq(messageTemplates.groupId, groupId), ne(messageTemplates.id, keepId)))
}

/**
 * Create a template, or add a language variant to an existing one.
 *
 * Passing an existing `groupId` adds a variant; omitting it starts a new
 * template whose group is the row's own id. The first variant of a group is
 * always the fallback, because a group without one could not answer a send for
 * an uncovered language.
 */
export async function createTemplate(template: MessageTemplate): Promise<StoredTemplate> {
  const db = getDb()

  const id = template.id
  const groupId = template.groupId || id
  const siblings = await listGroupVariants(groupId)
  const isFallback = siblings.length === 0 ? true : Boolean(template.isFallback)

  const [row] = await db
    .insert(messageTemplates)
    .values(templateToRow({ ...template, id, groupId, isFallback }))
    .returning()

  if (isFallback) await clearOtherFallbacks(groupId, id)

  return rowToTemplate(row as MessageTemplateRow)
}

export async function updateTemplate(id: string, patch: Partial<MessageTemplate>): Promise<StoredTemplate | null> {
  const db = getDb()
  const values: Partial<NewMessageTemplateRow> = { updatedAt: new Date().toISOString() }

  if (patch.name !== undefined) values.name = patch.name
  if (patch.category !== undefined) values.category = patch.category
  if (patch.content !== undefined) values.content = patch.content
  if (patch.variables !== undefined) values.variables = JSON.stringify(patch.variables)
  if (patch.targetAudience !== undefined) values.targetAudience = patch.targetAudience
  if (patch.specificCategory !== undefined) values.specificCategory = patch.specificCategory ?? null
  if (patch.language !== undefined) values.language = patch.language
  if (patch.imageUrl !== undefined) values.imageUrl = patch.imageUrl ?? null
  if (patch.isFallback !== undefined) values.isFallback = Boolean(patch.isFallback)

  const [row] = await db.update(messageTemplates).set(values).where(eq(messageTemplates.id, id)).returning()
  if (!row) return null

  const updated = rowToTemplate(row as MessageTemplateRow)

  // Promoting a variant to fallback demotes its siblings, so a group never ends
  // up with two.
  if (patch.isFallback === true) {
    await clearOtherFallbacks(updated.groupId, id)
  }

  // A name, category or audience belongs to the template, not to one
  // translation: apply those to every variant so the group stays coherent.
  const groupWide: Partial<NewMessageTemplateRow> = { updatedAt: values.updatedAt }
  if (patch.name !== undefined) groupWide.name = patch.name
  if (patch.category !== undefined) groupWide.category = patch.category
  if (patch.targetAudience !== undefined) groupWide.targetAudience = patch.targetAudience
  if (patch.specificCategory !== undefined) groupWide.specificCategory = patch.specificCategory ?? null

  if (Object.keys(groupWide).length > 1) {
    await db
      .update(messageTemplates)
      .set(groupWide)
      .where(and(eq(messageTemplates.groupId, updated.groupId), ne(messageTemplates.id, id)))
  }

  return updated
}

/**
 * Delete one language variant.
 *
 * Removing the fallback would leave the group unable to answer a send for an
 * uncovered language, so a surviving sibling is promoted. Deleting the last
 * variant removes the template outright.
 */
export async function deleteTemplateVariant(id: string): Promise<{ deleted: boolean; groupDeleted: boolean }> {
  const existing = await getTemplateById(id)
  if (!existing) return { deleted: false, groupDeleted: false }

  const db = getDb()
  await db.delete(messageTemplates).where(eq(messageTemplates.id, id))

  const remaining = await listGroupVariants(existing.groupId)
  if (remaining.length === 0) {
    return { deleted: true, groupDeleted: true }
  }

  if (!remaining.some((variant) => variant.isFallback)) {
    await db
      .update(messageTemplates)
      .set({ isFallback: true, updatedAt: new Date().toISOString() })
      .where(eq(messageTemplates.id, remaining[0].id))
  }

  return { deleted: true, groupDeleted: false }
}

/** Delete a whole template: every language variant in the group. */
export async function deleteTemplateGroup(groupId: string): Promise<number> {
  const db = getDb()
  const deleted = await db
    .delete(messageTemplates)
    .where(eq(messageTemplates.groupId, groupId))
    .returning({ id: messageTemplates.id })
  return deleted.length
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const db = getDb()
  const deleted = await db
    .delete(messageTemplates)
    .where(eq(messageTemplates.id, id))
    .returning({ id: messageTemplates.id })
  return deleted.length > 0
}

/**
 * Seed the starter templates.
 *
 * Idempotent: `onConflictDoNothing` means calling this on every deploy is safe
 * and will never clobber an edit the operator made to a starter template.
 */
export async function seedDefaultTemplates(): Promise<number> {
  const db = getDb()
  const now = new Date().toISOString()

  const rows = DEFAULT_TEMPLATES.map((template) =>
    templateToRow(
      {
        id: template.id,
        // Starter templates ship as a single English variant; the operator adds
        // an Arabic one from the editor when they want it.
        groupId: template.id,
        name: template.name,
        category: template.category,
        content: template.content,
        variables: [...template.variables],
        targetAudience: template.targetAudience,
        language: "en",
        isFallback: true,
      },
      { isDefault: true, now },
    ),
  )

  await db.insert(messageTemplates).values(rows).onConflictDoNothing({ target: messageTemplates.id })
  return rows.length
}
