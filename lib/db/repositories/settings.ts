/**
 * App settings repository
 *
 * A small key/value store for operator-level state that used to live in
 * localStorage — most importantly the active custom message, which previously
 * only existed in whichever browser happened to type it.
 */

import { eq, inArray } from "drizzle-orm"

import { getDb } from "@/lib/db"
import { appSettings } from "@/lib/db/schema"

/** Known setting keys. Using constants keeps typos out of the data. */
export const SETTING_KEYS = {
  CUSTOM_MESSAGE: "custom_message",
  SELECTED_TEMPLATE_ID: "selected_template_id",
  DEFAULT_ITEMS_PER_PAGE: "default_items_per_page",
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb()
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1)
  return row?.value ?? null
}

export async function getSettings(keys?: string[]): Promise<Record<string, string | null>> {
  const db = getDb()
  const rows = keys?.length
    ? await db.select().from(appSettings).where(inArray(appSettings.key, keys))
    : await db.select().from(appSettings)

  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

/** Insert or replace a single setting. */
export async function setSetting(key: string, value: string | null): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()

  await db
    .insert(appSettings)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: now },
    })
}

/**
 * Insert or replace several settings.
 *
 * Issued sequentially: the D1 REST API has no transactional batch, so these are
 * independent writes. Settings are independent by nature, so a partial apply is
 * not a correctness problem here.
 */
export async function setSettings(entries: Record<string, string | null>): Promise<void> {
  const pairs = Object.entries(entries)
  if (pairs.length === 0) return

  const db = getDb()
  const now = new Date().toISOString()

  const statements = pairs.map(([key, value]) =>
    db
      .insert(appSettings)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: now } }),
  )

  if (statements.length === 1) {
    await statements[0]
    return
  }

  await db.batch(statements as never)
}

export async function deleteSetting(key: string): Promise<void> {
  const db = getDb()
  await db.delete(appSettings).where(eq(appSettings.key, key))
}
