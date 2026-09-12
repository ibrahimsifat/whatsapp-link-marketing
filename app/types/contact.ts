export interface Contact {
  id: string
  original: string
  normalized: string
  whatsappLink: string
  companyName?: string
  companyCategory?: string
  website?: string
  city?: string
  language?: string
  hasWebsite: boolean
  // New tracking fields
  status: "pending" | "sent" | "not_sent"
  sentAt?: string
  lastUpdated: string
  source: string // filename or manual entry
  notes?: string
  // New: Dynamic data for custom variables from Excel
  dynamicData?: Record<string, string | number | boolean | null | undefined>
}

export interface ContactDatabase {
  contacts: Contact[]
  lastUpdated: string
  version: string
  totalContacts: number
  sentCount: number
  pendingCount: number
  notSentCount: number
}

/**
 * One language variant of a template.
 *
 * A template as the operator thinks of it ("Welcome Offer") is the set of rows
 * sharing a `groupId`; each row holds the content and image for one language.
 * `TemplateGroup` in app/types/template-group.ts is that assembled view.
 */
export interface MessageTemplate {
  id: string
  /** Shared by every language variant of the same template. */
  groupId: string
  name: string
  category: string
  content: string
  variables: string[]
  targetAudience: "all" | "with_website" | "no_website" | "category_specific"
  specificCategory?: string
  /** Canonical language code — see lib/i18n/languages.ts. */
  language: string
  /** Used when a contact's language has no variant of its own. */
  isFallback: boolean
  /** Appended to the message body; WhatsApp renders a preview for it. */
  imageUrl?: string
}

export interface DuplicateMatch {
  contact: Contact
  score: number
  reasons: string[]
  suggestedAction: "merge" | "review" | "ignore"
}

export interface DuplicateGroup {
  id: string
  contacts: Contact[]
  primaryContact: Contact
  matches: DuplicateMatch[]
  confidence: number
  autoMergeRecommended: boolean
}

export interface DuplicateDetectionSettings {
  phoneThreshold: number
  nameThreshold: number
  companyThreshold: number
  websiteThreshold: number
  autoMergeThreshold: number
  enableAutoMerge: boolean
}
