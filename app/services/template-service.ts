import type { Contact, MessageTemplate } from "../types/contact"

export class TemplateService {
  /**
   * Replaces template variables with contact data
   */
  static replaceVariables(template: string, contact: Partial<Contact>): string {
    let replacedText = template
      .replace(/\{companyName\}/g, contact.companyName || "there")
      .replace(/\{companyCategory\}/g, contact.companyCategory || "your industry")
      .replace(/\{website\}/g, contact.website || "")

    // Replace custom dynamic variables
    if (contact.dynamicData) {
      for (const key in contact.dynamicData) {
        if (Object.prototype.hasOwnProperty.call(contact.dynamicData, key)) {
          const value = contact.dynamicData[key]
          replacedText = replacedText.replace(new RegExp(`\\{${key}\\}`, "g"), String(value || ""))
        }
      }
    }
    return replacedText
  }

  /**
   * Extracts all variables from a template string
   */
  static extractVariables(template: string): string[] {
    const variableRegex = /\{([^}]+)\}/g
    const variables: string[] = []
    let match

    while ((match = variableRegex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    return variables
  }

  /**
   * Validates template syntax
   */
  static validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const variables = this.extractVariables(template)

    // Check for unclosed braces
    const openBraces = (template.match(/\{/g) || []).length
    const closeBraces = (template.match(/\}/g) || []).length

    if (openBraces !== closeBraces) {
      errors.push("Mismatched braces in template")
    }

    // Check for empty variables
    if (variables.some((v) => v.trim() === "")) {
      errors.push("Empty variable names found")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Extracts custom variables from contacts
   */
  static extractCustomVariables(contacts: Contact[]): string[] {
    const keys = new Set<string>()
    contacts.forEach((contact) => {
      if (contact.dynamicData) {
        Object.keys(contact.dynamicData).forEach((key) => keys.add(key))
      }
    })
    return Array.from(keys)
  }

  /**
   * Creates a preview of template with sample data
   */
  static createPreview(template: MessageTemplate): string {
    const sampleContact: Partial<Contact> = {
      companyName: "Sample Company",
      companyCategory: "Technology",
      website: "https://example.com",
      dynamicData: {
        contactPerson: "John Doe",
        product: "Software Solution",
        lastInteractionDate: "2024-01-15",
      },
    }

    return this.replaceVariables(template.content, sampleContact)
  }
}
