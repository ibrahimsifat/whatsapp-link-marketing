export interface Contact {
  id: string
  original: string
  normalized: string
  whatsappLink: string
  companyName?: string
  companyCategory?: string
  website?: string
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

export interface MessageTemplate {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
  targetAudience: "all" | "with_website" | "no_website" | "category_specific"
  specificCategory?: string
}
