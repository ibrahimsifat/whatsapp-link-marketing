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
  Sparkles,
  Shield,
  Zap,
  Target,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
            </div>
            <div className="relative flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl shadow-lg">
                <MessageCircle className="h-12 w-12 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {APP_CONSTANTS.APP_NAME}
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <span className="text-lg font-medium text-slate-600">Professional Business Outreach</span>
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-slate-600 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            Transform your business communication with intelligent WhatsApp messaging. Upload contacts, create
            personalized templates, and track your outreach with enterprise-grade tools.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
            <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800">Secure & Private</div>
                <div className="text-sm text-slate-600">Your data stays safe</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800">Lightning Fast</div>
                <div className="text-sm text-slate-600">Bulk operations</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800">Smart Targeting</div>
                <div className="text-sm text-slate-600">Advanced filters</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button
              onClick={() => window.open("/documentation", "_blank")}
              variant="outline"
              size="lg"
              className="bg-white/80 backdrop-blur-sm hover:bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              View Documentation
            </Button>
            {database.totalContacts > 0 && (
              <Button
                onClick={loadSavedContacts}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Building className="h-5 w-5 mr-2" />
                Load Saved Contacts ({database.totalContacts})
              </Button>
            )}
          </div>
        </div>

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
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-lg border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Upload className="h-5 w-5 text-emerald-600" />
                  </div>
                  Upload Business Data
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Excel/CSV columns: Phone Number, Company Name, Company Category, Website (optional) • Max file size:
                  10MB
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {/* Enhanced Password Input */}
                <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-amber-800">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Lock className="h-5 w-5 text-amber-600" />
                      </div>
                      Security Authentication
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      Enter the upload password to access file upload functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          className={`pr-12 h-12 text-base ${state.passwordError ? "border-red-300 focus:border-red-500" : "border-amber-200 focus:border-amber-400"} bg-white/80`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-amber-100"
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
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{state.passwordError}</p>
                        </div>
                      )}
                      {state.uploadPassword === APP_CONSTANTS.UPLOAD_PASSWORD && (
                        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-emerald-700">Password verified. You can now upload files.</p>
                        </div>
                      )}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                          <strong>Default Password:</strong> {APP_CONSTANTS.UPLOAD_PASSWORD}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          This security measure protects against unauthorized file uploads.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* File Error */}
                {state.fileError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-800">Upload Error</h4>
                        <p className="text-sm text-red-700 mt-1">{state.fileError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Drop Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    state.dragActive
                      ? "border-emerald-400 bg-emerald-50 scale-[1.02] shadow-lg"
                      : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
                  } ${state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD ? "opacity-50 cursor-not-allowed" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="p-6 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl w-fit mx-auto">
                        <Upload className="h-12 w-12 text-emerald-600" />
                      </div>
                      {state.dragActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-emerald-400/20 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <p className="text-xl font-semibold text-slate-700">
                        <span className="hidden sm:inline">Drag and drop your Excel/CSV file here</span>
                        <span className="sm:hidden">Upload your Excel/CSV file</span>
                      </p>
                      <p className="text-slate-500">or</p>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8"
                        disabled={state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD}
                        onClick={() => {
                          const fileInput = document.getElementById("file-upload") as HTMLInputElement
                          if (fileInput) {
                            fileInput.click()
                          }
                        }}
                      >
                        <Upload className="h-5 w-5 mr-2" />
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
                    <div className="text-sm text-slate-500 space-y-2 bg-slate-50 rounded-lg p-4">
                      <p className="font-medium">
                        Expected columns: Phone, Company Name, Category, Website, and any custom columns
                      </p>
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
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Phone className="h-5 w-5 text-cyan-600" />
                  </div>
                  Manual Number Entry
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Generate a WhatsApp link for a single phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="manual-phone" className="text-sm font-medium text-slate-700">
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
                    className={`h-12 text-base ${state.manualPhoneError ? "border-red-300" : "border-slate-200"} bg-white/80`}
                  />
                  {state.manualPhoneError && (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {state.manualPhoneError}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleGenerateManualLink}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Generate Link
                </Button>

                {state.manualLink && (
                  <div className="space-y-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <Label className="text-sm font-medium text-slate-700">Generated WhatsApp Link</Label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Input value={state.manualLink} readOnly className="flex-1 text-sm bg-white" />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyManualLink}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm"
                        >
                          {state.manualLinkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2">Copy</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(state.manualLink, "_blank")}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-white shadow-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="ml-2">Open</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
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

        {/* Enhanced Rich Text Editor Section */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-slate-100">
            <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              Custom Message Editor
            </CardTitle>
            <CardDescription className="text-slate-600">
              Create personalized messages with variables: {"{companyName}"}, {"{companyCategory}"}, {"{website}"}
              {availableCustomVariables.length > 0 && (
                <span>, and your custom variables: {availableCustomVariables.map((v) => `{${v}}`).join(", ")}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <RichTextEditor
              value={state.customMessage}
              onChange={(value) => updateState({ customMessage: value })}
              placeholder="Type your message here... Use {companyName}, {companyCategory}, {website} for personalization"
            />
            {state.contacts.length > 0 && (
              <Button
                onClick={() => updateWhatsAppLinks()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8"
              >
                <Send className="h-5 w-5 mr-2" />
                Update WhatsApp Links
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Loading State */}
        {state.isLoading && (
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

        {/* Enhanced Statistics and Bulk Actions */}
        {state.contacts.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg border-b border-slate-100">
              <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                Business Contacts Overview
                {Object.keys(searchCriteria).length > 0 && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">Filtered</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{filteredContacts.length}</div>
                  <div className="text-sm text-blue-600 font-medium">
                    {Object.keys(searchCriteria).length > 0 ? "Filtered" : "Total"} Contacts
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl text-center border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {filteredContacts.filter((c) => c.hasWebsite).length}
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">With Website</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl text-center border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {filteredContacts.filter((c) => !c.hasWebsite).length}
                  </div>
                  <div className="text-sm text-orange-600 font-medium">No Website</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{selectedContacts.length}</div>
                  <div className="text-sm text-purple-600 font-medium">Selected</div>
                </div>
              </div>

              {/* Enhanced Bulk Actions */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={
                        paginatedContacts.contacts.length > 0 &&
                        paginatedContacts.contacts.every((contact) =>
                          selectedContacts.some((selected) => selected.id === contact.id),
                        )
                      }
                      onCheckedChange={selectAllVisible}
                      className="h-5 w-5"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      Select All ({paginatedContacts.contacts.length})
                    </span>
                  </div>
                  {selectedContacts.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {selectedContacts.length} selected
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {selectedContacts.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkExport}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-sm"
                      >
                        Clear Selection
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50 bg-white shadow-sm"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-600 gap-3 mb-6">
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
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Enhanced Batch Send Button */}
              {paginatedContacts.contacts.length > 0 && (
                <div className="text-center">
                  {state.isBatchSending ? (
                    <Button
                      onClick={stopBatchSend}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 px-8"
                      size="lg"
                    >
                      <StopCircle className="h-5 w-5 mr-2" />
                      Stop Sending ({state.currentBatchIndex}/{paginatedContacts.contacts.length})
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={paginatedContacts.contacts.length === 0}
                          className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 px-8"
                          size="lg"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Send Current Page ({paginatedContacts.contacts.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5 text-emerald-600" />
                            Confirm Batch Send
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will open {paginatedContacts.contacts.length} WhatsApp chats from the current page in
                            new tabs, one by one, with a small delay. **Please ensure your browser allows pop-ups for
                            this site, otherwise, the chats will not open.**
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={startBatchSend}
                            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
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

        {/* Enhanced Results Section */}
        {filteredContacts.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-lg border-b border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Building className="h-5 w-5 text-emerald-600" />
                    </div>
                    Business WhatsApp Links
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      {filteredContacts.length} contacts
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Professional contact cards with horizontal layout for better readability
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-white shadow-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
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
              </div>
            </CardHeader>
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
    </div>
  )
}
