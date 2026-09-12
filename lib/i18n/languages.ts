/**
 * Language identification for contacts and template variants.
 *
 * Contact language arrives as free text typed into a spreadsheet — "Arabic",
 * "arabic", "AR", "ar-SA", "العربية" are all the same language to a human and
 * must be the same language to the template resolver. Everything in the app
 * therefore stores and compares a canonical code (the `code` values below), and
 * the raw spreadsheet string is only ever kept for display.
 *
 * This module is deliberately dependency-free so the browser, the API routes
 * and the import pipeline can all share one definition of "same language".
 */

export type LanguageCode = string

export interface LanguageOption {
  /** Canonical code stored in the database. ISO 639-1 where one exists. */
  code: LanguageCode
  /** English name, used in the UI chrome. */
  label: string
  /** Endonym, shown next to the label so an operator recognises their language. */
  nativeLabel: string
  /** Writing direction, so previews render RTL content correctly. */
  dir: "ltr" | "rtl"
}

/**
 * The languages offered in the template editor.
 *
 * Chosen for the Gulf market this app targets: Arabic and English first, then
 * the languages of the largest expatriate business communities in Saudi Arabia.
 */
export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", dir: "rtl" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", dir: "ltr" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", dir: "ltr" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", dir: "ltr" },
  { code: "tl", label: "Filipino", nativeLabel: "Filipino", dir: "ltr" },
  { code: "ne", label: "Nepali", nativeLabel: "नेपाली", dir: "ltr" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", dir: "ltr" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", dir: "ltr" },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr" },
]

/** The language assumed when a contact has none and a template needs a default. */
export const DEFAULT_LANGUAGE: LanguageCode = "en"

const BY_CODE = new Map(SUPPORTED_LANGUAGES.map((language) => [language.code, language]))

/**
 * Spellings seen in real spreadsheets, mapped to their canonical code.
 *
 * Keys are already lowercased and stripped of punctuation by `simplify()`, so
 * "Arabic (Saudi)" and "arabic-saudi" both arrive here as "arabicsaudi".
 */
const ALIASES: Record<string, LanguageCode> = {
  // Arabic
  ar: "ar",
  ara: "ar",
  arb: "ar",
  arabic: "ar",
  arabik: "ar",
  arabe: "ar",
  arabicsaudi: "ar",
  arabiclanguage: "ar",
  عربي: "ar",
  العربية: "ar",
  عربية: "ar",
  // English
  en: "en",
  eng: "en",
  english: "en",
  englishlanguage: "en",
  enus: "en",
  engb: "en",
  inglish: "en",
  // Urdu
  ur: "ur",
  urd: "ur",
  urdu: "ur",
  اردو: "ur",
  // Hindi
  hi: "hi",
  hin: "hi",
  hindi: "hi",
  हिन्दी: "hi",
  // Bengali
  bn: "bn",
  ben: "bn",
  bengali: "bn",
  bangla: "bn",
  বাংলা: "bn",
  // Malayalam
  ml: "ml",
  mal: "ml",
  malayalam: "ml",
  // Tamil
  ta: "ta",
  tam: "ta",
  tamil: "ta",
  // Filipino
  tl: "tl",
  fil: "tl",
  filipino: "tl",
  tagalog: "tl",
  // Nepali
  ne: "ne",
  nep: "ne",
  nepali: "ne",
  // Indonesian
  id: "id",
  ind: "id",
  indonesian: "id",
  bahasa: "id",
  bahasaindonesia: "id",
  // Turkish
  tr: "tr",
  tur: "tr",
  turkish: "tr",
  turkce: "tr",
  // French
  fr: "fr",
  fra: "fr",
  fre: "fr",
  french: "fr",
  francais: "fr",
}

/**
 * Script ranges used as a last resort.
 *
 * A cell containing "شركة الخليج" names a language even though it is not a
 * language name, so a value written in Arabic script is treated as Arabic.
 * Ordered most-specific first: Urdu-only letters are checked before the shared
 * Arabic block they live inside.
 */
const SCRIPT_HINTS: Array<{ pattern: RegExp; code: LanguageCode }> = [
  { pattern: /[ٹڈڑںھہۃے]/, code: "ur" },
  { pattern: /[؀-ۿݐ-ݿ]/, code: "ar" },
  { pattern: /[ঀ-৿]/, code: "bn" },
  { pattern: /[ഀ-ൿ]/, code: "ml" },
  { pattern: /[஀-௿]/, code: "ta" },
  { pattern: /[ऀ-ॿ]/, code: "hi" },
]

/** Lowercase and drop everything that is not a letter or digit. */
function simplify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
}

/**
 * Resolve free text to a canonical language code.
 *
 * Returns `null` rather than guessing when the value means nothing — an empty
 * cell, "N/A", or a language the app does not offer. Callers decide what an
 * unknown language should do; this function never invents one.
 */
export function normalizeLanguage(value: string | null | undefined): LanguageCode | null {
  if (!value) return null

  const raw = String(value).trim()
  if (!raw) return null

  const simplified = simplify(raw)
  if (!simplified || simplified === "na" || simplified === "none" || simplified === "unknown") {
    return null
  }

  const alias = ALIASES[simplified]
  if (alias) return alias

  // "ar-SA", "en_GB": fall back to the primary subtag.
  const primarySubtag = simplify(raw.split(/[-_]/)[0] ?? "")
  if (primarySubtag && ALIASES[primarySubtag]) return ALIASES[primarySubtag]

  for (const hint of SCRIPT_HINTS) {
    if (hint.pattern.test(raw)) return hint.code
  }

  return null
}

export function getLanguage(code: LanguageCode | null | undefined): LanguageOption | null {
  if (!code) return null
  return BY_CODE.get(code) ?? null
}

/** Human-readable name for a code, falling back to the code itself. */
export function languageLabel(code: LanguageCode | null | undefined): string {
  if (!code) return "No language"
  return BY_CODE.get(code)?.label ?? code.toUpperCase()
}

export function languageNativeLabel(code: LanguageCode | null | undefined): string {
  if (!code) return "No language"
  return BY_CODE.get(code)?.nativeLabel ?? code.toUpperCase()
}

export function languageDir(code: LanguageCode | null | undefined): "ltr" | "rtl" {
  return BY_CODE.get(code ?? "")?.dir ?? "ltr"
}

export function isSupportedLanguage(code: string): boolean {
  return BY_CODE.has(code)
}
