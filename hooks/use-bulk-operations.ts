"use client"

import { useState } from "react"
import type { Contact } from "@/app/types/contact"

export function useBulkOperations() {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<{
    isOpen: boolean
    newStatus: Contact["status"]
    notes: string
  }>({
    isOpen: false,
    newStatus: "pending",
    notes: "",
  })

  const toggleContactSelection = (contact: Contact) => {
    setSelectedContacts((prev) => {
      const isSelected = prev.some((c) => c.id === contact.id)
      if (isSelected) {
        return prev.filter((c) => c.id !== contact.id)
      } else {
        return [...prev, contact]
      }
    })
  }

  const selectAllVisible = (visibleContacts: Contact[]) => {
    const allSelected = visibleContacts.every((contact) =>
      selectedContacts.some((selected) => selected.id === contact.id),
    )

    if (allSelected) {
      // Deselect all visible
      setSelectedContacts((prev) =>
        prev.filter((selected) => !visibleContacts.some((contact) => contact.id === selected.id)),
      )
    } else {
      // Select all visible
      const newSelections = visibleContacts.filter(
        (contact) => !selectedContacts.some((selected) => selected.id === contact.id),
      )
      setSelectedContacts((prev) => [...prev, ...newSelections])
    }
  }

  const clearSelection = () => {
    setSelectedContacts([])
  }

  return {
    selectedContacts,
    bulkStatusUpdate,
    setBulkStatusUpdate,
    toggleContactSelection,
    selectAllVisible,
    clearSelection,
    setSelectedContacts,
  }
}
