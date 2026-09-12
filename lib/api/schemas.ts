/**
 * Request validation schemas
 *
 * Every request body and query string is parsed through one of these before it
 * reaches a repository. Nothing from the network is trusted: the client is
 * ours, but a browser devtools console is not.
 */

import { z } from "zod"
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "@/lib/i18n/languages"

// ============================================================================
// SHARED
// ============================================================================

export const contactStatusSchema = z.enum(["pending", "sent", "not_sent"])

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(500).default(20),
})

// ============================================================================
// AUTH
// ============================================================================

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(200),
})

export type LoginInput = z.infer<typeof loginSchema>

// ============================================================================
// CONTACTS
// ============================================================================

export const contactInputSchema = z.object({
  id: z.string().min(1).optional(),
  original: z.string().min(1, "Phone number is required"),
  normalized: z.string().min(5, "Normalized phone number is required"),
  whatsappLink: z.string().min(1),
  companyName: z.string().nullish(),
  companyCategory: z.string().nullish(),
  website: z.string().nullish(),
  city: z.string().nullish(),
  language: z.string().nullish(),
  hasWebsite: z.boolean().default(false),
  status: contactStatusSchema.default("pending"),
  sentAt: z.string().nullish(),
  lastUpdated: z.string().optional(),
  source: z.string().default("manual"),
  notes: z.string().nullish(),
  dynamicData: z.record(z.string(), z.any()).nullish(),
})

export const contactPatchSchema = contactInputSchema.partial().omit({ id: true })

export const contactListQuerySchema = paginationSchema.extend({
  status: z.union([contactStatusSchema, z.literal("all")]).default("all"),
  category: z.string().default("all"),
  website: z.enum(["all", "with", "without"]).default("all"),
  search: z.string().trim().max(200).optional(),
  source: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "companyName", "status"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})

export const contactImportSchema = z.object({
  contacts: z.array(contactInputSchema).min(1, "At least one contact is required").max(10_000),
  source: z.string().default("import"),
  filename: z.string().nullish(),
})

export const bulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one contact").max(10_000),
  status: contactStatusSchema,
  notes: z.string().nullish(),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one contact").max(10_000),
})

// ============================================================================
// TEMPLATES
// ============================================================================

export const templateAudienceSchema = z.enum(["all", "with_website", "no_website", "category_specific"])

export const templateInputSchema = z.object({
  id: z.string().min(1).optional(),
  /** Omitted to start a new template; supplied to add a language variant. */
  groupId: z.string().min(1).optional(),
  name: z.string().trim().min(1, "Template name is required").max(100),
  category: z.string().trim().min(1).max(60).default("General"),
  content: z.string().min(1, "Template content is required").max(4096),
  variables: z.array(z.string()).default([]),
  targetAudience: templateAudienceSchema.default("all"),
  specificCategory: z.string().nullish(),
  /**
   * Validated against the app's supported set rather than accepted as free
   * text: an unrecognised code here would create a variant no contact could
   * ever resolve to.
   */
  language: z
    .string()
    .trim()
    .min(1)
    .refine(isSupportedLanguage, "Unsupported template language")
    .default(DEFAULT_LANGUAGE),
  isFallback: z.boolean().default(false),
  imageUrl: z.string().trim().url("Image must be a valid URL").max(2048).nullish(),
})

export const templatePatchSchema = templateInputSchema.partial().omit({ id: true })

// ============================================================================
// SETTINGS
// ============================================================================

export const settingsPatchSchema = z.record(z.string().min(1).max(64), z.string().max(8192).nullable())

// ============================================================================
// SEND HISTORY
// ============================================================================

export const sendHistoryEntrySchema = z.object({
  contactId: z.string().nullish(),
  contactNormalized: z.string().min(1),
  companyName: z.string().nullish(),
  templateId: z.string().nullish(),
  message: z.string().nullish(),
  status: z.enum(["sent", "failed", "skipped"]).default("sent"),
  error: z.string().nullish(),
})

export const sendHistoryCreateSchema = z.object({
  entries: z.array(sendHistoryEntrySchema).min(1).max(1000),
  /** Also flip the referenced contacts to "sent" in the same request. */
  markContactsSent: z.boolean().default(true),
})

export const sendHistoryQuerySchema = paginationSchema.extend({
  contactId: z.string().optional(),
  status: z.enum(["sent", "failed", "skipped"]).optional(),
  since: z.string().optional(),
})

// ============================================================================
// HELPERS
// ============================================================================

/** Parse a URLSearchParams through a schema, throwing a ZodError on failure. */
export function parseQuery<T extends z.ZodTypeAny>(schema: T, url: URL): z.infer<T> {
  return schema.parse(Object.fromEntries(url.searchParams.entries()))
}
