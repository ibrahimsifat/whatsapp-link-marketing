"use client"

import { FileService } from "../services/file-service"
import { WhatsAppService } from "../services/whatsapp-service"
import { TemplateService } from "../services/template-service"
import { ToastUtils } from "../utils/toast-utils"
import type { Contact } from "../types/contact"

export function useContactOperations(
  contacts: Contact[],
  customMessage: string,
  onContactsUpdate: (contacts: Contact[]) => void,
) {
  const handleImportContacts = (newContacts: Contact[]) => {
    const existingNumbers = new Set(contacts.map((c) => c.normalized))
    const uniqueNewContacts = newContacts.filter((contact) => !existingNumbers.has(contact.normalized))

    if (uniqueNewContacts.length > 0) {
      const updatedContacts = [...contacts, ...uniqueNewContacts]
      const finalContacts = updatedContacts.map((contact) => ({
        ...contact,
        whatsappLink: WhatsAppService.generateWhatsAppLink(
          contact.normalized,
          TemplateService.replaceVariables(customMessage, contact),
        ),
      }))
      onContactsUpdate(finalContacts)
    }
  }

  const updateWhatsAppLinks = (message?: string) => {
    const messageToUse = message || customMessage
    const updatedContacts = contacts.map((contact) => ({
      ...contact,
      whatsappLink: WhatsAppService.generateWhatsAppLink(
        contact.normalized,
        TemplateService.replaceVariables(messageToUse, contact),
      ),
    }))
    onContactsUpdate(updatedContacts)
  }

  const handleBulkExport = (selectedContacts: Contact[]) => {
    if (selectedContacts.length === 0) {
      ToastUtils.warning("No contacts selected")
      return
    }

    const csvContent = FileService.exportContacts(selectedContacts, "csv")
    const filename = `selected-contacts-${new Date().toISOString().split("T")[0]}.csv`
    FileService.downloadFile(csvContent, filename, "text/csv")
    ToastUtils.success(`Exported ${selectedContacts.length} selected contacts`)
  }

  return {
    handleImportContacts,
    updateWhatsAppLinks,
    handleBulkExport,
  }
}
