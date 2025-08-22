import type { Contact, DuplicateMatch, DuplicateGroup, DuplicateDetectionSettings } from "../types/contact"

export class DuplicateDetectionService {
  private settings: DuplicateDetectionSettings = {
    phoneThreshold: 0.9,
    nameThreshold: 0.8,
    companyThreshold: 0.85,
    websiteThreshold: 0.95,
    autoMergeThreshold: 0.9,
    enableAutoMerge: true,
  }

  constructor(customSettings?: Partial<DuplicateDetectionSettings>) {
    if (customSettings) {
      this.settings = { ...this.settings, ...customSettings }
    }
  }

  detectDuplicates(contacts: Contact[]): DuplicateGroup[] {
    const duplicateGroups: DuplicateGroup[] = []
    const processedContacts = new Set<string>()

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      if (processedContacts.has(contact.id)) continue

      const matches: DuplicateMatch[] = []

      for (let j = i + 1; j < contacts.length; j++) {
        const otherContact = contacts[j]

        if (processedContacts.has(otherContact.id)) continue

        const score = this.calculateSimilarityScore(contact, otherContact)

        if (score > 0.5) {
          // Minimum threshold for considering as potential duplicate
          const reasons = this.getMatchReasons(contact, otherContact, score)
          const suggestedAction = this.getSuggestedAction(score)

          matches.push({
            contact: otherContact,
            score,
            reasons,
            suggestedAction,
          })

          processedContacts.add(otherContact.id)
        }
      }

      if (matches.length > 0) {
        const confidence = Math.max(...matches.map((m) => m.score))
        const autoMergeRecommended = confidence >= this.settings.autoMergeThreshold

        duplicateGroups.push({
          id: `group_${contact.id}`,
          contacts: [contact, ...matches.map((m) => m.contact)],
          primaryContact: contact,
          matches,
          confidence,
          autoMergeRecommended,
        })

        processedContacts.add(contact.id)
      }
    }

    return duplicateGroups.sort((a, b) => b.confidence - a.confidence)
  }

  private calculateSimilarityScore(contact1: Contact, contact2: Contact): number {
    let totalScore = 0
    let weightSum = 0

    // Phone number similarity (highest weight)
    const phoneScore = this.calculatePhoneSimilarity(contact1.normalized, contact2.normalized)
    totalScore += phoneScore * 0.4
    weightSum += 0.4

    // Company name similarity
    if (contact1.companyName && contact2.companyName) {
      const companyScore = this.calculateStringSimilarity(
        contact1.companyName.toLowerCase(),
        contact2.companyName.toLowerCase(),
      )
      totalScore += companyScore * 0.25
      weightSum += 0.25
    }

    // Website similarity
    if (contact1.website && contact2.website) {
      const websiteScore = this.calculateStringSimilarity(
        contact1.website.toLowerCase(),
        contact2.website.toLowerCase(),
      )
      totalScore += websiteScore * 0.2
      weightSum += 0.2
    }

    // Category similarity
    if (contact1.companyCategory && contact2.companyCategory) {
      const categoryScore = contact1.companyCategory === contact2.companyCategory ? 1 : 0
      totalScore += categoryScore * 0.15
      weightSum += 0.15
    }

    return weightSum > 0 ? totalScore / weightSum : 0
  }

  private calculatePhoneSimilarity(phone1: string, phone2: string): number {
    if (phone1 === phone2) return 1

    // Remove all non-digits for comparison
    const digits1 = phone1.replace(/\D/g, "")
    const digits2 = phone2.replace(/\D/g, "")

    if (digits1 === digits2) return 0.95

    // Check if one is a subset of the other (different country codes)
    const minLength = Math.min(digits1.length, digits2.length)
    const maxLength = Math.max(digits1.length, digits2.length)

    if (minLength >= 7) {
      // Valid phone number length
      const suffix1 = digits1.slice(-minLength)
      const suffix2 = digits2.slice(-minLength)

      if (suffix1 === suffix2) {
        return 0.85 // High similarity for same number with different country codes
      }
    }

    // Levenshtein distance for fuzzy matching
    return 1 - this.levenshteinDistance(digits1, digits2) / maxLength
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1
    if (str1.length === 0 || str2.length === 0) return 0

    const maxLength = Math.max(str1.length, str2.length)
    const distance = this.levenshteinDistance(str1, str2)

    return 1 - distance / maxLength
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  private getMatchReasons(contact1: Contact, contact2: Contact, score: number): string[] {
    const reasons: string[] = []

    const phoneScore = this.calculatePhoneSimilarity(contact1.normalized, contact2.normalized)
    if (phoneScore > this.settings.phoneThreshold) {
      reasons.push(`Phone numbers match (${Math.round(phoneScore * 100)}%)`)
    }

    if (contact1.companyName && contact2.companyName) {
      const companyScore = this.calculateStringSimilarity(
        contact1.companyName.toLowerCase(),
        contact2.companyName.toLowerCase(),
      )
      if (companyScore > this.settings.companyThreshold) {
        reasons.push(`Company names similar (${Math.round(companyScore * 100)}%)`)
      }
    }

    if (contact1.website && contact2.website) {
      const websiteScore = this.calculateStringSimilarity(
        contact1.website.toLowerCase(),
        contact2.website.toLowerCase(),
      )
      if (websiteScore > this.settings.websiteThreshold) {
        reasons.push(`Websites match (${Math.round(websiteScore * 100)}%)`)
      }
    }

    if (contact1.companyCategory && contact2.companyCategory && contact1.companyCategory === contact2.companyCategory) {
      reasons.push("Same business category")
    }

    return reasons
  }

  private getSuggestedAction(score: number): "merge" | "review" | "ignore" {
    if (score >= this.settings.autoMergeThreshold) return "merge"
    if (score >= 0.7) return "review"
    return "ignore"
  }

  autoMergeContacts(group: DuplicateGroup): Contact {
    const { primaryContact, matches } = group

    // Merge data from all contacts, prioritizing non-empty values
    const mergedContact: Contact = {
      ...primaryContact,
      lastUpdated: new Date().toISOString(),
      source: [primaryContact.source, ...matches.map((m) => m.contact.source)].join(", "),
      notes: [
        primaryContact.notes,
        ...matches.map((m) => m.contact.notes),
        `Auto-merged ${matches.length} duplicate(s) on ${new Date().toLocaleDateString()}`,
      ]
        .filter(Boolean)
        .join(" | "),
    }

    // Merge dynamic data
    if (matches.some((m) => m.contact.dynamicData)) {
      mergedContact.dynamicData = {
        ...primaryContact.dynamicData,
        ...matches.reduce((acc, match) => ({ ...acc, ...match.contact.dynamicData }), {}),
      }
    }

    // Use the most recent status if any contact was sent
    const allContacts = [primaryContact, ...matches.map((m) => m.contact)]
    const sentContact = allContacts.find((c) => c.status === "sent")
    if (sentContact) {
      mergedContact.status = "sent"
      mergedContact.sentAt = sentContact.sentAt
    }

    return mergedContact
  }

  updateSettings(newSettings: Partial<DuplicateDetectionSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  }

  getSettings(): DuplicateDetectionSettings {
    return { ...this.settings }
  }
}
