import type { Contact, MessageTemplate } from "../types/contact"
import type { TemplateGroup, ResolvedTemplate } from "../types/template-group"
import { resolveTemplateForContact } from "../types/template-group"

export class TemplateService {
  /**
   * Ensures proper emoji encoding for WhatsApp URLs
   */
  static encodeForWhatsApp(text: string): string {
    // This ensures emojis are properly encoded when creating WhatsApp links
    return encodeURIComponent(text)
  }

  /**
   * Replaces template variables with contact data and ensures proper encoding
   */
  static replaceVariables(template: string, contact: Partial<Contact>): string {
    let replacedText = template
      .replace(/\{companyName\}/g, contact.companyName || "there")
      .replace(/\{companyCategory\}/g, contact.companyCategory || "your industry")
      .replace(/\{website\}/g, contact.website || "")
      .replace(/\{city\}/g, contact.city || "your city")
      .replace(/\{language\}/g, contact.language || "")

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
   * Renders a template variant into the exact text WhatsApp will receive.
   *
   * The image is appended rather than embedded: click-to-chat links carry only
   * text, so the URL travels in the body and the recipient's WhatsApp client
   * expands it into a thumbnail. It goes last so the written message is what
   * the recipient reads first, and is skipped when the content already
   * contains that URL (an operator who inserted it inline while writing).
   */
  static renderVariant(variant: Pick<MessageTemplate, "content" | "imageUrl">, contact: Partial<Contact>): string {
    const body = this.replaceVariables(variant.content, contact)
    const imageUrl = variant.imageUrl?.trim()

    if (!imageUrl || body.includes(imageUrl)) return body

    return `${body.trimEnd()}

${imageUrl}`
  }

  /**
   * Renders the message a specific contact should receive from a template.
   *
   * This is the single place language selection happens for an outgoing
   * message, so the bulk sender, the preview and the per-contact link all agree
   * on what a given contact would be sent.
   */
  static renderForContact(
    group: TemplateGroup,
    contact: Contact,
  ): ResolvedTemplate & { message: string } {
    const resolved = resolveTemplateForContact(group, contact)
    return { ...resolved, message: this.renderVariant(resolved.variant, contact) }
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
   * Validates template syntax and content quality
   */
  static validateTemplate(template: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []
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

    // Content quality checks
    if (template.length < 10) {
      warnings.push("Template is very short")
    }

    if (template.length > 1000) {
      warnings.push("Template is quite long - consider shortening for better engagement")
    }

    // Check for professional tone
    const unprofessionalWords = ["hey", "yo", "sup", "lol", "omg"]
    const hasUnprofessional = unprofessionalWords.some((word) => template.toLowerCase().includes(word))
    if (hasUnprofessional) {
      warnings.push("Consider using more professional language")
    }

    // Check for call-to-action
    const hasCallToAction =
      template.includes("?") ||
      template.toLowerCase().includes("contact") ||
      template.toLowerCase().includes("call") ||
      template.toLowerCase().includes("reply") ||
      template.toLowerCase().includes("interested")

    if (!hasCallToAction) {
      warnings.push("Consider adding a clear call-to-action")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
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
      city: "Riyadh",
      language: "Arabic",
      website: "https://example.com",
      dynamicData: {
        contactPerson: "John Doe",
        product: "Software Solution",
        lastInteractionDate: "2024-01-15",
      },
    }

    return this.replaceVariables(template.content, sampleContact)
  }

  /**
   * Optimizes template for better engagement
   */
  static optimizeTemplate(template: string): { optimized: string; changes: string[] } {
    let optimized = template
    const changes: string[] = []

    // Add greeting if missing
    if (
      !template.toLowerCase().startsWith("hi") &&
      !template.toLowerCase().startsWith("hello") &&
      !template.toLowerCase().startsWith("dear")
    ) {
      optimized = "Hello! 👋\n\n" + optimized
      changes.push("Added professional greeting")
    }

    // Ensure proper spacing around variables
    optimized = optimized.replace(/\{(\w+)\}/g, " {$1} ").replace(/\s+/g, " ")

    // Add closing if missing
    if (
      !template.toLowerCase().includes("regards") &&
      !template.toLowerCase().includes("best") &&
      !template.toLowerCase().includes("sincerely")
    ) {
      optimized += "\n\nBest regards! 🤝"
      changes.push("Added professional closing")
    }

    return {
      optimized: optimized.trim(),
      changes,
    }
  }

  /**
   * Analyzes template performance potential
   */
  static analyzeTemplate(template: string): {
    score: number
    factors: { factor: string; impact: string; score: number }[]
    recommendations: string[]
  } {
    const factors: { factor: string; impact: string; score: number }[] = []
    const recommendations: string[] = []
    let totalScore = 0

    // Length analysis
    const length = template.length
    if (length >= 50 && length <= 300) {
      factors.push({ factor: "Message Length", impact: "Optimal", score: 20 })
      totalScore += 20
    } else if (length < 50) {
      factors.push({ factor: "Message Length", impact: "Too Short", score: 10 })
      totalScore += 10
      recommendations.push("Consider adding more context to your message")
    } else {
      factors.push({ factor: "Message Length", impact: "Too Long", score: 5 })
      totalScore += 5
      recommendations.push("Consider shortening your message for better engagement")
    }

    // Personalization
    const hasVariables = template.includes("{") && template.includes("}")
    if (hasVariables) {
      factors.push({ factor: "Personalization", impact: "Good", score: 25 })
      totalScore += 25
    } else {
      factors.push({ factor: "Personalization", impact: "Missing", score: 0 })
      recommendations.push("Add personalization variables like {companyName}")
    }

    // Call to action
    const hasCallToAction =
      template.includes("?") ||
      template.toLowerCase().includes("interested") ||
      template.toLowerCase().includes("contact") ||
      template.toLowerCase().includes("call")

    if (hasCallToAction) {
      factors.push({ factor: "Call to Action", impact: "Present", score: 20 })
      totalScore += 20
    } else {
      factors.push({ factor: "Call to Action", impact: "Missing", score: 0 })
      recommendations.push("Add a clear call-to-action to encourage response")
    }

    // Professional tone
    const professionalWords = ["professional", "business", "service", "solution", "opportunity"]
    const hasProfessionalTone = professionalWords.some((word) => template.toLowerCase().includes(word))

    if (hasProfessionalTone) {
      factors.push({ factor: "Professional Tone", impact: "Good", score: 15 })
      totalScore += 15
    } else {
      factors.push({ factor: "Professional Tone", impact: "Could Improve", score: 10 })
      totalScore += 10
      recommendations.push("Consider using more professional business language")
    }

    // Emoji usage
    const emojiCount = (
      template.match(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ) || []
    ).length

    if (emojiCount >= 1 && emojiCount <= 3) {
      factors.push({ factor: "Emoji Usage", impact: "Balanced", score: 10 })
      totalScore += 10
    } else if (emojiCount === 0) {
      factors.push({ factor: "Emoji Usage", impact: "None", score: 5 })
      totalScore += 5
      recommendations.push("Consider adding 1-2 professional emojis")
    } else {
      factors.push({ factor: "Emoji Usage", impact: "Too Many", score: 2 })
      totalScore += 2
      recommendations.push("Reduce emoji usage for more professional appearance")
    }

    // Formatting
    const hasFormatting = template.includes("*") || template.includes("_") || template.includes("~")
    if (hasFormatting) {
      factors.push({ factor: "Text Formatting", impact: "Good", score: 10 })
      totalScore += 10
    } else {
      factors.push({ factor: "Text Formatting", impact: "Basic", score: 5 })
      totalScore += 5
      recommendations.push("Use *bold* or _italic_ to emphasize key points")
    }

    return {
      score: Math.min(100, totalScore),
      factors,
      recommendations,
    }
  }
}
