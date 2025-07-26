import type { Contact } from "../types/contact"
import type { SearchCriteria } from "../components/advanced-search"

export class AdvancedSearchService {
  static searchContacts(contacts: Contact[], criteria: SearchCriteria): Contact[] {
    if (!contacts || !Array.isArray(contacts)) {
      return []
    }

    return contacts.filter((contact) => {
      // General search term
      if (criteria.searchTerm) {
        const searchLower = criteria.searchTerm.toLowerCase()
        const matchesGeneral =
          contact.companyName?.toLowerCase().includes(searchLower) ||
          contact.companyCategory?.toLowerCase().includes(searchLower) ||
          contact.normalized.includes(criteria.searchTerm) ||
          contact.website?.toLowerCase().includes(searchLower) ||
          contact.source?.toLowerCase().includes(searchLower) ||
          (contact.dynamicData &&
            Object.values(contact.dynamicData).some((val) => String(val).toLowerCase().includes(searchLower)))

        if (!matchesGeneral) return false
      }

      // Company name search
      if (criteria.companyName) {
        const companyLower = criteria.companyName.toLowerCase()
        if (!contact.companyName?.toLowerCase().includes(companyLower)) {
          return false
        }
      }

      // Company category filter
      if (criteria.companyCategory && criteria.companyCategory !== "all") {
        if (contact.companyCategory !== criteria.companyCategory) {
          return false
        }
      }

      // Website filter
      if (criteria.hasWebsite !== undefined && criteria.hasWebsite !== "all") {
        if (contact.hasWebsite !== criteria.hasWebsite) {
          return false
        }
      }

      // Status filter
      if (criteria.status && criteria.status !== "all") {
        if (contact.status !== criteria.status) {
          return false
        }
      }

      // Source filter
      if (criteria.source && criteria.source !== "all") {
        if (contact.source !== criteria.source) {
          return false
        }
      }

      // Phone pattern search
      if (criteria.phonePattern) {
        const pattern = criteria.phonePattern.toLowerCase()
        if (!contact.normalized.toLowerCase().includes(pattern) && !contact.original.toLowerCase().includes(pattern)) {
          return false
        }
      }

      // Date range filter
      if (criteria.dateFrom || criteria.dateTo) {
        const contactDate = new Date(contact.lastUpdated)

        if (criteria.dateFrom) {
          const fromDate = new Date(criteria.dateFrom)
          if (contactDate < fromDate) return false
        }

        if (criteria.dateTo) {
          const toDate = new Date(criteria.dateTo)
          toDate.setHours(23, 59, 59, 999) // End of day
          if (contactDate > toDate) return false
        }
      }

      // Custom fields search
      if (criteria.customFields && contact.dynamicData) {
        for (const [field, value] of Object.entries(criteria.customFields)) {
          if (value && value.trim()) {
            const contactValue = contact.dynamicData[field]
            if (!contactValue || !String(contactValue).toLowerCase().includes(value.toLowerCase())) {
              return false
            }
          }
        }
      }

      return true
    })
  }

  static getUniqueCategories(contacts: Contact[]): string[] {
    if (!contacts || !Array.isArray(contacts)) {
      return []
    }
    const categories = new Set<string>()
    contacts.forEach((contact) => {
      if (contact.companyCategory) {
        categories.add(contact.companyCategory)
      }
    })
    return Array.from(categories).sort()
  }

  static getUniqueSources(contacts: Contact[]): string[] {
    if (!contacts || !Array.isArray(contacts)) {
      return []
    }
    const sources = new Set<string>()
    contacts.forEach((contact) => {
      if (contact.source) {
        sources.add(contact.source)
      }
    })
    return Array.from(sources).sort()
  }

  static getCustomFields(contacts: Contact[]): string[] {
    if (!contacts || !Array.isArray(contacts)) {
      return []
    }
    const fields = new Set<string>()
    contacts.forEach((contact) => {
      if (contact.dynamicData) {
        Object.keys(contact.dynamicData).forEach((key) => {
          fields.add(key)
        })
      }
    })
    return Array.from(fields).sort()
  }

  static exportSearchResults(contacts: Contact[], criteria: SearchCriteria): string {
    const searchResults = this.searchContacts(contacts, criteria)

    if (searchResults.length === 0) {
      return "No contacts found matching the search criteria."
    }

    const headers = ["Company Name", "Category", "Phone", "Website", "Status", "Source", "Last Updated"]
    const csvContent = [
      headers.join(","),
      ...searchResults.map((contact) =>
        [
          `"${contact.companyName || ""}"`,
          `"${contact.companyCategory || ""}"`,
          `"${contact.normalized}"`,
          `"${contact.website || ""}"`,
          `"${contact.status}"`,
          `"${contact.source || ""}"`,
          `"${new Date(contact.lastUpdated).toLocaleDateString()}"`,
        ].join(","),
      ),
    ].join("\n")

    return csvContent
  }
}
