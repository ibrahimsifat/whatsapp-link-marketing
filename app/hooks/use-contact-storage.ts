"use client"

import { useState, useCallback, useEffect } from "react"
import type { Contact, ContactDatabase } from "../types/contact"

const STORAGE_KEY = "whatsapp_contacts_db"
const DB_VERSION = "1.0.0"
const MAX_STORAGE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

export function useContactStorage() {
  const [isLoading, setIsLoading] = useState(false)
  const [database, setDatabase] = useState<ContactDatabase>({
    contacts: [],
    lastUpdated: new Date().toISOString(),
    version: DB_VERSION,
    totalContacts: 0,
    sentCount: 0,
    pendingCount: 0,
    notSentCount: 0,
  })

  // Load contacts from localStorage on mount
  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ContactDatabase
        setDatabase(parsed)
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
    }
  }, [])

  const checkStorageSize = (data: string): boolean => {
    const sizeInBytes = new Blob([data]).size
    return sizeInBytes <= MAX_STORAGE_SIZE
  }

  const saveContacts = useCallback(
    async (contacts: Contact[]) => {
      setIsLoading(true)
      try {
        // Filter out duplicates against existing contacts
        const existingNumbers = new Set(database.contacts.map((c) => c.normalized))
        const uniqueContacts: Contact[] = []
        const duplicates: Contact[] = []

        // Also track duplicates within the new batch
        const newBatchNumbers = new Set<string>()

        contacts.forEach((contact) => {
          if (existingNumbers.has(contact.normalized) || newBatchNumbers.has(contact.normalized)) {
            duplicates.push(contact)
          } else {
            uniqueContacts.push(contact)
            newBatchNumbers.add(contact.normalized)
          }
        })

        if (uniqueContacts.length === 0 && contacts.length > 0) {
          return {
            success: false,
            message: `All ${contacts.length} contacts were duplicates. No new contacts saved.`,
            stats: {
              total: contacts.length,
              saved: 0,
              duplicates: duplicates.length,
            },
          }
        }

        // Combine existing contacts with new unique contacts
        const allContacts = [...database.contacts, ...uniqueContacts]
        const stats = calculateStats(allContacts)

        const newDatabase: ContactDatabase = {
          contacts: allContacts,
          lastUpdated: new Date().toISOString(),
          version: DB_VERSION,
          ...stats,
        }

        const dataString = JSON.stringify(newDatabase)

        // Check if data exceeds storage limit
        if (!checkStorageSize(dataString)) {
          return {
            success: false,
            message:
              "Storage limit exceeded (10MB). Please reduce the number of contacts or export and clear some data.",
          }
        }

        localStorage.setItem(STORAGE_KEY, dataString)
        setDatabase(newDatabase)

        const message =
          duplicates.length > 0
            ? `Saved ${uniqueContacts.length} new contacts. ${duplicates.length} duplicates were skipped.`
            : `Saved ${uniqueContacts.length} contacts successfully`

        return {
          success: true,
          message,
          stats: {
            total: contacts.length,
            saved: uniqueContacts.length,
            duplicates: duplicates.length,
          },
        }
      } catch (error) {
        console.error("Error saving contacts:", error)
        if (error instanceof Error && error.name === "QuotaExceededError") {
          return {
            success: false,
            message: "Storage quota exceeded. Please export and clear some contacts to free up space.",
          }
        }
        return { success: false, message: "Failed to save contacts" }
      } finally {
        setIsLoading(false)
      }
    },
    [database.contacts],
  )

  const mergeContacts = useCallback(
    async (newContacts: Contact[], source: string) => {
      setIsLoading(true)
      try {
        const existingContacts = database.contacts
        const mergedContacts: Contact[] = []
        const duplicates: Contact[] = []
        const newAdditions: Contact[] = []

        // Create a map of existing contacts by normalized phone number
        const existingMap = new Map(existingContacts.map((contact) => [contact.normalized, contact]))

        // Track numbers within the new batch to avoid internal duplicates
        const processedNumbers = new Set<string>()

        // Process new contacts
        for (const newContact of newContacts) {
          // Skip if we've already processed this number in the current batch
          if (processedNumbers.has(newContact.normalized)) {
            duplicates.push(newContact)
            continue
          }

          processedNumbers.add(newContact.normalized)
          const existing = existingMap.get(newContact.normalized)

          if (existing) {
            // Update existing contact with new information
            const updatedContact: Contact = {
              ...existing,
              // Update with new data if available
              companyName: newContact.companyName || existing.companyName,
              companyCategory: newContact.companyCategory || existing.companyCategory,
              website: newContact.website || existing.website,
              hasWebsite: newContact.hasWebsite || existing.hasWebsite,
              lastUpdated: new Date().toISOString(),
              source: `${existing.source}, ${source}`, // Track multiple sources
            }
            mergedContacts.push(updatedContact)
            duplicates.push(newContact)
          } else {
            // Add new contact
            const contactToAdd: Contact = {
              ...newContact,
              status: "pending", // New contacts are pending by default
              lastUpdated: new Date().toISOString(),
              source,
            }
            mergedContacts.push(contactToAdd)
            newAdditions.push(contactToAdd)
          }
        }

        // Add remaining existing contacts that weren't updated
        for (const existing of existingContacts) {
          if (!processedNumbers.has(existing.normalized)) {
            mergedContacts.push(existing)
          }
        }

        const result = await saveContacts(mergedContacts)

        if (!result.success) {
          return result
        }

        return {
          success: true,
          message: `Merged successfully: ${newAdditions.length} new, ${duplicates.length} duplicates handled`,
          stats: {
            newContacts: newAdditions.length,
            duplicates: duplicates.length,
            total: mergedContacts.length,
          },
        }
      } catch (error) {
        console.error("Error merging contacts:", error)
        return { success: false, message: "Failed to merge contacts" }
      } finally {
        setIsLoading(false)
      }
    },
    [database.contacts, saveContacts],
  )

  const updateContactStatus = useCallback(
    async (contactId: string, status: Contact["status"], notes?: string) => {
      try {
        const updatedContacts = database.contacts.map((contact) => {
          if (contact.id === contactId) {
            return {
              ...contact,
              status,
              sentAt: status === "sent" ? new Date().toISOString() : contact.sentAt,
              lastUpdated: new Date().toISOString(),
              notes: notes || contact.notes,
            }
          }
          return contact
        })

        const stats = calculateStats(updatedContacts)
        const newDatabase: ContactDatabase = {
          contacts: updatedContacts,
          lastUpdated: new Date().toISOString(),
          version: DB_VERSION,
          ...stats,
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatabase))
        setDatabase(newDatabase)

        return { success: true, message: "Contact status updated successfully" }
      } catch (error) {
        console.error("Error updating contact status:", error)
        return { success: false, message: "Failed to update contact status" }
      }
    },
    [database.contacts],
  )

  const deleteContact = useCallback(
    async (contactId: string) => {
      try {
        const updatedContacts = database.contacts.filter((contact) => contact.id !== contactId)
        const stats = calculateStats(updatedContacts)
        const newDatabase: ContactDatabase = {
          contacts: updatedContacts,
          lastUpdated: new Date().toISOString(),
          version: DB_VERSION,
          ...stats,
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatabase))
        setDatabase(newDatabase)

        return { success: true, message: "Contact deleted successfully" }
      } catch (error) {
        console.error("Error deleting contact:", error)
        return { success: false, message: "Failed to delete contact" }
      }
    },
    [database.contacts],
  )

  const exportContacts = useCallback(() => {
    try {
      const dataStr = JSON.stringify(database, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `whatsapp_contacts_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true, message: "Contacts exported successfully" }
    } catch (error) {
      console.error("Error exporting contacts:", error)
      return { success: false, message: "Failed to export contacts" }
    }
  }, [database])

  const clearAllContacts = useCallback(async () => {
    setIsLoading(true)
    try {
      const emptyDatabase: ContactDatabase = {
        contacts: [],
        lastUpdated: new Date().toISOString(),
        version: DB_VERSION,
        totalContacts: 0,
        sentCount: 0,
        pendingCount: 0,
        notSentCount: 0,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyDatabase))
      setDatabase(emptyDatabase)

      return { success: true, message: "All contacts cleared successfully" }
    } catch (error) {
      console.error("Error clearing contacts:", error)
      return { success: false, message: "Failed to clear contacts" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    database,
    isLoading,
    saveContacts,
    mergeContacts,
    updateContactStatus,
    deleteContact,
    exportContacts,
    clearAllContacts,
    loadContacts,
  }
}

function calculateStats(contacts: Contact[]) {
  return {
    totalContacts: contacts.length,
    sentCount: contacts.filter((c) => c.status === "sent").length,
    pendingCount: contacts.filter((c) => c.status === "pending").length,
    notSentCount: contacts.filter((c) => c.status === "not_sent").length,
  }
}
