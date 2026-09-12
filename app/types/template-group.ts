/**
 * Template groups: the operator-facing view of a multilingual template.
 *
 * The database stores one row per language variant. The UI, and the send
 * pipeline, think in terms of a whole template — "Welcome Offer", which happens
 * to exist in Arabic and English. This module assembles the rows into that view
 * and answers the one question the sender actually asks: which variant does
 * this contact get?
 */

import type { Contact, MessageTemplate } from "./contact"
import { DEFAULT_LANGUAGE, normalizeLanguage } from "@/lib/i18n/languages"

export interface TemplateGroup {
  groupId: string
  name: string
  category: string
  targetAudience: MessageTemplate["targetAudience"]
  specificCategory?: string
  /** Every language variant, fallback first, then alphabetically by code. */
  variants: MessageTemplate[]
  /** The variant used when a contact's language has no variant of its own. */
  fallback: MessageTemplate
  /** Language codes this template covers. */
  languages: string[]
}

export interface ResolvedTemplate {
  variant: MessageTemplate
  /** The contact's language, or null when it was blank or unrecognised. */
  contactLanguage: string | null
  /** True when the contact's language had no variant and the fallback was used. */
  usedFallback: boolean
}

/**
 * Pick the group's fallback variant.
 *
 * Prefers an explicit `isFallback` flag, then a variant in the default
 * language, then the first variant. The last two steps matter because a group
 * assembled from a partial API response, or mid-edit in the UI, may not have a
 * flag set yet — resolution must still return something rather than throw
 * during a send.
 */
function pickFallback(variants: MessageTemplate[]): MessageTemplate {
  return (
    variants.find((variant) => variant.isFallback) ??
    variants.find((variant) => variant.language === DEFAULT_LANGUAGE) ??
    variants[0]
  )
}

/** Assemble flat variant rows into groups, ordered by name. */
export function groupTemplates(templates: MessageTemplate[]): TemplateGroup[] {
  const byGroup = new Map<string, MessageTemplate[]>()

  for (const template of templates) {
    const key = template.groupId || template.id
    const existing = byGroup.get(key)
    if (existing) existing.push(template)
    else byGroup.set(key, [template])
  }

  const groups: TemplateGroup[] = []

  for (const [groupId, rawVariants] of byGroup) {
    const fallback = pickFallback(rawVariants)

    const variants = [...rawVariants].sort((a, b) => {
      if (a.id === fallback.id) return -1
      if (b.id === fallback.id) return 1
      return a.language.localeCompare(b.language)
    })

    // The group's shared attributes live on every row; the fallback is the
    // authority, so renaming a template means renaming its fallback variant.
    groups.push({
      groupId,
      name: fallback.name,
      category: fallback.category,
      targetAudience: fallback.targetAudience,
      specificCategory: fallback.specificCategory,
      variants,
      fallback,
      languages: variants.map((variant) => variant.language),
    })
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name))
}

export function findGroup(groups: TemplateGroup[], groupId: string | null | undefined): TemplateGroup | null {
  if (!groupId) return null
  return groups.find((group) => group.groupId === groupId) ?? null
}

/**
 * Choose the variant a contact should receive.
 *
 * The contact's language is free text from a spreadsheet, so it is normalised
 * before comparison: "Arabic", "arabic" and "ar-SA" all select the `ar`
 * variant. A contact whose language is blank, unrecognised, or simply not
 * covered by this template gets the fallback, and the caller is told so it can
 * report how many messages went out in a language the operator did not pick.
 */
export function resolveTemplateForContact(group: TemplateGroup, contact: Pick<Contact, "language">): ResolvedTemplate {
  const contactLanguage = normalizeLanguage(contact.language)

  if (contactLanguage) {
    const match = group.variants.find((variant) => variant.language === contactLanguage)
    if (match) {
      return { variant: match, contactLanguage, usedFallback: false }
    }
  }

  return { variant: group.fallback, contactLanguage, usedFallback: true }
}

export interface LanguageCoverage {
  /** Language code, or null for contacts with no usable language value. */
  language: string | null
  contactCount: number
  /** True when the template has a variant for this language. */
  covered: boolean
}

/**
 * Break a contact selection down by language against a template.
 *
 * Drives the pre-send summary: the operator sees "38 Arabic, 12 English, 4 will
 * use the English fallback" before committing to a run, which is the moment a
 * missing translation is cheap to fix.
 */
export function summariseLanguageCoverage(
  group: TemplateGroup,
  contacts: Array<Pick<Contact, "language">>,
): LanguageCoverage[] {
  const counts = new Map<string | null, number>()

  for (const contact of contacts) {
    const language = normalizeLanguage(contact.language)
    counts.set(language, (counts.get(language) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([language, contactCount]) => ({
      language,
      contactCount,
      covered: language !== null && group.languages.includes(language),
    }))
    .sort((a, b) => b.contactCount - a.contactCount)
}

/**
 * Is the selected template still in charge of the outgoing message?
 *
 * Selecting a template loads its default version into the message box. If the
 * operator then edits that text they have written a specific message and every
 * contact should receive exactly it; leaving it untouched means the template
 * still decides, so each contact gets its own language version. Both the bulk
 * sender and the per-contact links ask this, so they can never disagree about
 * what a contact would receive.
 */
export function isLanguageRoutingActive(
  group: TemplateGroup | null,
  selectedVariant: MessageTemplate | null,
  customMessage: string,
): boolean {
  if (!group) return false
  return customMessage.trim() === (selectedVariant?.content ?? "").trim()
}
