/**
 * Database schema (Cloudflare D1 / SQLite)
 *
 * This is the single source of truth for the data model. Migrations are
 * generated from this file with `pnpm db:generate` and applied with
 * `pnpm db:migrate`.
 *
 * Conventions:
 *  - Primary keys are application-generated UUIDs (text), not autoincrement
 *    integers. This lets the client create a row optimistically and keeps IDs
 *    stable across import/export cycles.
 *  - Timestamps are ISO-8601 strings in UTC. SQLite has no native date type,
 *    and ISO-8601 sorts lexicographically, so `ORDER BY created_at` is correct.
 *  - Booleans are stored as integers (SQLite has no boolean type) and exposed
 *    as `boolean` through Drizzle's mode option.
 *  - Columns are snake_case in SQL, camelCase in TypeScript.
 */

import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

// ============================================================================
// SHARED COLUMN HELPERS
// ============================================================================

const createdAt = text("created_at")
  .notNull()
  .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)

const updatedAt = text("updated_at")
  .notNull()
  .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)

// ============================================================================
// IMPORT BATCHES
// ============================================================================

/**
 * One row per file upload / sheet import. Gives every contact a provenance
 * trail, and lets an entire bad import be identified and rolled back.
 */
export const importBatches = sqliteTable(
  "import_batches",
  {
    id: text("id").primaryKey(),
    /** "file" | "google_sheets" | "manual" | "api" */
    source: text("source").notNull(),
    filename: text("filename"),
    totalRows: integer("total_rows").notNull().default(0),
    insertedCount: integer("inserted_count").notNull().default(0),
    updatedCount: integer("updated_count").notNull().default(0),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    /** JSON array of error strings captured during parsing. */
    errors: text("errors"),
    /** Email of the operator who ran the import. */
    actor: text("actor"),
    createdAt,
  },
  (table) => ({
    createdAtIdx: index("idx_import_batches_created_at").on(table.createdAt),
  }),
)

// ============================================================================
// CONTACTS
// ============================================================================

export const contacts = sqliteTable(
  "contacts",
  {
    id: text("id").primaryKey(),

    /** Phone number exactly as it appeared in the source data. */
    original: text("original").notNull(),
    /**
     * Normalised E.164 number. This is the real identity of a contact and the
     * deduplication key, enforced at the database level by a unique index.
     */
    normalized: text("normalized").notNull(),
    /** Pre-rendered click-to-chat URL, regenerated when the message changes. */
    whatsappLink: text("whatsapp_link").notNull(),

    companyName: text("company_name"),
    companyCategory: text("company_category"),
    website: text("website"),
    hasWebsite: integer("has_website", { mode: "boolean" }).notNull().default(false),

    /** City the business operates in, used for geographic targeting. */
    city: text("city"),
    /** Preferred outreach language, used to pick the message template. */
    language: text("language"),

    /** "pending" | "sent" | "not_sent" — enforced by a CHECK constraint below. */
    status: text("status", { enum: ["pending", "sent", "not_sent"] })
      .notNull()
      .default("pending"),
    sentAt: text("sent_at"),

    /** Filename or free-text origin, kept for display alongside the batch FK. */
    source: text("source").notNull().default("manual"),
    notes: text("notes"),

    /** JSON object of extra spreadsheet columns, used for custom variables. */
    dynamicData: text("dynamic_data"),

    importBatchId: text("import_batch_id").references(() => importBatches.id, { onDelete: "set null" }),

    createdAt,
    updatedAt,
  },
  (table) => ({
    // The deduplication guarantee. Without this, concurrent imports race and
    // insert the same number twice.
    normalizedIdx: uniqueIndex("uq_contacts_normalized").on(table.normalized),
    statusIdx: index("idx_contacts_status").on(table.status),
    categoryIdx: index("idx_contacts_company_category").on(table.companyCategory),
    hasWebsiteIdx: index("idx_contacts_has_website").on(table.hasWebsite),
    cityIdx: index("idx_contacts_city").on(table.city),
    languageIdx: index("idx_contacts_language").on(table.language),
    createdAtIdx: index("idx_contacts_created_at").on(table.createdAt),
    batchIdx: index("idx_contacts_import_batch").on(table.importBatchId),
    // Supports the default list view: filter by status, newest first.
    statusCreatedIdx: index("idx_contacts_status_created_at").on(table.status, table.createdAt),
    // Defence in depth: a bad status can never be written, even by a bug or a
    // hand-run SQL statement.
    statusCheck: check("ck_contacts_status", sql`${table.status} IN ('pending', 'sent', 'not_sent')`),
  }),
)

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

export const messageTemplates = sqliteTable(
  "message_templates",
  {
    id: text("id").primaryKey(),
    /**
     * Ties the language variants of one template together.
     *
     * A row is a single-language variant; rows sharing a `groupId` are
     * translations of the same template and are selected, edited and deleted
     * as one unit in the UI. Nullable only so the column could be added to an
     * existing table; the migration backfills every row with its own id and
     * application code always writes it.
     */
    groupId: text("group_id"),
    /** Canonical language code of this variant — see lib/i18n/languages.ts. */
    language: text("language").notNull().default("en"),
    /**
     * Marks the variant used when a contact's language has no variant of its
     * own. Exactly one row per group carries it, enforced in the repository.
     */
    isFallback: integer("is_fallback", { mode: "boolean" }).notNull().default(false),
    /**
     * Image sent with this variant. WhatsApp click-to-chat cannot attach a
     * file, so the URL is appended to the message body and the client renders
     * its preview — which is why the image is per-variant: an Arabic creative
     * differs from the English one.
     */
    imageUrl: text("image_url"),
    name: text("name").notNull(),
    category: text("category").notNull().default("General"),
    content: text("content").notNull(),
    /** JSON array of variable tokens found in `content`, e.g. ["{companyName}"]. */
    variables: text("variables").notNull().default("[]"),
    /** "all" | "with_website" | "no_website" | "category_specific" */
    targetAudience: text("target_audience", {
      enum: ["all", "with_website", "no_website", "category_specific"],
    })
      .notNull()
      .default("all"),
    specificCategory: text("specific_category"),
    /** Seeded starter templates, so the UI can mark them as non-removable. */
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt,
    updatedAt,
  },
  (table) => ({
    nameIdx: index("idx_templates_name").on(table.name),
    categoryIdx: index("idx_templates_category").on(table.category),
    groupIdx: index("idx_templates_group").on(table.groupId),
    // One variant per language per template: a group cannot hold two Arabic
    // versions, so resolution is never ambiguous.
    groupLanguageIdx: uniqueIndex("uq_templates_group_language").on(table.groupId, table.language),
    audienceCheck: check(
      "ck_templates_target_audience",
      sql`${table.targetAudience} IN ('all', 'with_website', 'no_website', 'category_specific')`,
    ),
  }),
)

// ============================================================================
// SEND HISTORY
// ============================================================================

/**
 * Append-only audit log of every outbound message.
 *
 * `contactNormalized` is deliberately denormalised: the log must survive the
 * deletion of the contact it refers to, otherwise clearing contacts would erase
 * the record of what was already sent.
 */
export const sendHistory = sqliteTable(
  "send_history",
  {
    id: text("id").primaryKey(),
    contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    contactNormalized: text("contact_normalized").notNull(),
    companyName: text("company_name"),
    templateId: text("template_id").references(() => messageTemplates.id, { onDelete: "set null" }),
    /** Truncated copy of the rendered message, for auditing without bloat. */
    messagePreview: text("message_preview"),
    /** "sent" | "failed" | "skipped" */
    status: text("status", { enum: ["sent", "failed", "skipped"] })
      .notNull()
      .default("sent"),
    error: text("error"),
    actor: text("actor"),
    sentAt: text("sent_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => ({
    contactIdx: index("idx_send_history_contact").on(table.contactId),
    normalizedIdx: index("idx_send_history_normalized").on(table.contactNormalized),
    sentAtIdx: index("idx_send_history_sent_at").on(table.sentAt),
  }),
)

// ============================================================================
// APP SETTINGS
// ============================================================================

/**
 * Key/value store for operator-level settings that used to live in
 * localStorage: the active custom message, UI preferences, and so on.
 */
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt,
})

// ============================================================================
// AUTH ATTEMPTS
// ============================================================================

/**
 * Login attempt log backing the rate limiter.
 *
 * On a serverless host there is no shared in-process memory between
 * invocations, so an in-memory limiter would be trivially bypassed by hitting
 * different instances. Persisting attempts makes the limit real.
 */
export const authAttempts = sqliteTable(
  "auth_attempts",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    ip: text("ip").notNull().default("unknown"),
    success: integer("success", { mode: "boolean" }).notNull().default(false),
    userAgent: text("user_agent"),
    createdAt,
  },
  (table) => ({
    ipCreatedIdx: index("idx_auth_attempts_ip_created").on(table.ip, table.createdAt),
    emailCreatedIdx: index("idx_auth_attempts_email_created").on(table.email, table.createdAt),
  }),
)

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type ContactRow = typeof contacts.$inferSelect
export type NewContactRow = typeof contacts.$inferInsert

export type MessageTemplateRow = typeof messageTemplates.$inferSelect
export type NewMessageTemplateRow = typeof messageTemplates.$inferInsert

export type SendHistoryRow = typeof sendHistory.$inferSelect
export type NewSendHistoryRow = typeof sendHistory.$inferInsert

export type ImportBatchRow = typeof importBatches.$inferSelect
export type NewImportBatchRow = typeof importBatches.$inferInsert

export type AppSettingRow = typeof appSettings.$inferSelect
export type AuthAttemptRow = typeof authAttempts.$inferSelect
