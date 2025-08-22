/**
 * Application constants and configuration
 *
 * This file contains all the constant values used throughout the application.
 * Modify these values to customize the application behavior.
 */

// ============================================================================
// APPLICATION SETTINGS
// ============================================================================

export const APP_CONSTANTS = {
  /** Application name displayed in UI */
  APP_NAME: "WhatsApp Business Link Generator",

  /** Version number for database migrations */
  APP_VERSION: "1.0.0",

  /** Default password for file uploads (change in production) */
  UPLOAD_PASSWORD: "secure123",

  /** Maximum file size for uploads (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Supported file extensions for upload */
  SUPPORTED_FILE_EXTENSIONS: [".xlsx", ".xls", ".csv"],

  /** Default number of items per page */
  DEFAULT_ITEMS_PER_PAGE: 20,

  /** Available items per page options */
  ITEMS_PER_PAGE_OPTIONS: [10, 20, 50, 100],

  /** Delay between batch sends (milliseconds) */
  BATCH_SEND_DELAY_MS: 2000,

  /** Local storage key for contacts */
  STORAGE_KEY_CONTACTS: "whatsapp_contacts_db",

  /** Local storage key for templates */
  STORAGE_KEY_TEMPLATES: "whatsapp_templates",

  /** Local storage key for app settings */
  STORAGE_KEY_SETTINGS: "whatsapp_app_settings",
} as const

// ============================================================================
// WHATSAPP SETTINGS
// ============================================================================

export const WHATSAPP_CONSTANTS = {
  /** Base WhatsApp URL */
  BASE_URL: "https://web.whatsapp.com/send",

  /** Saudi Arabia country code */
  SAUDI_COUNTRY_CODE: "966",

  /** Default country code for phone normalization */
  DEFAULT_COUNTRY_CODE: "+966",

  /** Maximum message length for WhatsApp */
  MAX_MESSAGE_LENGTH: 4096,
} as const

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  /** Phone number validation patterns */
  PHONE: {
    /** Saudi phone number pattern */
    SAUDI_PATTERN: /^(05|5)[0-9]{8}$/,

    /** International format pattern */
    INTERNATIONAL_PATTERN: /^\+[1-9]\d{1,14}$/,

    /** Minimum phone number length */
    MIN_LENGTH: 10,

    /** Maximum phone number length */
    MAX_LENGTH: 15,
  },

  /** Template validation */
  TEMPLATE: {
    /** Maximum template name length */
    MAX_NAME_LENGTH: 100,

    /** Maximum template content length */
    MAX_CONTENT_LENGTH: 2000,

    /** Variable pattern for extraction */
    VARIABLE_PATTERN: /\{([^}]+)\}/g,
  },

  /** File validation */
  FILE: {
    /** Maximum file size (10MB) */
    MAX_SIZE: 10 * 1024 * 1024,

    /** Minimum required columns */
    MIN_COLUMNS: 1,

    /** Maximum rows to process */
    MAX_ROWS: 10000,
  },
} as const

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI_CONSTANTS = {
  /** Animation durations */
  ANIMATION: {
    /** Fast animations (ms) */
    FAST: 150,

    /** Normal animations (ms) */
    NORMAL: 300,

    /** Slow animations (ms) */
    SLOW: 500,
  },

  /** Debounce delays */
  DEBOUNCE: {
    /** Search input debounce (ms) */
    SEARCH: 300,

    /** Auto-save debounce (ms) */
    AUTO_SAVE: 1000,
  },

  /** Toast notification durations */
  TOAST: {
    /** Success message duration (ms) */
    SUCCESS: 3000,

    /** Error message duration (ms) */
    ERROR: 5000,

    /** Warning message duration (ms) */
    WARNING: 4000,

    /** Info message duration (ms) */
    INFO: 3000,
  },

  /** Breakpoints for responsive design */
  BREAKPOINTS: {
    /** Small screens */
    SM: 640,

    /** Medium screens */
    MD: 768,

    /** Large screens */
    LG: 1024,

    /** Extra large screens */
    XL: 1280,
  },
} as const

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

export const DEFAULT_TEMPLATES = [
  {
    id: "welcome-1",
    name: "Professional Welcome",
    category: "Welcome",
    content: `Hello {companyName}! 👋

We're excited to connect with businesses in the {companyCategory} industry. 

Our team specializes in helping companies like yours grow and succeed. Would you be interested in learning more about our services?

Best regards,
Your Business Team`,
    variables: ["{companyName}", "{companyCategory}"],
    targetAudience: "all" as const,
  },
  {
    id: "follow-up-1",
    name: "Follow Up Message",
    category: "Follow Up",
    content: `Hi {companyName},

Following up on our previous conversation about {companyCategory} solutions.

{website ? 'I noticed your website at ' + website + ' - impressive work!' : "I'd love to learn more about your business."}

When would be a good time to discuss how we can help you achieve your goals?

Best regards`,
    variables: ["{companyName}", "{companyCategory}", "{website}"],
    targetAudience: "all" as const,
  },
  {
    id: "website-specific-1",
    name: "Website Compliment",
    category: "Sales",
    content: `Hello {companyName}! 

I came across your website at {website} and was impressed by your {companyCategory} services.

We work with similar businesses to help them scale and optimize their operations. Would you be open to a brief conversation about potential collaboration opportunities?

Looking forward to connecting!`,
    variables: ["{companyName}", "{website}", "{companyCategory}"],
    targetAudience: "with_website" as const,
  },
  {
    id: "no-website-1",
    name: "Digital Presence Offer",
    category: "Sales",
    content: `Hi {companyName}!

I noticed that {companyName} in the {companyCategory} industry might benefit from a stronger digital presence.

We help businesses like yours establish their online presence and reach more customers. Would you be interested in learning how we can help you grow your business online?

Best regards`,
    variables: ["{companyName}", "{companyCategory}"],
    targetAudience: "no_website" as const,
  },
] as const

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  /** File upload errors */
  FILE_UPLOAD: {
    SIZE_EXCEEDED: "File size exceeds the maximum limit of 10MB",
    INVALID_FORMAT: "Invalid file format. Please upload Excel (.xlsx, .xls) or CSV files only",
    PROCESSING_FAILED: "Failed to process the uploaded file",
    NO_DATA: "No valid data found in the uploaded file",
    CORRUPTED: "The uploaded file appears to be corrupted",
  },

  /** Phone number errors */
  PHONE: {
    INVALID_FORMAT: "Invalid phone number format",
    REQUIRED: "Phone number is required",
    TOO_SHORT: "Phone number is too short",
    TOO_LONG: "Phone number is too long",
  },

  /** Template errors */
  TEMPLATE: {
    NAME_REQUIRED: "Template name is required",
    CONTENT_REQUIRED: "Template content is required",
    INVALID_VARIABLES: "Template contains invalid variables",
    SAVE_FAILED: "Failed to save template",
  },

  /** General errors */
  GENERAL: {
    NETWORK_ERROR: "Network error. Please check your connection",
    STORAGE_FULL: "Local storage is full. Please clear some data",
    UNKNOWN_ERROR: "An unexpected error occurred",
    PERMISSION_DENIED: "Permission denied",
  },
} as const

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  /** File operations */
  FILE: {
    UPLOADED: "File uploaded successfully",
    PROCESSED: "File processed successfully",
    EXPORTED: "Data exported successfully",
  },

  /** Contact operations */
  CONTACT: {
    SAVED: "Contacts saved successfully",
    UPDATED: "Contact updated successfully",
    DELETED: "Contact deleted successfully",
    STATUS_UPDATED: "Contact status updated",
  },

  /** Template operations */
  TEMPLATE: {
    CREATED: "Template created successfully",
    UPDATED: "Template updated successfully",
    DELETED: "Template deleted successfully",
    APPLIED: "Template applied successfully",
  },

  /** General operations */
  GENERAL: {
    COPIED: "Copied to clipboard",
    SAVED: "Changes saved successfully",
    CLEARED: "Data cleared successfully",
  },
} as const

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  /** Enable Google Sheets integration */
  GOOGLE_SHEETS_ENABLED: true,

  /** Enable advanced search */
  ADVANCED_SEARCH_ENABLED: true,

  /** Enable bulk operations */
  BULK_OPERATIONS_ENABLED: true,

  /** Enable contact analytics */
  ANALYTICS_ENABLED: true,

  /** Enable template sharing */
  TEMPLATE_SHARING_ENABLED: false,

  /** Enable dark mode */
  DARK_MODE_ENABLED: false,
} as const
