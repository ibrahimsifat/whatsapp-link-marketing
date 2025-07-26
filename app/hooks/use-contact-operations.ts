"use client"

import { useState, useRef } from "react"
import { BatchSendService } from "../services/batch-send-service"
import { FileService } from "../services/file-service"
import { WhatsAppService } from "../services/whatsapp-service"
import { TemplateService } from "../services/template-service"
import { ToastUtils } from "../utils/toast-utils"
import { APP_CONSTANTS } from "../constants/app-constants"
import type { Contact } from "../types/contact"

interface BatchSendState {
  isBatchSending: boolean
  currentBatchIndex: number
}

export function useContactOperations(
  contacts: Contact[],
  customMessage: string,
  onContactsUpdate: (contacts: Contact[]) => void,
  onContactStatusUpdate: (contactId: string, status: Contact["status"]) => void,
) {
  const [batchState, setBatchState] = useState<BatchSendState>({
    isBatchSending: false,
    currentBatchIndex: 0,
  })

  const batchSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateBatchState = (updates: Partial<BatchSendState>) => {
    setBatchState((prev) => ({ ...prev, ...updates }))
  }

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

  const startBatchSend = (paginatedContacts: Contact[]) => {
    if (paginatedContacts.length === 0) {
      ToastUtils.error("No contacts to send in the current page.")
      return
    }

    updateBatchState({ isBatchSending: true, currentBatchIndex: 0 })

    BatchSendService.startBatchSend({
      contacts: paginatedContacts,
      delayMs: APP_CONSTANTS.BATCH_SEND_DELAY_MS,
      onProgress: (index) => updateBatchState({ currentBatchIndex: index }),
      onComplete: () => {
        updateBatchState({ isBatchSending: false, currentBatchIndex: 0 })
        ToastUtils.success("Batch sending completed!")
      },
      onContactSent: (contactId) => onContactStatusUpdate(contactId, "sent"),
    })
  }

  const stopBatchSend = () => {
    BatchSendService.stopBatchSend()
    updateBatchState({ isBatchSending: false })
    ToastUtils.info("Batch sending stopped.")
  }

  return {
    batchState,
    batchSendTimeoutRef,
    handleImportContacts,
    updateWhatsAppLinks,
    handleBulkExport,
    startBatchSend,
    stopBatchSend,
  }
}
