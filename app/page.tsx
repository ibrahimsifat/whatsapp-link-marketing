"use client"

import { useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { MessageTemplate } from "./types/contact"

// Components
import { BackToTop } from "./components/back-to-top"
import { AppHeader } from "./components/app-header"
import { StatisticsSection } from "./components/statistics-section"
import { BulkMessageSender } from "./components/bulk-message-sender"
import { ManualEntrySection } from "./components/manual-entry-section"

// Section Components
import { UploadDataSection } from "@/components/sections/upload-data-section"
import { MessageEditorSection } from "@/components/sections/message-editor-section"
import { BulkActionsSection } from "@/components/sections/bulk-actions-section"
import { ContactsOverviewSection } from "@/components/sections/contacts-overview-section"
import { InstructionsSection } from "@/components/sections/instructions-section"

// Hooks
import { useContactStorage } from "./hooks/use-contact-storage"
import { useTemplates } from "./hooks/use-templates"
import { useAppState } from "./hooks/use-app-state"
import { useFileHandling } from "./hooks/use-file-handling"
import { useManualLink } from "./hooks/use-manual-link"
import { useContactOperations } from "./hooks/use-contact-operations"
import { useSectionToggles } from "@/hooks/use-section-toggles"
import { useMessagePersistence } from "@/hooks/use-message-persistence"
import { useBulkOperations } from "@/hooks/use-bulk-operations"
import { useAuth } from "@/hooks/use-auth"

// Services
import { ContactFilterService } from "./services/contact-filter-service"
import { TemplateService } from "./services/template-service"

// Utils
import { ToastUtils } from "./utils/toast-utils"
import type { TemplateGroup } from "./types/template-group"
import { isLanguageRoutingActive } from "./types/template-group"

export default function WhatsAppLinkGenerator() {
  const { state, updateState, resetState } = useAppState()

  // Wires the global 401 handler, so an expired session anywhere in the app
  // sends the operator to /login rather than failing silently.
  const { user, signOut, isSigningOut } = useAuth()

  const { isUploadSectionExpanded, isMessageEditorExpanded, isContactsOverviewExpanded, toggleSection } =
    useSectionToggles()

  const { customMessage, setCustomMessage, isSaving: isSavingMessage } = useMessagePersistence(state.customMessage)

  const {
    selectedContacts,
    bulkStatusUpdate,
    setBulkStatusUpdate,
    toggleContactSelection,
    selectAllVisible,
    clearSelection,
    setSelectedContacts,
  } = useBulkOperations()

  // --- Persistence (Cloudflare D1) -------------------------------------------
  const {
    database,
    contacts,
    isLoading: storageLoading,
    isInitialising,
    error: storageError,
    saveContacts,
    mergeContacts,
    updateContactStatus,
    deleteContact,
    bulkDeleteContacts,
    bulkUpdateStatus,
    exportContacts,
    exportAllToExcel,
    clearAllContacts,
    loadContacts,
  } = useContactStorage()

  const {
    templates,
    createTemplate,
    updateTemplate: persistTemplate,
    deleteTemplate: removeTemplate,
    deleteTemplateGroup: removeTemplateGroup,
  } = useTemplates()

  // File handling hook — imports land in the database, then the list reloads.
  const fileHandling = useFileHandling(customMessage, async (imported) => {
    const result = await mergeContacts(imported, "file-upload")
    if (result.success) {
      ToastUtils.success(result.message)
    } else {
      ToastUtils.error(result.message)
    }
  })

  const manualLink = useManualLink(customMessage)

  // Routing is live only while the message still matches the template, so an
  // edited message is honoured verbatim - see isLanguageRoutingActive.
  const languageRoutingGroup = isLanguageRoutingActive(
    state.selectedTemplateGroup,
    state.selectedTemplate,
    customMessage,
  )
    ? state.selectedTemplateGroup
    : null

  const contactOps = useContactOperations(
    contacts,
    customMessage,
    () => {
      // Link regeneration is derived from the message, so there is nothing to
      // persist here; the list re-renders from the hook's state.
    },
    languageRoutingGroup,
  )

  useEffect(() => {
    if (customMessage !== state.customMessage) {
      updateState({ customMessage })
    }
  }, [customMessage, state.customMessage, updateState])

  useEffect(() => {
    if (storageError) ToastUtils.error(storageError)
  }, [storageError])

  // --- Templates --------------------------------------------------------------
  /**
   * Select a multilingual template.
   *
   * The editor shows the default-language version, but the whole group is kept
   * in state: at send time each contact is routed to the version matching its
   * own language. Editing the message afterwards overrides that and sends the
   * edited text to everyone - see the language panel in the bulk sender.
   */
  const applyTemplate = (group: TemplateGroup) => {
    updateState({ selectedTemplate: group.fallback, selectedTemplateGroup: group })
    setCustomMessage(group.fallback.content)
  }

  const updateCustomMessage = (value: string) => {
    setCustomMessage(value)
  }

  // --- Contact management -----------------------------------------------------
  const clearAll = async () => {
    const result = await clearAllContacts()

    if (result.success) {
      resetState()
      setSelectedContacts([])
      ToastUtils.success(result.message)
    } else {
      ToastUtils.error(result.message)
    }
  }

  const reloadContacts = async () => {
    const result = await loadContacts()
    if (result.success) {
      ToastUtils.success(result.message)
    } else {
      ToastUtils.error(result.message)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    const result = await deleteContact(contactId)

    if (result.success) {
      setSelectedContacts((prev) => prev.filter((c) => c.id !== contactId))
      ToastUtils.success(result.message)
    } else {
      ToastUtils.error(result.message)
    }
  }

  /** One request for the whole selection, rather than one per contact. */
  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return

    const result = await bulkDeleteContacts(selectedContacts.map((c) => c.id))
    clearSelection()

    if (result.success) {
      ToastUtils.success(result.message)
    } else {
      ToastUtils.error(result.message)
    }
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedContacts.length === 0) return

    const result = await bulkUpdateStatus(
      selectedContacts.map((c) => c.id),
      bulkStatusUpdate.newStatus,
      bulkStatusUpdate.notes || undefined,
    )

    if (result.success) {
      setBulkStatusUpdate({ isOpen: false, newStatus: "pending", notes: "" })
      clearSelection()
      ToastUtils.success(result.message)
    } else {
      ToastUtils.error(result.message)
    }
  }

  // --- Derived ----------------------------------------------------------------
  const filteredContacts = contacts

  const paginatedContacts = useMemo(
    () => ContactFilterService.paginateContacts(filteredContacts, state.currentPage, state.itemsPerPage),
    [filteredContacts, state.currentPage, state.itemsPerPage],
  )

  const availableCustomVariables = TemplateService.extractCustomVariables(contacts)

  // --- First load -------------------------------------------------------------
  if (isInitialising) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Loading your contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-5 lg:py-6 space-y-3 sm:space-y-4">
        <AppHeader
          totalContacts={database.totalContacts}
          onLoadSavedContacts={reloadContacts}
          userEmail={user?.email}
          onSignOut={signOut}
          isSigningOut={isSigningOut}
          isSyncing={storageLoading || isSavingMessage}
        />

        <ManualEntrySection
          state={manualLink.state}
          onStateUpdate={manualLink.updateState}
          onGenerateLink={manualLink.handleGenerateManualLink}
          onCopyLink={manualLink.handleCopyManualLink}
        />

        <UploadDataSection
          isExpanded={isUploadSectionExpanded}
          onToggle={() => toggleSection("isUploadSectionExpanded")}
          contactsCount={contacts.length}
          fileState={fileHandling.state}
          onDrag={fileHandling.handleDrag}
          onDrop={fileHandling.handleDrop}
          onFileChange={fileHandling.handleFileChange}
          templates={templates}
          selectedGroupId={state.selectedTemplateGroup?.groupId ?? null}
          onTemplateSelect={applyTemplate}
          onTemplateCreate={async (template) => {
            const result = await createTemplate(template)
            result.success ? ToastUtils.success(result.message) : ToastUtils.error(result.message)
          }}
          onTemplateUpdate={async (updatedTemplate) => {
            const result = await persistTemplate(updatedTemplate)
            result.success ? ToastUtils.success(result.message) : ToastUtils.error(result.message)
          }}
          onTemplateDelete={async (templateId) => {
            const result = await removeTemplate(templateId)
            if (result.success && state.selectedTemplate?.id === templateId) {
              updateState({ selectedTemplate: null, selectedTemplateGroup: null })
            }
            result.success ? ToastUtils.success(result.message) : ToastUtils.error(result.message)
          }}
          onTemplateDeleteGroup={async (templateId) => {
            const result = await removeTemplateGroup(templateId)
            if (result.success && state.selectedTemplateGroup?.variants.some((v) => v.id === templateId)) {
              updateState({ selectedTemplate: null, selectedTemplateGroup: null })
            }
            result.success ? ToastUtils.success(result.message) : ToastUtils.error(result.message)
          }}
          availableCustomVariables={availableCustomVariables}
          database={database}
          isLoading={storageLoading}
          onSaveContacts={saveContacts}
          onMergeContacts={mergeContacts}
          onUpdateContactStatus={updateContactStatus}
          onDeleteContact={deleteContact}
          onExportContacts={exportContacts}
          onExportAllToExcel={exportAllToExcel}
          onClearAllContacts={clearAllContacts}
          currentContacts={contacts}
          onUpdateCurrentContacts={() => undefined}
          onImportContacts={async (imported) => {
            const result = await mergeContacts(imported, "google-sheets")
            result.success ? ToastUtils.success(result.message) : ToastUtils.error(result.message)
          }}
          onShowToast={ToastUtils.success}
        />

        <MessageEditorSection
          isExpanded={isMessageEditorExpanded}
          onToggle={() => toggleSection("isMessageEditorExpanded")}
          customMessage={customMessage}
          onCustomMessageChange={updateCustomMessage}
          availableCustomVariables={availableCustomVariables}
          contactsCount={contacts.length}
          onUpdateWhatsAppLinks={() => contactOps.updateWhatsAppLinks()}
        />

        {fileHandling.state.isLoading && (
          <Card className="border border-slate-200 bg-white">
            <CardContent className="flex items-center justify-center py-8 sm:py-10 px-4">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-slate-200 border-t-emerald-500 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-700 text-base sm:text-lg font-semibold">Processing file...</p>
                  <p className="text-sm sm:text-base text-slate-500">
                    Extracting business data and validating phone numbers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {contacts.length > 0 && (
          <div className="flex justify-center w-full">
            <BulkMessageSender
              contacts={contacts}
              selectedContacts={selectedContacts}
              templates={templates}
              selectedTemplate={state.selectedTemplate}
              selectedGroup={state.selectedTemplateGroup}
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

        {contacts.length > 0 && (
          <StatisticsSection
            filteredContacts={filteredContacts}
            paginatedContacts={paginatedContacts}
            selectedContacts={selectedContacts}
            templates={templates}
            selectedTemplate={state.selectedTemplate}
            selectedGroup={state.selectedTemplateGroup}
            customMessage={customMessage}
            onSelectAllVisible={() => selectAllVisible(paginatedContacts.contacts)}
            onClearSelection={clearSelection}
            onBulkExport={() => contactOps.handleBulkExport(selectedContacts)}
            onBulkDelete={handleBulkDelete}
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
            const result = await updateContactStatus(
              updatedContact.id,
              updatedContact.status,
              updatedContact.notes,
            )
            if (!result.success) ToastUtils.error(result.message)
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
