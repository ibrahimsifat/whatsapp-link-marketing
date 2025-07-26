/**
 * Service layer index file
 *
 * This file exports all services for easy importing throughout the application.
 * It provides a centralized access point to all business logic services.
 */

// Core services
export { ContactService } from "./contact-service"
export { TemplateService } from "./template-service"
export { FileService } from "./file-service"
export { WhatsAppService } from "./whatsapp-service"
export { PhoneService } from "./phone-service"

// Feature services
export { AdvancedSearchService } from "./advanced-search-service"
export { ContactFilterService } from "./contact-filter-service"
export { BatchSendService } from "./batch-send-service"

// Utility services
export { StorageService } from "./storage-service"
export { ValidationService } from "./validation-service"
export { ExportService } from "./export-service"

// Service types
export type {
  FileProcessingResult,
  FileValidationResult,
  ContactServiceResult,
  TemplateServiceResult,
  SearchResult,
  ExportResult,
} from "./types"
