/**
 * Validation Service
 *
 * Provides comprehensive validation for all data types used in the application.
 * Includes phone numbers, templates, files, and general data validation.
 */

import { VALIDATION_RULES, ERROR_MESSAGES } from "../constants/app-constants"
import type { ValidationResult, ValidationRule, PhoneValidationResult } from "./types"
import type { Contact, MessageTemplate } from "../types"
import { PhoneService } from "./phone-service"

export class ValidationService {
  /**
   * Validate phone number
   */
  static validatePhone(phone: string, strict = true): PhoneValidationResult {
    if (!phone || typeof phone !== "string") {
      return {
        isValid: false,
        error: ERROR_MESSAGES.PHONE.REQUIRED,
      }
    }

    const cleanPhone = phone.replace(/\D/g, "")

    // Check length
    if (cleanPhone.length < VALIDATION_RULES.PHONE.MIN_LENGTH) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.PHONE.TOO_SHORT,
      }
    }

    if (cleanPhone.length > VALIDATION_RULES.PHONE.MAX_LENGTH) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.PHONE.TOO_LONG,
      }
    }

    // Check Saudi format. PhoneService owns the list of accepted shapes
    // (05X, 5X, 966..., +966..., 00966..., and the 966 + 0 trunk variant) so
    // that manual entry and spreadsheet import never disagree on validity.
    const saudiNormalized = PhoneService.normalizePhoneNumber(phone)
    if (saudiNormalized) {
      return {
        isValid: true,
        normalized: saudiNormalized,
        country: "SA",
        type: "mobile",
      }
    }

    // Check international format
    if (phone.startsWith("+") && VALIDATION_RULES.PHONE.INTERNATIONAL_PATTERN.test(phone)) {
      return {
        isValid: true,
        normalized: phone,
        country: "unknown",
        type: "unknown",
      }
    }

    return {
      isValid: false,
      error: ERROR_MESSAGES.PHONE.INVALID_FORMAT,
    }
  }

  /**
   * Validate message template
   */
  static validateTemplate(template: Partial<MessageTemplate>): ValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = []
    const warnings: Array<{ field: string; message: string; value?: any }> = []

    // Validate name
    if (!template.name || template.name.trim().length === 0) {
      errors.push({
        field: "name",
        message: ERROR_MESSAGES.TEMPLATE.NAME_REQUIRED,
        value: template.name,
      })
    } else if (template.name.length > VALIDATION_RULES.TEMPLATE.MAX_NAME_LENGTH) {
      errors.push({
        field: "name",
        message: `Template name must be less than ${VALIDATION_RULES.TEMPLATE.MAX_NAME_LENGTH} characters`,
        value: template.name,
      })
    }

    // Validate content
    if (!template.content || template.content.trim().length === 0) {
      errors.push({
        field: "content",
        message: ERROR_MESSAGES.TEMPLATE.CONTENT_REQUIRED,
        value: template.content,
      })
    } else if (template.content.length > VALIDATION_RULES.TEMPLATE.MAX_CONTENT_LENGTH) {
      errors.push({
        field: "content",
        message: `Template content must be less than ${VALIDATION_RULES.TEMPLATE.MAX_CONTENT_LENGTH} characters`,
        value: template.content,
      })
    }

    // Validate variables syntax
    if (template.content) {
      const openBraces = (template.content.match(/\{/g) || []).length
      const closeBraces = (template.content.match(/\}/g) || []).length

      if (openBraces !== closeBraces) {
        errors.push({
          field: "content",
          message: "Mismatched braces in template variables",
          value: template.content,
        })
      }

      // Check for empty variables
      const variables = template.content.match(VALIDATION_RULES.TEMPLATE.VARIABLE_PATTERN) || []
      const emptyVariables = variables.filter((v) => v === "{}")

      if (emptyVariables.length > 0) {
        errors.push({
          field: "content",
          message: "Template contains empty variables",
          value: emptyVariables,
        })
      }
    }

    // Validate category
    if (!template.category || template.category.trim().length === 0) {
      warnings.push({
        field: "category",
        message: "Template category is recommended for organization",
        value: template.category,
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate contact data
   */
  static validateContact(contact: Partial<Contact>): ValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = []
    const warnings: Array<{ field: string; message: string; value?: any }> = []

    // Validate phone numbers
    if (!contact.original) {
      errors.push({
        field: "original",
        message: ERROR_MESSAGES.PHONE.REQUIRED,
      })
    } else {
      const phoneValidation = this.validatePhone(contact.original)
      if (!phoneValidation.isValid) {
        errors.push({
          field: "original",
          message: phoneValidation.error || ERROR_MESSAGES.PHONE.INVALID_FORMAT,
          value: contact.original,
        })
      }
    }

    // Validate website URL
    if (contact.website && contact.website.trim().length > 0) {
      try {
        new URL(contact.website)
      } catch {
        warnings.push({
          field: "website",
          message: "Website URL appears to be invalid",
          value: contact.website,
        })
      }
    }

    // Validate status
    if (contact.status && !["pending", "sent", "not_sent"].includes(contact.status)) {
      errors.push({
        field: "status",
        message: "Invalid contact status",
        value: contact.status,
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File): ValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = []
    const warnings: Array<{ field: string; message: string; value?: any }> = []

    // Check file size
    if (file.size > VALIDATION_RULES.FILE.MAX_SIZE) {
      errors.push({
        field: "size",
        message: ERROR_MESSAGES.FILE_UPLOAD.SIZE_EXCEEDED,
        value: file.size,
      })
    }

    // Check file type
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
    const supportedExtensions = [".xlsx", ".xls", ".csv"]

    if (!supportedExtensions.includes(extension)) {
      errors.push({
        field: "type",
        message: ERROR_MESSAGES.FILE_UPLOAD.INVALID_FORMAT,
        value: extension,
      })
    }

    // Check file name
    if (file.name.length > 255) {
      warnings.push({
        field: "name",
        message: "File name is very long and may cause issues",
        value: file.name,
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generic data validation using rules
   */
  static validateData<T extends Record<string, any>>(data: T, rules: ValidationRule<T>[]): ValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = []
    const warnings: Array<{ field: string; message: string; value?: any }> = []

    rules.forEach((rule) => {
      const value = data[rule.field]
      const fieldName = String(rule.field)

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push({
          field: fieldName,
          message: `${fieldName} is required`,
          value,
        })
        return
      }

      // Skip validation if field is empty and not required
      if (!rule.required && (value === undefined || value === null || value === "")) {
        return
      }

      // Type validation
      if (rule.type) {
        const isValidType = this.validateType(value, rule.type)
        if (!isValidType) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be of type ${rule.type}`,
            value,
          })
          return
        }
      }

      // Length validation for strings
      if (typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be at least ${rule.minLength} characters`,
            value,
          })
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({
            field: fieldName,
            message: `${fieldName} must be no more than ${rule.maxLength} characters`,
            value,
          })
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === "string") {
        if (!rule.pattern.test(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} format is invalid`,
            value,
          })
        }
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value)
        if (customResult !== true) {
          errors.push({
            field: fieldName,
            message: typeof customResult === "string" ? customResult : `${fieldName} is invalid`,
            value,
          })
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate data type
   */
  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case "string":
        return typeof value === "string"
      case "number":
        return typeof value === "number" && !isNaN(value)
      case "boolean":
        return typeof value === "boolean"
      case "email":
        return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case "phone":
        return this.validatePhone(value).isValid
      case "url":
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      default:
        return true
    }
  }

  /**
   * Sanitize input data
   */
  static sanitize(input: string): string {
    if (typeof input !== "string") {
      return String(input)
    }

    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .substring(0, 1000) // Limit length
  }

  /**
   * Validate bulk data
   */
  static validateBulk<T extends Record<string, any>>(
    items: T[],
    rules: ValidationRule<T>[],
    options: { stopOnFirstError?: boolean; maxErrors?: number } = {},
  ): {
    isValid: boolean
    validItems: T[]
    invalidItems: Array<{ item: T; errors: ValidationResult["errors"] }>
    totalErrors: number
  } {
    const validItems: T[] = []
    const invalidItems: Array<{ item: T; errors: ValidationResult["errors"] }> = []
    let totalErrors = 0

    for (const item of items) {
      const validation = this.validateData(item, rules)

      if (validation.isValid) {
        validItems.push(item)
      } else {
        invalidItems.push({
          item,
          errors: validation.errors,
        })
        totalErrors += validation.errors.length

        if (options.stopOnFirstError) {
          break
        }

        if (options.maxErrors && totalErrors >= options.maxErrors) {
          break
        }
      }
    }

    return {
      isValid: invalidItems.length === 0,
      validItems,
      invalidItems,
      totalErrors,
    }
  }
}
