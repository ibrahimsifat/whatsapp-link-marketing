# API Documentation

## Overview

This document provides detailed information about the WhatsApp Link Generator's internal API structure, services, and components.

## Core Services

### ContactService

The ContactService handles all contact-related operations including storage, retrieval, and management.

#### Methods

##### `saveContacts(contacts: Contact[]): Promise<SaveResult>`
Saves an array of contacts to local storage.

**Parameters:**
- `contacts`: Array of Contact objects to save

**Returns:**
- Promise resolving to SaveResult with success status and message

**Example:**
\`\`\`typescript
const result = await ContactService.saveContacts([
  {
    id: "contact_1",
    original: "0551234567",
    normalized: "+966551234567",
    whatsappLink: "https://wa.me/966551234567",
    companyName: "Tech Corp",
    status: "pending"
  }
])
\`\`\`

##### `loadContacts(): ContactDatabase`
Loads all contacts from local storage.

**Returns:**
- ContactDatabase object containing contacts and metadata

##### `updateContactStatus(id: string, status: ContactStatus): Promise<UpdateResult>`
Updates the status of a specific contact.

**Parameters:**
- `id`: Contact ID
- `status`: New status ("pending" | "sent" | "not_sent")

### TemplateService

Handles message template operations and variable replacement.

#### Methods

##### `replaceVariables(template: string, contact: Contact): string`
Replaces template variables with actual contact data.

**Parameters:**
- `template`: Template string with variables
- `contact`: Contact object with data

**Returns:**
- String with variables replaced

**Example:**
\`\`\`typescript
const template = "Hello {companyName}, we'd like to discuss {companyCategory} solutions."
const contact = { companyName: "Tech Corp", companyCategory: "Software" }
const message = TemplateService.replaceVariables(template, contact)
// Result: "Hello Tech Corp, we'd like to discuss Software solutions."
\`\`\`

##### `extractVariables(template: string): string[]`
Extracts all variables from a template string.

**Parameters:**
- `template`: Template string

**Returns:**
- Array of variable names found in template

### FileService

Processes uploaded files and extracts contact data.

#### Methods

##### `processFile(file: File, customMessage?: string): Promise<FileProcessingResult>`
Processes an uploaded Excel or CSV file.

**Parameters:**
- `file`: File object to process
- `customMessage`: Optional custom message for WhatsApp links

**Returns:**
- Promise resolving to FileProcessingResult

##### `validateFileSize(file: File): FileValidationResult`
Validates file size and type.

**Parameters:**
- `file`: File to validate

**Returns:**
- Validation result with success status and error message if applicable

## Type Definitions

### Contact
\`\`\`typescript
interface Contact {
  id: string
  original: string
  normalized: string
  whatsappLink: string
  companyName?: string
  companyCategory?: string
  website?: string
  hasWebsite: boolean
  status: "pending" | "sent" | "not_sent"
  sentAt?: string
  lastUpdated: string
  source: string
  notes?: string
  dynamicData?: Record<string, any>
}
\`\`\`

### MessageTemplate
\`\`\`typescript
interface MessageTemplate {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
  targetAudience: "all" | "with_website" | "no_website" | "category_specific"
  specificCategory?: string
}
\`\`\`

### ContactDatabase
\`\`\`typescript
interface ContactDatabase {
  contacts: Contact[]
  lastUpdated: string
  version: string
  totalContacts: number
  sentCount: number
  pendingCount: number
  notSentCount: number
}
\`\`\`

## Component API

### ContactManagement

Main component for contact management operations.

#### Props
\`\`\`typescript
interface ContactManagementProps {
  database: ContactDatabase
  isLoading: boolean
  onSaveContacts: (contacts: Contact[]) => Promise<SaveResult>
  onMergeContacts: (contacts: Contact[], source: string) => Promise<MergeResult>
  onUpdateContactStatus: (id: string, status: ContactStatus) => Promise<UpdateResult>
  onDeleteContact: (id: string) => Promise<DeleteResult>
  onExportContacts: () => ExportResult
  onClearAllContacts: () => Promise<ClearResult>
  currentContacts: Contact[]
  onUpdateCurrentContacts: (contacts: Contact[]) => void
}
\`\`\`

### MessageTemplates

Component for creating and managing message templates.

#### Props
\`\`\`typescript
interface MessageTemplatesProps {
  templates: MessageTemplate[]
  onTemplateSelect: (template: MessageTemplate) => void
  selectedTemplate: MessageTemplate | null
  onTemplateCreate: (template: MessageTemplate) => void
  onTemplateUpdate: (template: MessageTemplate) => void
  onTemplateDelete: (templateId: string) => void
  availableCustomVariables: string[]
}
\`\`\`

## Error Handling

All services implement consistent error handling:

\`\`\`typescript
try {
  const result = await ContactService.saveContacts(contacts)
  if (result.success) {
    // Handle success
  } else {
    // Handle error with result.message
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error)
}
\`\`\`

## Performance Considerations

- **Pagination**: Large contact lists are paginated for performance
- **Debounced Search**: Search operations are debounced to prevent excessive API calls
- **Lazy Loading**: Components are lazy-loaded where appropriate
- **Memoization**: Expensive calculations are memoized using React.useMemo

## Security

- **Input Validation**: All user inputs are validated
- **XSS Prevention**: Content is properly escaped
- **File Upload Security**: File types and sizes are validated
- **Password Protection**: Upload functionality is password-protected
