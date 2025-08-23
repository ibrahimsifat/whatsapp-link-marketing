"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { MessageTemplate } from "./types/contact"
import type { SearchCriteria } from "./components/advanced-search"

// Components
import { BackToTop } from "./components/back-to-top"
import { AppHeader } from "./components/app-header"
import { StatisticsSection } from "./components/statistics-section"
import { BulkMessageSender } from "./components/bulk-message-sender"

// Section Components
import { UploadDataSection } from "@/components/sections/upload-data-section"
import { MessageEditorSection } from "@/components/sections/message-editor-section"
import { BulkActionsSection } from "@/components/sections/bulk-actions-section"
import { ContactsOverviewSection } from "@/components/sections/contacts-overview-section"
import { InstructionsSection } from "@/components/sections/instructions-section"

// Hooks
import { useContactStorage } from "./hooks/use-contact-storage"
import { useAppState } from "./hooks/use-app-state"
import { useFileHandling } from "./hooks/use-file-handling"
import { useManualLink } from "./hooks/use-manual-link"
import { useContactOperations } from "./hooks/use-contact-operations"
import { useSectionToggles } from "@/hooks/use-section-toggles"
import { useMessagePersistence } from "@/hooks/use-message-persistence"
import { useBulkOperations } from "@/hooks/use-bulk-operations"

// Services
import { ContactFilterService } from "./services/contact-filter-service"
import { AdvancedSearchService } from "./services/advanced-search-service"
import { TemplateService } from "./services/template-service"

// Utils
import { ToastUtils } from "./utils/toast-utils"

export default function WhatsAppLinkGenerator() {
  const { state, updateState, resetState, resetPagination } = useAppState()
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({})

  const { isUploadSectionExpanded, isMessageEditorExpanded, isContactsOverviewExpanded, toggleSection } =
    useSectionToggles()

  const { customMessage, setCustomMessage } = useMessagePersistence(state.customMessage)

  const {
    selectedContacts,
    bulkStatusUpdate,
    setBulkStatusUpdate,
    toggleContactSelection,
    selectAllVisible,
    clearSelection,
    setSelectedContacts,
  } = useBulkOperations()

  // Contact storage hook
  const {
    database,
    isLoading: storageLoading,
    saveContacts,
    mergeContacts,
    updateContactStatus,
    deleteContact,
    exportContacts,
    clearAllContacts,
  } = useContactStorage()

  // File handling hook
  const fileHandling = useFileHandling(customMessage, (contacts) => {
    updateState({ contacts })
  })

  // Manual link hook
  const manualLink = useManualLink(customMessage)

  // Contact operations hook
  const contactOps = useContactOperations(
    state.contacts,
    customMessage,
    (contacts) => updateState({ contacts }),
    updateContactStatus,
  )

  useEffect(() => {
    if (customMessage !== state.customMessage) {
      updateState({ customMessage })
    }
  }, [customMessage, state.customMessage, updateState])

  // Load saved contacts on component mount and when database changes
  useEffect(() => {
    if (database.contacts.length > 0 && state.contacts.length === 0) {
      updateState({ contacts: database.contacts })
    }
  }, [database.contacts, state.contacts.length, updateState])

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination()
  }, [searchCriteria, resetPagination])

  // Template handling
  const applyTemplate = (template: MessageTemplate) => {
    updateState({ selectedTemplate: template })
    setCustomMessage(template.content)
    contactOps.updateWhatsAppLinks(template.content)
  }

  const updateCustomMessage = (value: string) => {
    setCustomMessage(value)
  }

  // Contact management
  const clearAll = async () => {
    try {
      const result = await clearAllContacts()

      if (result.success) {
        resetState()
        setSelectedContacts([])
        if (contactOps.batchSendTimeoutRef.current) {
          clearTimeout(contactOps.batchSendTimeoutRef.current)
        }
        ToastUtils.success("All contacts cleared successfully")
      } else {
        ToastUtils.error(result.message || "Failed to clear contacts")
      }
    } catch (error) {
      console.error("Error clearing contacts:", error)
      ToastUtils.error("Failed to clear contacts")
    }
  }

  const loadSavedContacts = () => {
    if (database.contacts.length > 0) {
      updateState({ contacts: database.contacts })
      ToastUtils.success(`Loaded ${database.contacts.length} saved contacts`)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    const result = await deleteContact(contactId)
    if (result.success) {
      const updatedCurrentContacts = state.contacts.filter((c) => c.id !== contactId)
      updateState({ contacts: updatedCurrentContacts })
      setSelectedContacts((prev) => prev.filter((c) => c.id !== contactId))
      ToastUtils.success("Contact deleted successfully")
    } else {
      ToastUtils.error("Failed to delete contact")
    }
  }

  // Advanced search handling
  const handleAdvancedSearch = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria)
    resetPagination()
  }

  const handleClearSearch = () => {
    setSearchCriteria({})
    resetPagination()
  }

  // Batch operations
  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return

    for (const contact of selectedContacts) {
      await handleDeleteContact(contact.id)
    }
    clearSelection()
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedContacts.length === 0) return

    try {
      const updatedContacts = state.contacts.map((contact) => {
        if (selectedContacts.some((selected) => selected.id === contact.id)) {
          return {
            ...contact,
            status: bulkStatusUpdate.newStatus,
            notes: bulkStatusUpdate.notes || contact.notes,
            lastUpdated: new Date().toISOString(),
            ...(bulkStatusUpdate.newStatus === "sent" && { sentAt: new Date().toISOString() }),
          }
        }
        return contact
      })

      updateState({ contacts: updatedContacts })

      const saveResult = await saveContacts(updatedContacts)
      if (!saveResult.success) {
        ToastUtils.error("Failed to persist bulk status update")
        return
      }

      for (const contact of selectedContacts) {
        const updatedContact = updatedContacts.find((c) => c.id === contact.id)
        if (updatedContact) {
          await updateContactStatus(contact.id, bulkStatusUpdate.newStatus, bulkStatusUpdate.notes || contact.notes)
        }
      }

      setBulkStatusUpdate({ isOpen: false, newStatus: "pending", notes: "" })
      clearSelection()
      ToastUtils.success(`Updated status for ${selectedContacts.length} contacts`)
    } catch (error) {
      console.error("Error updating bulk status:", error)
      ToastUtils.error("Failed to update contact statuses")
    }
  }

  // Computed values
  const filteredContacts = useMemo(() => {
    return AdvancedSearchService.searchContacts(state.contacts, searchCriteria)
  }, [state.contacts, searchCriteria])

  const paginatedContacts = useMemo(() => {
    return ContactFilterService.paginateContacts(filteredContacts, state.currentPage, state.itemsPerPage)
  }, [filteredContacts, state.currentPage, state.itemsPerPage])

  const categories = AdvancedSearchService.getUniqueCategories(state.contacts)
  const sources = AdvancedSearchService.getUniqueSources(state.contacts)
  const customFields = AdvancedSearchService.getCustomFields(state.contacts)
  const availableCustomVariables = TemplateService.extractCustomVariables(state.contacts)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-8">
        {/* Enhanced Header */}
        <AppHeader totalContacts={database.totalContacts} onLoadSavedContacts={loadSavedContacts} />

        <UploadDataSection
          isExpanded={isUploadSectionExpanded}
          onToggle={() => toggleSection("isUploadSectionExpanded")}
          contactsCount={state.contacts.length}
          fileState={fileHandling.state}
          onFileStateUpdate={fileHandling.updateState}
          onDrag={fileHandling.handleDrag}
          onDrop={fileHandling.handleDrop}
          onFileChange={fileHandling.handleFileChange}
          manualState={manualLink.state}
          onManualStateUpdate={manualLink.updateState}
          onGenerateLink={manualLink.handleGenerateManualLink}
          onCopyLink={manualLink.handleCopyManualLink}
          contacts={state.contacts}
          onSearch={handleAdvancedSearch}
          onClearSearch={handleClearSearch}
          searchCriteria={searchCriteria}
          categories={categories}
          sources={sources}
          customFields={customFields}
          templates={state.templates}
          selectedTemplate={state.selectedTemplate}
          onTemplateSelect={applyTemplate}
          onTemplateCreate={(template) => updateState({ templates: [...state.templates, template] })}
          onTemplateUpdate={(updatedTemplate) => {
            updateState({
              templates: state.templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
            })
          }}
          onTemplateDelete={(templateId) => {
            updateState({
              templates: state.templates.filter((t) => t.id !== templateId),
              selectedTemplate: state.selectedTemplate?.id === templateId ? null : state.selectedTemplate,
            })
          }}
          availableCustomVariables={availableCustomVariables}
          database={database}
          isLoading={storageLoading}
          onSaveContacts={saveContacts}
          onMergeContacts={mergeContacts}
          onUpdateContactStatus={updateContactStatus}
          onDeleteContact={deleteContact}
          onExportContacts={exportContacts}
          onClearAllContacts={clearAllContacts}
          currentContacts={state.contacts}
          onUpdateCurrentContacts={(contacts) => updateState({ contacts })}
          onImportContacts={contactOps.handleImportContacts}
          onShowToast={ToastUtils.success}
        />

        <MessageEditorSection
          isExpanded={isMessageEditorExpanded}
          onToggle={() => toggleSection("isMessageEditorExpanded")}
          customMessage={customMessage}
          onCustomMessageChange={updateCustomMessage}
          availableCustomVariables={availableCustomVariables}
          contactsCount={state.contacts.length}
          onUpdateWhatsAppLinks={() => contactOps.updateWhatsAppLinks()}
        />

        {/* Enhanced Loading State */}
        {fileHandling.state.isLoading && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-emerald-500 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-700 text-xl font-semibold">Processing file...</p>
                  <p className="text-slate-500">Extracting business data and validating phone numbers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Message Sender */}
        {state.contacts.length > 0 && (
          <div className="flex justify-center">
            <BulkMessageSender
              contacts={state.contacts}
              selectedContacts={selectedContacts}
              templates={state.templates}
              selectedTemplate={state.selectedTemplate}
              customMessage={customMessage}
              onContactStatusUpdate={updateContactStatus}
              onShowToast={(message, type) => {
                if (type === "error") {
                  ToastUtils.error(message)
                } else if (type === "warning") {
                  ToastUtils.warning(message)
                } else if (type === "info") {
                  ToastUtils.info(message)
                } else {
                  ToastUtils.success(message)
                }
              }}
            />
          </div>
        )}

        {/* Enhanced Statistics and Bulk Actions */}
        {state.contacts.length > 0 && (
          <StatisticsSection
            filteredContacts={filteredContacts}
            paginatedContacts={paginatedContacts}
            selectedContacts={selectedContacts}
            searchCriteria={searchCriteria}
            batchState={contactOps.batchState}
            templates={state.templates}
            selectedTemplate={state.selectedTemplate}
            customMessage={customMessage}
            onSelectAllVisible={() => selectAllVisible(paginatedContacts.contacts)}
            onClearSelection={clearSelection}
            onBulkExport={() => contactOps.handleBulkExport(selectedContacts)}
            onBulkDelete={handleBulkDelete}
            onClearSearch={handleClearSearch}
            onStartBatchSend={() => contactOps.startBatchSend(paginatedContacts.contacts)}
            onStopBatchSend={contactOps.stopBatchSend}
            onContactStatusUpdate={updateContactStatus}
            onShowToast={ToastUtils.success}
          />
        )}

        <BulkActionsSection
          selectedContacts={selectedContacts}
          bulkStatusUpdate={bulkStatusUpdate}
          onBulkStatusUpdateChange={setBulkStatusUpdate}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onClearSelection={clearSelection}
        />

        <ContactsOverviewSection
          isExpanded={isContactsOverviewExpanded}
          onToggle={() => toggleSection("isContactsOverviewExpanded")}
          filteredContacts={filteredContacts}
          paginatedContacts={paginatedContacts}
          selectedContacts={selectedContacts}
          onToggleContactSelection={toggleContactSelection}
          onContactUpdate={async (updatedContact) => {
            const updatedContacts = state.contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c))
            updateState({ contacts: updatedContacts })

            // Also persist the status change to the database if the contact is saved
            if (database.contacts.some((c) => c.id === updatedContact.id)) {
              await updateContactStatus(updatedContact.id, updatedContact.status, updatedContact.notes)
            }
          }}
          onContactDelete={handleDeleteContact}
          onClearAll={clearAll}
          currentPage={state.currentPage}
          itemsPerPage={state.itemsPerPage}
          onPageChange={(page) => updateState({ currentPage: page })}
          onItemsPerPageChange={(itemsPerPage) => updateState({ itemsPerPage, currentPage: 1 })}
          onShowToast={(message, type) => {
            if (type === "error") {
              ToastUtils.error(message)
            } else {
              ToastUtils.success(message)
            }
          }}
        />

        <InstructionsSection />
      </div>

      <BackToTop />
    </div>
  )
}
