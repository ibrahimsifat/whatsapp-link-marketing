import type { Contact } from "../types/contact"

export interface FilterOptions {
  category: string
  website: string
  status: string
  searchTerm: string
}

export interface WebsiteStats {
  total: number
  withWebsite: number
  noWebsite: number
}

export class ContactFilterService {
  /**
   * Filters contacts based on provided criteria
   */
  static filterContacts(contacts: Contact[], filters: FilterOptions): Contact[] {
    return contacts.filter((contact) => {
      // Category filter
      if (filters.category !== "all" && contact.companyCategory !== filters.category) {
        return false
      }

      // Website filter
      if (filters.website === "with_website" && !contact.hasWebsite) {
        return false
      }
      if (filters.website === "no_website" && contact.hasWebsite) {
        return false
      }

      // Status filter
      if (filters.status !== "all" && contact.status !== filters.status) {
        return false
      }

      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matchesSearch =
          contact.companyName?.toLowerCase().includes(searchLower) ||
          contact.companyCategory?.toLowerCase().includes(searchLower) ||
          contact.normalized.includes(filters.searchTerm) ||
          contact.website?.toLowerCase().includes(searchLower) ||
          (contact.dynamicData &&
            Object.values(contact.dynamicData).some((val) => String(val).toLowerCase().includes(searchLower)))

        if (!matchesSearch) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Gets unique categories from contacts
   */
  static getUniqueCategories(contacts: Contact[]): string[] {
    return Array.from(new Set(contacts.map((c) => c.companyCategory).filter((c): c is string => Boolean(c))))
  }

  /**
   * Gets website statistics
   */
  static getWebsiteStats(contacts: Contact[]): WebsiteStats {
    return {
      total: contacts.length,
      withWebsite: contacts.filter((c) => c.hasWebsite).length,
      noWebsite: contacts.filter((c) => !c.hasWebsite).length,
    }
  }

  /**
   * Gets status statistics
   */
  static getStatusStats(contacts: Contact[]): Record<string, number> {
    const stats: Record<string, number> = {
      pending: 0,
      sent: 0,
      not_sent: 0,
    }

    contacts.forEach((contact) => {
      stats[contact.status] = (stats[contact.status] || 0) + 1
    })

    return stats
  }

  /**
   * Sorts contacts by specified field
   */
  static sortContacts(contacts: Contact[], sortBy: keyof Contact, sortOrder: "asc" | "desc" = "asc"): Contact[] {
    return [...contacts].sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return sortOrder === "asc" ? 1 : -1
      if (bValue === undefined) return sortOrder === "asc" ? -1 : 1

      const comparison = String(aValue).localeCompare(String(bValue))
      return sortOrder === "asc" ? comparison : -comparison
    })
  }

  /**
   * Paginates contacts array
   */
  static paginateContacts(
    contacts: Contact[],
    page: number,
    itemsPerPage: number,
  ): {
    contacts: Contact[]
    totalPages: number
    currentPage: number
    totalItems: number
    hasNextPage: boolean
    hasPrevPage: boolean
  } {
    const totalItems = contacts.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const currentPage = Math.max(1, Math.min(page, totalPages))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    return {
      contacts: contacts.slice(startIndex, endIndex),
      totalPages,
      currentPage,
      totalItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }
  }
}
