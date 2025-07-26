/**
 * Service layer type definitions
 *
 * This file contains type definitions specific to the service layer,
 * including result types, configuration interfaces, and service contracts.
 */

import type { Contact, MessageTemplate, ContactDatabase } from "../types"

// ============================================================================
// COMMON SERVICE TYPES
// ============================================================================

/**
 * Standard service operation result
 */
export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  message: string
  errors?: string[]
}

/**
 * Async service operation result
 */
export type AsyncServiceResult<T = any> = Promise<ServiceResult<T>>

// ============================================================================
// CONTACT SERVICE TYPES
// ============================================================================

export interface ContactServiceResult extends ServiceResult {
  data?: {
    contacts?: Contact[]
    database?: ContactDatabase
    stats?: ContactStats
  }
}

export interface ContactStats {
  total: number
  sent: number
  pending: number
  notSent: number
  sendRate: number
}

export interface MergeContactsResult extends ServiceResult {
  data?: {
    newContacts: number
    duplicates: number
    updated: number
    total: number
  }
}

// ============================================================================
// TEMPLATE SERVICE TYPES
// ============================================================================

export interface TemplateServiceResult extends ServiceResult {
  data?: {
    template?: MessageTemplate
    templates?: MessageTemplate[]
    variables?: string[]
    preview?: string
  }
}

export interface TemplateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  variables: string[]
}

// ============================================================================
// FILE SERVICE TYPES
// ============================================================================

export interface FileProcessingResult {
  contacts: Contact[]
  errors: string[]
  warnings: string[]
  stats: {
    totalRows: number
    processedRows: number
    validContacts: number
    duplicates: number
  }
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
  fileInfo?: {
    name: string
    size: number
    type: string
    lastModified: number
  }
}

export interface ColumnMapping {
  phoneColumns: number[]
  companyNameCol: number
  companyCategoryCol: number
  websiteCol: number
  dynamicDataCols: Array<{ name: string; index: number }>
}

// ============================================================================
// SEARCH SERVICE TYPES
// ============================================================================

export interface SearchResult<T = Contact> {
  items: T[]
  totalCount: number
  searchTime: number
  appliedFilters: string[]
}

export interface SearchCriteria {
  searchTerm?: string
  category?: string
  hasWebsite?: boolean
  status?: string
  source?: string
  dateRange?: {
    start: string
    end: string
  }
  customFields?: Record<string, string>
}

export interface SavedSearch {
  id: string
  name: string
  criteria: SearchCriteria
  createdAt: string
  lastUsed: string
  useCount: number
}

// ============================================================================
// EXPORT SERVICE TYPES
// ============================================================================

export interface ExportResult extends ServiceResult {
  data?: {
    content: string
    filename: string
    mimeType: string
    size: number
  }
}

export interface ExportOptions {
  format: "csv" | "xlsx" | "json"
  includeHeaders: boolean
  selectedFields?: string[]
  dateFormat?: string
  encoding?: string
}

// ============================================================================
// BATCH OPERATION TYPES
// ============================================================================

export interface BatchOperationConfig {
  contacts: Contact[]
  delayMs: number
  onProgress?: (index: number, contact: Contact) => void
  onComplete?: () => void
  onError?: (error: Error, contact: Contact) => void
  onContactSent?: (contactId: string) => void
}

export interface BatchOperationResult {
  successful: number
  failed: number
  total: number
  errors: Array<{
    contactId: string
    error: string
  }>
  duration: number
}

// ============================================================================
// STORAGE SERVICE TYPES
// ============================================================================

export interface StorageServiceConfig {
  keyPrefix: string
  compression: boolean
  encryption: boolean
  maxSize: number
}

export interface StorageResult<T = any> extends ServiceResult {
  data?: T
  storageInfo?: {
    key: string
    size: number
    lastModified: string
  }
}

// ============================================================================
// VALIDATION SERVICE TYPES
// ============================================================================

export interface ValidationRule<T = any> {
  field: keyof T
  required?: boolean
  type?: "string" | "number" | "boolean" | "email" | "phone" | "url"
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    value?: any
  }>
  warnings: Array<{
    field: string
    message: string
    value?: any
  }>
}

// ============================================================================
// WHATSAPP SERVICE TYPES
// ============================================================================

export interface WhatsAppLinkOptions {
  phoneNumber: string
  message?: string
  parseMode?: "markdown" | "html" | "none"
}

export interface WhatsAppLinkResult {
  link: string
  isValid: boolean
  phoneNumber: string
  message?: string
  encodedMessage?: string
}

// ============================================================================
// PHONE SERVICE TYPES
// ============================================================================

export interface PhoneValidationResult {
  isValid: boolean
  normalized?: string
  country?: string
  type?: "mobile" | "landline" | "unknown"
  carrier?: string
  error?: string
}

export interface PhoneNormalizationOptions {
  defaultCountry?: string
  format?: "e164" | "international" | "national"
  strict?: boolean
}
