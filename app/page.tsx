"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  MessageCircle,
  Building,
  Users,
  Search,
  FileSpreadsheet,
  Plus,
  Send,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BackToTop } from "./components/back-to-top"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Components
import { RichTextEditor } from "./components/rich-text-editor"
import { MessageTemplates } from "./components/message-templates"
import { ContactManagement } from "./components/contact-management"
import { ContactCard } from "./components/contact-card"
import { GoogleSheetsImport } from "./components/google-sheets-import"
import { Pagination } from "./components/pagination"
import { AdvancedSearch, type SearchCriteria } from "./components/advanced-search"
import { AppHeader } from "./components/app-header"
import { UploadSection } from "./components/upload-section"
import { ManualEntrySection } from "./components/manual-entry-section"
import { StatisticsSection } from "./components/statistics-section"
import { BulkMessageSender } from "./components/bulk-message-sender"

// Hooks
import { useContactStorage } from "./hooks/use-contact-storage"
import { useAppState } from "./hooks/use-app-state"
import { useFileHandling } from "./hooks/use-file-handling"
import { useManualLink } from "./hooks/use-manual-link"
import { useContactOperations } from "./hooks/use-contact-operations"

// Services
import { ContactFilterService } from "./services/contact-filter-service"
import { AdvancedSearchService } from "./services/advanced-search-service"
import { TemplateService } from "./services/template-service"

// Utils
import { ToastUtils } from "./utils/toast-utils"

// Types
import type { Contact, MessageTemplate } from "./types/contact"

export default function WhatsAppLinkGenerator() {
  const { state, updateState, resetState, resetPagination } = useAppState()

  // Advanced search state
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({})
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])

  const [isUploadSectionExpanded, setIsUploadSectionExpanded] = useState(true)
  const [isMessageEditorExpanded, setIsMessageEditorExpanded] = useState(true)
  const [isContactsOverviewExpanded, setIsContactsOverviewExpanded] = useState(true)

  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<{
    isOpen: boolean
    newStatus: Contact["status"]
    notes: string
  }>({
    isOpen: false,
    newStatus: "pending",
    notes: "",
  })

  const CUSTOM_MESSAGE_STORAGE_KEY = "whatsapp-custom-message"

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
  const fileHandling = useFileHandling(state.customMessage, (contacts) => {
    updateState({ contacts })
  })

  // Manual link hook
  const manualLink = useManualLink(state.customMessage)

  // Contact operations hook
  const contactOps = useContactOperations(
    state.contacts,
    state.customMessage,
    (contacts) => updateState({ contacts }),
    updateContactStatus,
  )

  useEffect(() => {
    try {
      const savedMessage = localStorage.getItem(CUSTOM_MESSAGE_STORAGE_KEY)
      if (savedMessage && savedMessage.trim() !== "") {
        updateState({ customMessage: savedMessage })
      }
    } catch (error) {
      console.error("Failed to load saved custom message:", error)
    }
  }, [updateState])

  useEffect(() => {
    try {
      if (state.customMessage.trim() !== "") {
        localStorage.setItem(CUSTOM_MESSAGE_STORAGE_KEY, state.customMessage)
      }
    } catch (error) {
      console.error("Failed to save custom message:", error)
    }
  }, [state.customMessage])

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
    updateState({ selectedTemplate: template, customMessage: template.content })
    contactOps.updateWhatsAppLinks(template.content)
  }

  const updateCustomMessage = (value: string) => {
    updateState({ customMessage: value })
    // localStorage save is handled by the useEffect above
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

  // Selection handling
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

  const selectAllVisible = () => {
    const allSelected = paginatedContacts.contacts.every((contact) =>
      selectedContacts.some((selected) => selected.id === contact.id),
    )

    if (allSelected) {
      // Deselect all visible
      setSelectedContacts((prev) =>
        prev.filter((selected) => !paginatedContacts.contacts.some((contact) => contact.id === selected.id)),
      )
    } else {
      // Select all visible
      const newSelections = paginatedContacts.contacts.filter(
        (contact) => !selectedContacts.some((selected) => selected.id === contact.id),
      )
      setSelectedContacts((prev) => [...prev, ...newSelections])
    }
  }

  const clearSelection = () => {
    setSelectedContacts([])
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

      // Update in database for saved contacts
      for (const contact of selectedContacts) {
        if (database.contacts.some((c) => c.id === contact.id)) {
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

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader
            className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-lg border-b border-slate-100 cursor-pointer hover:bg-gradient-to-r hover:from-emerald-100 hover:to-blue-100 transition-all duration-200"
            onClick={() => setIsUploadSectionExpanded(!isUploadSectionExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Upload className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-800 text-xl">Upload Business Data</CardTitle>
                  <CardDescription className="text-slate-600">
                    {isUploadSectionExpanded
                      ? "Import contacts from Excel, CSV files or Google Sheets"
                      : `${state.contacts.length} contacts loaded • Click to expand upload options`}
                  </CardDescription>
                </div>
              </div>
              {isUploadSectionExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </div>
          </CardHeader>
          {isUploadSectionExpanded && (
            <CardContent className="p-8">
              {/* Enhanced Tabbed Interface */}
              <Tabs defaultValue="upload" className="space-y-8">
                <div className="flex justify-center">
                  <TabsList className="grid grid-cols-6 bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg rounded-xl p-1">
                    <TabsTrigger
                      value="upload"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Upload</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="sheets"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline">Sheets</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="manual"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Manual</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="search"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                    >
                      <Search className="h-4 w-4" />
                      <span className="hidden sm:inline">Search</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="templates"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Templates</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="manage"
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Manage</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Upload File Tab */}
                <TabsContent value="upload">
                  <UploadSection
                    state={fileHandling.state}
                    onStateUpdate={fileHandling.updateState}
                    onDrag={fileHandling.handleDrag}
                    onDrop={fileHandling.handleDrop}
                    onFileChange={fileHandling.handleFileChange}
                  />
                </TabsContent>

                {/* Google Sheets Tab */}
                <TabsContent value="sheets">
                  <GoogleSheetsImport
                    onImportContacts={contactOps.handleImportContacts}
                    onShowToast={ToastUtils.success}
                  />
                </TabsContent>

                {/* Manual Entry Tab */}
                <TabsContent value="manual">
                  <ManualEntrySection
                    state={manualLink.state}
                    onStateUpdate={manualLink.updateState}
                    onGenerateLink={manualLink.handleGenerateManualLink}
                    onCopyLink={manualLink.handleCopyManualLink}
                  />
                </TabsContent>

                {/* Advanced Search Tab */}
                <TabsContent value="search">
                  <AdvancedSearch
                    contacts={state.contacts}
                    onSearch={handleAdvancedSearch}
                    onClearSearch={handleClearSearch}
                    currentCriteria={searchCriteria}
                    categories={categories}
                    sources={sources}
                    customFields={customFields}
                  />
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates">
                  <MessageTemplates
                    templates={state.templates}
                    onTemplateSelect={applyTemplate}
                    selectedTemplate={state.selectedTemplate}
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
                  />
                </TabsContent>

                {/* Manage Tab */}
                <TabsContent value="manage">
                  <ContactManagement
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
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-slate-100 cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
            onClick={() => setIsMessageEditorExpanded(!isMessageEditorExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-800 text-xl">Custom Message Editor</CardTitle>
                  <CardDescription className="text-slate-600">
                    {isMessageEditorExpanded
                      ? `Create personalized messages with variables: {companyName}, {companyCategory}, {website}`
                      : `Message: "${state.customMessage.slice(0, 50)}${state.customMessage.length > 50 ? "..." : ""}" • Click to expand editor`}
                  </CardDescription>
                </div>
              </div>
              {isMessageEditorExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </div>
          </CardHeader>
          {isMessageEditorExpanded && (
            <CardContent className="p-8 space-y-6">
              <div className="text-slate-600 text-sm mb-4">
                {availableCustomVariables.length > 0 && (
                  <span>
                    Available variables: {"{companyName}"}, {"{companyCategory}"}, {"{website}"}, and your custom
                    variables: {availableCustomVariables.map((v) => `{${v}}`).join(", ")}
                  </span>
                )}
              </div>
              <RichTextEditor
                value={state.customMessage}
                onChange={updateCustomMessage}
                placeholder="Type your message here... Use {companyName}, {companyCategory}, {website} for personalization"
              />
              {state.contacts.length > 0 && (
                <button
                  onClick={() => contactOps.updateWhatsAppLinks()}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Update WhatsApp Links
                </button>
              )}
            </CardContent>
          )}
        </Card>

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
              customMessage={state.customMessage}
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
            customMessage={state.customMessage}
            onSelectAllVisible={selectAllVisible}
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

        {selectedContacts.length > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Bulk Actions</h3>
                    <p className="text-sm text-slate-600">{selectedContacts.length} contacts selected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog
                    open={bulkStatusUpdate.isOpen}
                    onOpenChange={(open) => setBulkStatusUpdate((prev) => ({ ...prev, isOpen: open }))}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Update Status for {selectedContacts.length} Contacts</DialogTitle>
                        <DialogDescription>
                          Change the status and optionally add notes for all selected contacts.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="status">New Status</Label>
                          <select
                            id="status"
                            value={bulkStatusUpdate.newStatus}
                            onChange={(e) =>
                              setBulkStatusUpdate((prev) => ({
                                ...prev,
                                newStatus: e.target.value as Contact["status"],
                              }))
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="sent">Sent</option>
                            <option value="not_sent">Not Sent</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bulkNotes">Notes (Optional)</Label>
                          <Textarea
                            id="bulkNotes"
                            value={bulkStatusUpdate.notes}
                            onChange={(e) => setBulkStatusUpdate((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add notes for all selected contacts..."
                            rows={3}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleBulkStatusUpdate} className="flex-1">
                            Update {selectedContacts.length} Contacts
                          </Button>
                          <Button
                            onClick={() => setBulkStatusUpdate({ isOpen: false, newStatus: "pending", notes: "" })}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={clearSelection} variant="outline">
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredContacts.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader
              className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-lg border-b border-slate-100 cursor-pointer hover:bg-gradient-to-r hover:from-emerald-100 hover:to-blue-100 transition-all duration-200"
              onClick={() => setIsContactsOverviewExpanded(!isContactsOverviewExpanded)}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Building className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
                      Business Contacts Overview
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {filteredContacts.length} contacts
                      </span>
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      {isContactsOverviewExpanded
                        ? "Professional contact cards with horizontal layout for better readability"
                        : `${selectedContacts.length} selected • Page ${paginatedContacts.currentPage} of ${paginatedContacts.totalPages} • Click to expand contacts`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="inline-flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 bg-white shadow-sm rounded-lg transition-colors">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Clear All
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          Confirm Clear All Contacts
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will permanently delete all {state.contacts.length} contacts from your storage and
                          cannot be undone. Are you sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAll} className="bg-red-600 hover:bg-red-700">
                          Yes, Clear All Contacts
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {isContactsOverviewExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {isContactsOverviewExpanded && (
              <CardContent className="p-8">
                {/* Pagination Controls - Top */}
                <div className="mb-8">
                  <Pagination
                    currentPage={paginatedContacts.currentPage}
                    totalPages={paginatedContacts.totalPages}
                    totalItems={filteredContacts.length}
                    itemsPerPage={state.itemsPerPage}
                    onPageChange={(page) => updateState({ currentPage: page })}
                    onItemsPerPageChange={(itemsPerPage) => updateState({ itemsPerPage, currentPage: 1 })}
                  />
                </div>

                {/* Contact Cards */}
                <div className="space-y-4">
                  {paginatedContacts.contacts.map((contact, index) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      index={(paginatedContacts.currentPage - 1) * state.itemsPerPage + index}
                      isSelected={selectedContacts.some((c) => c.id === contact.id)}
                      onToggleSelect={() => toggleContactSelection(contact)}
                      onUpdate={async (updatedContact) => {
                        const updatedContacts = state.contacts.map((c) =>
                          c.id === updatedContact.id ? updatedContact : c,
                        )
                        updateState({ contacts: updatedContacts })

                        // Also persist the status change to the database if the contact is saved
                        if (database.contacts.some((c) => c.id === updatedContact.id)) {
                          await updateContactStatus(updatedContact.id, updatedContact.status, updatedContact.notes)
                        }
                      }}
                      onDelete={() => handleDeleteContact(contact.id)}
                      onShowToast={(message, type) => {
                        if (type === "error") {
                          ToastUtils.error(message)
                        } else {
                          ToastUtils.success(message)
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Pagination Controls - Bottom */}
                {paginatedContacts.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={paginatedContacts.currentPage}
                      totalPages={paginatedContacts.totalPages}
                      totalItems={filteredContacts.length}
                      itemsPerPage={state.itemsPerPage}
                      onPageChange={(page) => updateState({ currentPage: page })}
                      onItemsPerPageChange={(itemsPerPage) => updateState({ itemsPerPage, currentPage: 1 })}
                    />
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Enhanced Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
          <CardHeader className="border-b border-blue-100">
            <CardTitle className="text-slate-800 flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              How to use Business Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">Excel/CSV Columns:</p>
                    <p className="text-sm text-slate-600">
                      Phone, Company Name, Category, Website, and any custom columns you add!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Search className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">Advanced Search:</p>
                    <p className="text-sm text-slate-600">Use multiple criteria and save your search queries</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">Template Variables:</p>
                    <p className="text-sm text-slate-600">
                      {"{companyName}"}, {"{companyCategory}"}, {"{website}"}, and your custom column headers like
                      {"{contactPerson}"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">Bulk Operations:</p>
                    <p className="text-sm text-slate-600">Select multiple contacts for bulk export or deletion</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BackToTop />
    </div>
  )
}
