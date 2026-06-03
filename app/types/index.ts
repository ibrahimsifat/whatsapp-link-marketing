import type React from "react"
/**
 * Core type definitions for the WhatsApp Link Generator application
 *
 * This file contains all the main TypeScript interfaces and types used
 * throughout the application for type safety and better development experience.
 */

// ============================================================================
// CONTACT TYPES
// ============================================================================

/**
 * Represents a business contact with WhatsApp link generation capabilities
 */
export interface Contact {
  /** Unique identifier for the contact */
  id: string

  /** Original phone number as entered */
  original: string

  /** Normalized phone number (E.164 format) */
  normalized: string

  /** Generated WhatsApp link */
  whatsappLink: string

  /** Company/business name (optional) */
  companyName?: string

  /** Business category/industry (optional) */
  companyCategory?: string

  /** Company website URL (optional) */
  website?: string

  /** Whether the contact has a website */
  hasWebsite: boolean

  /** Current status of the contact */
  status: ContactStatus

  /** Timestamp when message was sent (if applicable) */
  sentAt?: string

  /** Last update timestamp */
  lastUpdated: string

  /** Source of the contact (filename or manual entry) */
  source: string

  /** Optional notes about the contact */
  notes?: string

  /** Dynamic data from Excel columns for custom variables */
  dynamicData?: Record<string, string | number | boolean | null | undefined>
}

/**
 * Contact status enumeration
 */
export type ContactStatus = "pending" | "sent" | "not_sent"

/**
 * Contact database structure for local storage
 */
export interface ContactDatabase {
  /** Array of all contacts */
  contacts: Contact[]

  /** Last update timestamp */
  lastUpdated: string

  /** Database version for migration purposes */
  version: string

  /** Total number of contacts */
  totalContacts: number

  /** Number of contacts with 'sent' status */
  sentCount: number

  /** Number of contacts with 'pending' status */
  pendingCount: number

  /** Number of contacts with 'not_sent' status */
  notSentCount: number
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Message template for WhatsApp messages
 */
export interface MessageTemplate {
  /** Unique template identifier */
  id: string

  /** Human-readable template name */
  name: string

  /** Template category for organization */
  category: string

  /** Template content with variables */
  content: string

  /** Array of variables found in the template */
  variables: string[]

  /** Target audience for the template */
  targetAudience: TemplateAudience

  /** Specific category when targetAudience is 'category_specific' */
  specificCategory?: string
}

/**
 * Template target audience options
 */
export type TemplateAudience = "all" | "with_website" | "no_website" | "category_specific"

// ============================================================================
// FILE PROCESSING TYPES
// ============================================================================

/**
 * Result of file processing operation
 */
export interface FileProcessingResult {
  /** Successfully processed contacts */
  contacts: Contact[]

  /** Array of error messages */
  errors: string[]

  /** Array of warning messages */
  warnings: string[]
}

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Whether the file is valid */
  isValid: boolean

  /** Error message if validation failed */
  error?: string
}

/**
 * Pagination result structure
 */
export interface PaginatedResult<T> {
  /** Items for current page */
  items: T[]

  /** Current page number */
  currentPage: number

  /** Total number of pages */
  totalPages: number

  /** Total number of items */
  totalItems: number

  /** Items per page */
  itemsPerPage: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  /** Whether the operation was successful */
  success: boolean

  /** Response data (if successful) */
  data?: T

  /** Error or success message */
  message: string

  /** Additional metadata */
  meta?: Record<string, any>
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  /** Number of successful operations */
  successful: number

  /** Number of failed operations */
  failed: number

  /** Array of error messages */
  errors: string[]

  /** Total number of operations attempted */
  total: number
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Application state interface
 */
export interface AppState {
  // Contact management
  contacts: Contact[]
  selectedContact: Contact | null

  // File upload
  isLoading: boolean
  dragActive: boolean
  fileError: string
  // Templates
  templates: MessageTemplate[]
  selectedTemplate: MessageTemplate | null
  customMessage: string

  // Filters
  filterCategory: string
  filterWebsite: string
  filterStatus: string
  searchTerm: string

  // Manual entry
  manualPhoneNumber: string
  manualLink: string
  manualLinkCopied: boolean
  manualPhoneError: string

  // Batch sending
  isBatchSending: boolean
  currentBatchIndex: number

  // UI state
  copiedIndex: number | null

  // Pagination
  currentPage: number
  itemsPerPage: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic callback function type
 */
export type Callback<T = void> = (data: T) => void

/**
 * Async callback function type
 */
export type AsyncCallback<T = void> = (data: T) => Promise<void>

/**
 * Toast notification types
 */
export type ToastType = "success" | "error" | "warning" | "info"

/**
 * Export format options
 */
export type ExportFormat = "csv" | "xlsx" | "json"

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Base component props
 */
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Props for components that handle loading states
 */
export interface LoadingProps {
  isLoading?: boolean
  loadingText?: string
}

/**
 * Props for components with error handling
 */
export interface ErrorProps {
  error?: string | null
  onErrorClear?: () => void
}
