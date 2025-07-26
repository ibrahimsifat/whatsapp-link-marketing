"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Upload,
  MessageCircle,
  Trash2,
  Send,
  Building,
  Users,
  Search,
  AlertTriangle,
  Phone,
  ExternalLink,
  Copy,
  CheckCircle,
  Play,
  StopCircle,
  Lock,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Plus,
  Download,
  BarChart3,
  X,
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

// Components
import { RichTextEditor } from "./components/rich-text-editor"
import { MessageTemplates } from "./components/message-templates"
import { ContactManagement } from "./components/contact-management"
import { ContactCard } from "./components/contact-card"
import { GoogleSheetsImport } from "./components/google-sheets-import"
import { Pagination } from "./components/pagination"
import { AdvancedSearch, type SearchCriteria } from "./components/advanced-search"

// Hooks
import { useContactStorage } from "./hooks/use-contact-storage"
import { useAppState } from "./hooks/use-app-state"

// Services
import { FileService } from "./services/file-service"
import { PhoneService } from "./services/phone-service"
import { WhatsAppService } from "./services/whatsapp-service"
import { TemplateService } from "./services/template-service"
import { ContactFilterService } from "./services/contact-filter-service"
import { BatchSendService } from "./services/batch-send-service"
import { AdvancedSearchService } from "./services/advanced-search-service"

// Utils
import { ClipboardUtils } from "./utils/clipboard-utils"
import { ToastUtils } from "./utils/toast-utils"

// Constants
import { APP_CONSTANTS } from "./constants/app-constants"

// Types
import type { Contact, MessageTemplate } from "./types/contact"

export default function WhatsAppLinkGenerator() {
  const { state, updateState, resetState, resetPagination } = useAppState()
  const batchSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Advanced search state
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({})
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])

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

  // File handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      updateState({ dragActive: true })
    } else if (e.type === "dragleave") {
      updateState({ dragActive: false })
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateState({ dragActive: false })

    if (state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD) {
      updateState({ passwordError: "Incorrect password. Please enter the correct password to upload." })
      return
    }
    updateState({ passwordError: "" })

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isValidFileType(file)) {
        await processFile(file)
      } else {
        updateState({ fileError: "Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)" })
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD) {
      updateState({ passwordError: "Incorrect password. Please enter the correct password to upload." })
      e.target.value = ""
      return
    }
    updateState({ passwordError: "" })

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isValidFileType(file)) {
        await processFile(file)
      } else {
        updateState({ fileError: "Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)" })
      }
    }
  }

  const isValidFileType = (file: File): boolean => {
    return (
      file.type.includes("sheet") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".csv") ||
      file.type === "text/csv"
    )
  }

  const processFile = async (file: File) => {
    const validation = FileService.validateFileSize(file)
    if (!validation.isValid) {
      updateState({ fileError: validation.error || "File size validation failed" })
      return
    }

    updateState({ isLoading: true, fileError: "" })

    try {
      const result = await FileService.processFile(file, state.customMessage)

      if (result.errors.length > 0) {
        updateState({ fileError: result.errors.join(", ") })
        ToastUtils.error("File processing completed with errors")
      } else {
        ToastUtils.success(`Successfully processed ${result.contacts.length} contacts from ${file.name}`)
      }

      updateState({ contacts: result.contacts })
    } catch (error) {
      console.error("Error processing file:", error)
      updateState({ fileError: "Unexpected error occurred while processing the file" })
      ToastUtils.error("Failed to process file")
    } finally {
      updateState({ isLoading: false })
    }
  }

  // Template handling
  const applyTemplate = (template: MessageTemplate) => {
    updateState({ selectedTemplate: template, customMessage: template.content })
    updateWhatsAppLinks(template.content)
  }

  const updateWhatsAppLinks = (message?: string) => {
    const messageToUse = message || state.customMessage
    const updatedContacts = state.contacts.map((contact) => ({
      ...contact,
      whatsappLink: WhatsAppService.generateWhatsAppLink(
        contact.normalized,
        TemplateService.replaceVariables(messageToUse, contact),
      ),
    }))
    updateState({ contacts: updatedContacts })
  }

  // Contact management
  const clearAll = async () => {
    try {
      const result = await clearAllContacts()

      if (result.success) {
        resetState()
        setSelectedContacts([])
        if (batchSendTimeoutRef.current) {
          clearTimeout(batchSendTimeoutRef.current)
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

  // Manual link generation
  const handleGenerateManualLink = () => {
    updateState({ manualLinkCopied: false, manualPhoneError: "" })

    if (!state.manualPhoneNumber) {
      updateState({ manualPhoneError: "Please enter a phone number.", manualLink: "" })
      return
    }

    const normalizedPhone = PhoneService.normalizePhoneNumber(state.manualPhoneNumber)
    if (!normalizedPhone) {
      updateState({ manualPhoneError: "Invalid Saudi phone number format.", manualLink: "" })
      return
    }

    const link = WhatsAppService.generateWhatsAppLink(normalizedPhone, state.customMessage)
    updateState({ manualLink: link })
    ToastUtils.success("WhatsApp link generated!")
  }

  const handleCopyManualLink = async () => {
    if (state.manualLink) {
      const success = await ClipboardUtils.copyToClipboard(state.manualLink)
      if (success) {
        updateState({ manualLinkCopied: true })
        setTimeout(() => updateState({ manualLinkCopied: false }), 2000)
        ToastUtils.success("Link copied to clipboard!")
      } else {
        ToastUtils.error("Failed to copy link")
      }
    }
  }

  // Contact import
  const handleImportContacts = (newContacts: Contact[]) => {
    const existingNumbers = new Set(state.contacts.map((c) => c.normalized))
    const uniqueNewContacts = newContacts.filter((contact) => !existingNumbers.has(contact.normalized))

    if (uniqueNewContacts.length > 0) {
      const updatedContacts = [...state.contacts, ...uniqueNewContacts]
      const finalContacts = updatedContacts.map((contact) => ({
        ...contact,
        whatsappLink: WhatsAppService.generateWhatsAppLink(
          contact.normalized,
          TemplateService.replaceVariables(state.customMessage, contact),
        ),
      }))
      updateState({ contacts: finalContacts })
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

  const handleBulkExport = () => {
    if (selectedContacts.length === 0) {
      ToastUtils.warning("No contacts selected")
      return
    }

    const csvContent = FileService.exportContacts(selectedContacts, "csv")
    const filename = `selected-contacts-${new Date().toISOString().split("T")[0]}.csv`
    FileService.downloadFile(csvContent, filename, "text/csv")
    ToastUtils.success(`Exported ${selectedContacts.length} selected contacts`)
  }

  // Batch sending
  const startBatchSend = () => {
    if (paginatedContacts.contacts.length === 0) {
      ToastUtils.error("No contacts to send in the current page.")
      return
    }

    updateState({ isBatchSending: true, currentBatchIndex: 0 })

    BatchSendService.startBatchSend({
      contacts: paginatedContacts.contacts,
      delayMs: APP_CONSTANTS.BATCH_SEND_DELAY_MS,
      onProgress: (index) => updateState({ currentBatchIndex: index }),
      onComplete: () => {
        updateState({ isBatchSending: false, currentBatchIndex: 0 })
        ToastUtils.success("Batch sending completed!")
      },
      onContactSent: (contactId) => updateContactStatus(contactId, "sent"),
    })
  }

  const stopBatchSend = () => {
    BatchSendService.stopBatchSend()
    updateState({ isBatchSending: false })
    ToastUtils.info("Batch sending stopped.")
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
  const websiteStats = ContactFilterService.getWebsiteStats(state.contacts)
  const availableCustomVariables = TemplateService.extractCustomVariables(state.contacts)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-4 px-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-green-600 rounded-full">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent text-center">
              {APP_CONSTANTS.APP_NAME}
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
            Upload Excel with Company Name, Category & Website columns. Generate personalized WhatsApp messages with
            smart templates and track your outreach.
          </p>
          <div className="flex flex-col sm:flex-row justify-center mt-4 gap-2 sm:gap-4 px-4">
            <Button
              onClick={() => window.open("/documentation", "_blank")}
              variant="outline"
              size="lg"
              className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700 w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              View Documentation
            </Button>
            {database.totalContacts > 0 && (
              <Button
                onClick={loadSavedContacts}
                variant="outline"
                size="lg"
                className="bg-white hover:bg-green-50 border-green-200 text-green-700 w-full sm:w-auto"
              >
                <Building className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Load Saved Contacts ({database.totalContacts})</span>
                <span className="sm:hidden">Load Contacts ({database.totalContacts})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="sheets" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Google Sheets</span>
              <span className="sm:hidden">Sheets</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced Search</span>
              <span className="sm:hidden">Search</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span>
              <span className="sm:hidden">Manage</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload File Tab */}
          <TabsContent value="upload">
            <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-green-800 text-lg sm:text-xl">
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm sm:text-base">Upload Excel/CSV File with Business Data</span>
                </CardTitle>
                <CardDescription className="text-green-600 text-xs sm:text-sm">
                  Excel/CSV columns: Phone Number, Company Name, Company Category, Website (optional) • Max file size:
                  10MB
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {/* Professional Password Input */}
                <Card className="mb-4 sm:mb-6 border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-amber-800 text-base sm:text-lg">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                      Security Authentication
                    </CardTitle>
                    <CardDescription className="text-amber-700 text-xs sm:text-sm">
                      Enter the upload password to access file upload functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 p-4 sm:p-6">
                    <div className="space-y-3">
                      <Label htmlFor="upload-password" className="text-sm font-medium text-amber-800">
                        Upload Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="upload-password"
                          type={state.showPassword ? "text" : "password"}
                          value={state.uploadPassword}
                          onChange={(e) => {
                            updateState({ uploadPassword: e.target.value, passwordError: "" })
                          }}
                          placeholder="Enter your upload password"
                          className={`pr-10 text-sm sm:text-base ${state.passwordError ? "border-red-500 focus:border-red-500" : "border-amber-300 focus:border-amber-500"}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => updateState({ showPassword: !state.showPassword })}
                        >
                          {state.showPassword ? (
                            <EyeOff className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-amber-600" />
                          )}
                        </Button>
                      </div>
                      {state.passwordError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-red-700">{state.passwordError}</p>
                        </div>
                      )}
                      {state.uploadPassword === APP_CONSTANTS.UPLOAD_PASSWORD && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-green-700">
                            Password verified. You can now upload files.
                          </p>
                        </div>
                      )}
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs text-blue-700">
                          <strong>Default Password:</strong> {APP_CONSTANTS.UPLOAD_PASSWORD}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          This security measure protects against unauthorized file uploads.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* File Size Error */}
                {state.fileError && (
                  <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-800 text-sm sm:text-base">Upload Error</h4>
                        <p className="text-xs sm:text-sm text-red-700 mt-1">{state.fileError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-all duration-300 ${
                    state.dragActive
                      ? "border-green-400 bg-green-50 scale-105"
                      : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
                  } ${state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD ? "opacity-50 cursor-not-allowed" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-green-100 rounded-full w-fit mx-auto">
                      <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base sm:text-xl font-semibold text-gray-700">
                        <span className="hidden sm:inline">Drag and drop your Excel/CSV file here</span>
                        <span className="sm:hidden">Upload your Excel/CSV file</span>
                      </p>
                      <p className="text-gray-500 text-sm">or</p>
                      <Button
                        size="lg"
                        variant="outline"
                        className="cursor-pointer bg-white hover:bg-green-50 border-green-200 w-full sm:w-auto"
                        disabled={state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD}
                        onClick={() => {
                          const fileInput = document.getElementById("file-upload") as HTMLInputElement
                          if (fileInput) {
                            fileInput.click()
                          }
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD}
                      />
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                      <p>Expected columns: Phone, Company Name, Category, Website, and any custom columns</p>
                      <p>Supports: .xlsx, .xls, .csv files • Maximum size: 10MB</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Sheets Tab */}
          <TabsContent value="sheets">
            <GoogleSheetsImport onImportContacts={handleImportContacts} onShowToast={ToastUtils.success} />
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-cyan-800 text-lg sm:text-xl">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                  Manual Number Entry
                </CardTitle>
                <CardDescription className="text-cyan-600 text-xs sm:text-sm">
                  Generate a WhatsApp link for a single phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="manual-phone"
                    type="tel"
                    value={state.manualPhoneNumber}
                    onChange={(e) => {
                      updateState({
                        manualPhoneNumber: e.target.value,
                        manualPhoneError: "",
                        manualLink: "",
                      })
                    }}
                    placeholder="e.g., 0551234567 or +966551234567"
                    className={`text-sm sm:text-base ${state.manualPhoneError ? "border-red-500" : ""}`}
                  />
                  {state.manualPhoneError && (
                    <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {state.manualPhoneError}
                    </p>
                  )}
                </div>
                <Button onClick={handleGenerateManualLink} className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Generate Link
                </Button>

                {state.manualLink && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm font-medium">Generated WhatsApp Link</Label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Input value={state.manualLink} readOnly className="flex-1 text-xs sm:text-sm" />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyManualLink}
                          className="border-green-200 text-green-700 hover:bg-green-50 bg-transparent flex-1 sm:flex-none"
                        >
                          {state.manualLinkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2 sm:hidden">Copy</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(state.manualLink, "_blank")}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="ml-2 sm:hidden">Open</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      This link uses the current message from the templates section.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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

        {/* Rich Text Editor Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-blue-800 text-lg sm:text-xl">
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              Custom Message Editor
            </CardTitle>
            <CardDescription className="text-blue-600 text-xs sm:text-sm">
              Create personalized messages with variables: {"{companyName}"}, {"{companyCategory}"}, {"{website}"}
              {availableCustomVariables.length > 0 && (
                <span>, and your custom variables: {availableCustomVariables.map((v) => `{${v}}`).join(", ")}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <RichTextEditor
              value={state.customMessage}
              onChange={(value) => updateState({ customMessage: value })}
              placeholder="Type your message here... Use {companyName}, {companyCategory}, {website} for personalization"
            />
            {state.contacts.length > 0 && (
              <Button onClick={() => updateWhatsAppLinks()} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Send className="h-4 w-4 mr-2" />
                Update WhatsApp Links
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {state.isLoading && (
          <Card className="shadow-lg">
            <CardContent className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-green-200 border-t-green-600 mx-auto"></div>
                <p className="text-gray-600 text-base sm:text-lg">Processing file...</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Extracting business data and validating phone numbers
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics and Bulk Actions */}
        {state.contacts.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-purple-800 text-lg sm:text-xl">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                Business Contacts Overview
                {Object.keys(searchCriteria).length > 0 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Filtered
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{filteredContacts.length}</div>
                  <div className="text-xs sm:text-sm text-blue-500">
                    {Object.keys(searchCriteria).length > 0 ? "Filtered" : "Total"} Contacts
                  </div>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {filteredContacts.filter((c) => c.hasWebsite).length}
                  </div>
                  <div className="text-xs sm:text-sm text-green-500">With Website</div>
                </div>
                <div className="bg-orange-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">
                    {filteredContacts.filter((c) => !c.hasWebsite).length}
                  </div>
                  <div className="text-xs sm:text-sm text-orange-500">No Website</div>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">{selectedContacts.length}</div>
                  <div className="text-xs sm:text-sm text-purple-500">Selected</div>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        paginatedContacts.contacts.length > 0 &&
                        paginatedContacts.contacts.every((contact) =>
                          selectedContacts.some((selected) => selected.id === contact.id),
                        )
                      }
                      onCheckedChange={selectAllVisible}
                    />
                    <span className="text-sm text-gray-600">Select All ({paginatedContacts.contacts.length})</span>
                  </div>
                  {selectedContacts.length > 0 && <Badge variant="secondary">{selectedContacts.length} selected</Badge>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedContacts.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkExport}
                        className="border-green-200 text-green-700 hover:bg-green-50 bg-transparent"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
                      >
                        Clear Selection
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Selected Contacts</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {selectedContacts.length} selected contacts? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                              Delete {selectedContacts.length} Contacts
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-gray-600 gap-2 mb-4">
                <span>
                  {"Showing "}
                  {paginatedContacts.contacts.length}
                  {" of "}
                  {filteredContacts.length}
                  {" contacts"}
                  {Object.keys(searchCriteria).length > 0 && " (filtered)"}
                </span>
                {Object.keys(searchCriteria).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Batch Send Button */}
              {paginatedContacts.contacts.length > 0 && (
                <div className="text-center">
                  {state.isBatchSending ? (
                    <Button onClick={stopBatchSend} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto" size="lg">
                      <StopCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="hidden sm:inline">
                        Stop Sending ({state.currentBatchIndex}/{paginatedContacts.contacts.length})
                      </span>
                      <span className="sm:hidden">
                        Stop ({state.currentBatchIndex}/{paginatedContacts.contacts.length})
                      </span>
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={paginatedContacts.contacts.length === 0}
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          size="lg"
                        >
                          <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          <span className="hidden sm:inline">
                            Send Current Page ({paginatedContacts.contacts.length})
                          </span>
                          <span className="sm:hidden">Send Page ({paginatedContacts.contacts.length})</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">Confirm Batch Send</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs sm:text-sm">
                            This will open {paginatedContacts.contacts.length} WhatsApp chats from the current page in
                            new tabs, one by one, with a small delay. **Please ensure your browser allows pop-ups for
                            this site, otherwise, the chats will not open.**
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={startBatchSend}
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          >
                            Start Sending
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section - Contact Cards with Pagination */}
        {filteredContacts.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-green-800 text-lg sm:text-xl">
                    <Building className="h-5 w-5 sm:h-6 sm:w-6" />
                    Business WhatsApp Links
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {filteredContacts.length} contacts
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-green-600 text-xs sm:text-sm">
                    Professional contact cards with horizontal layout for better readability
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base sm:text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Confirm Clear All Contacts
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-xs sm:text-sm">
                        This action will permanently delete all {state.contacts.length} contacts from your storage and
                        cannot be undone. Are you sure you want to proceed?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAll} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                        Yes, Clear All Contacts
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Pagination Controls - Top */}
              <div className="mb-6">
                <Pagination
                  currentPage={paginatedContacts.currentPage}
                  totalPages={paginatedContacts.totalPages}
                  totalItems={filteredContacts.length}
                  itemsPerPage={state.itemsPerPage}
                  onPageChange={(page) => updateState({ currentPage: page })}
                  onItemsPerPageChange={(itemsPerPage) => updateState({ itemsPerPage, currentPage: 1 })}
                />
              </div>

              {/* Contact Cards - Horizontal Layout */}
              <div className="space-y-4">
                {paginatedContacts.contacts.map((contact, index) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    index={(paginatedContacts.currentPage - 1) * state.itemsPerPage + index}
                    isSelected={selectedContacts.some((c) => c.id === contact.id)}
                    onToggleSelect={() => toggleContactSelection(contact)}
                    onUpdate={(updatedContact) => {
                      const updatedContacts = state.contacts.map((c) =>
                        c.id === updatedContact.id ? updatedContact : c,
                      )
                      updateState({ contacts: updatedContacts })
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
                <div className="mt-6">
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
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-blue-900 flex items-center gap-2 text-base sm:text-lg">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              How to use Business Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-3 p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-semibold text-sm sm:text-base">📊 Excel/CSV Columns:</p>
                <p className="text-xs sm:text-sm">
                  Phone, Company Name, Category, Website, and any custom columns you add!
                </p>

                <p className="font-semibold text-sm sm:text-base">🔍 Advanced Search:</p>
                <p className="text-xs sm:text-sm">Use multiple criteria and save your search queries</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-sm sm:text-base">📝 Template Variables:</p>
                <p className="text-xs sm:text-sm">
                  {"{companyName}"}, {"{companyCategory}"}, {"{website}"}, and your custom column headers like
                  {"{contactPerson}"}
                </p>

                <p className="font-semibold text-sm sm:text-base">✅ Bulk Operations:</p>
                <p className="text-xs sm:text-sm">Select multiple contacts for bulk export or deletion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
