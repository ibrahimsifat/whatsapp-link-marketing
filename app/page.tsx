"use client"

import type React from "react"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import * as XLSX from "xlsx"
import { RichTextEditor } from "./components/rich-text-editor"
import { MessageTemplates } from "./components/message-templates"
import { ContactManagement } from "./components/contact-management"
import { ContactCard } from "./components/contact-card"
import { GoogleSheetsImport } from "./components/google-sheets-import"
import { useContactStorage } from "./hooks/use-contact-storage"
import type { Contact, MessageTemplate } from "./types/contact"
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
import { toast } from "sonner"

const defaultTemplates: MessageTemplate[] = [
  {
    id: "welcome_with_website",
    name: "Welcome - With Website",
    category: "Welcome",
    content:
      "Hello *{companyName}*! 👋\n\nI noticed your company in the _{companyCategory}_ industry. I visited your website at {website} and I'm impressed!\n\nWe specialize in helping businesses like yours grow. Would you be interested in a quick chat about how we can support your business goals?",
    variables: ["{companyName}", "{companyCategory}", "{website}"],
    targetAudience: "with_website",
  },
  {
    id: "welcome_no_website",
    name: "Welcome - No Website",
    category: "Welcome",
    content:
      "Hello *{companyName}*! 👋\n\nI see you're in the _{companyCategory}_ industry. In today's digital world, having an online presence is crucial for business growth.\n\nWe help businesses like yours establish a strong digital presence. Would you like to discuss how we can help you get online and reach more customers?",
    variables: ["{companyName}", "{companyCategory}"],
    targetAudience: "no_website",
  },
  {
    id: "follow_up_general",
    name: "Follow Up - General",
    category: "Follow Up",
    content:
      "Hi *{companyName}*! 👋\n\nI hope you're doing well. I wanted to follow up on our previous conversation about growing your _{companyCategory}_ business.\n\nDo you have a few minutes to discuss how we can help you achieve your business goals?",
    variables: ["{companyName}", "{companyCategory}"],
    targetAudience: "all",
  },
  {
    id: "service_offer",
    name: "Service Offer",
    category: "Sales",
    content:
      "Hello *{companyName}*! 🚀\n\nAs a _{companyCategory}_ business, you understand the importance of staying competitive. We're offering a *special package* designed specifically for companies in your industry.\n\n✅ Increase your online visibility\n✅ Generate more leads\n✅ Boost your revenue\n\nInterested in learning more? Let's schedule a quick 15-minute call!",
    variables: ["{companyName}", "{companyCategory}"],
    targetAudience: "all",
  },
  {
    id: "custom_variable_example",
    name: "Custom Variable Example",
    category: "Custom",
    content:
      "Hi {contactPerson}! This is a message about your interest in {product}. Your last interaction was on {lastInteractionDate}. Let's connect!",
    variables: ["{contactPerson}", "{product}", "{lastInteractionDate}"],
    targetAudience: "all",
  },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const UPLOAD_PASSWORD = "Pass123123"
const BATCH_SEND_DELAY_MS = 500 // Delay between opening WhatsApp tabs

export default function WhatsAppLinkGenerator() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [customMessage, setCustomMessage] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterWebsite, setFilterWebsite] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [fileError, setFileError] = useState<string>("")
  const [uploadPassword, setUploadPassword] = useState<string>("")
  const [passwordError, setPasswordError] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)

  // Manual number input states
  const [manualPhoneNumber, setManualPhoneNumber] = useState<string>("")
  const [manualLink, setManualLink] = useState<string>("")
  const [manualLinkCopied, setManualLinkCopied] = useState<boolean>(false)
  const [manualPhoneError, setManualPhoneError] = useState<string>("")

  // Batch sending states
  const [isBatchSending, setIsBatchSending] = useState(false)
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)
  const batchSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    if (database.contacts.length > 0 && contacts.length === 0) {
      setContacts(database.contacts)
    }
  }, [database.contacts, contacts.length])

  const normalizePhoneNumber = (phone: string): string | null => {
    const cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "")

    if (cleaned.match(/^05\d{8}$/)) {
      return "+966" + cleaned.substring(1)
    }
    if (cleaned.match(/^5\d{8}$/)) {
      return "+966" + cleaned
    }
    if (cleaned.match(/^\+9665\d{8}$/)) {
      return cleaned
    }
    if (cleaned.match(/^9665\d{8}$/)) {
      return "+" + cleaned
    }

    return null
  }

  const generateWhatsAppLink = (phone: string, message?: string): string => {
    const baseUrl = "https://wa.me/"
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : ""
    return baseUrl + phone.replace("+", "") + encodedMessage
  }

  const replaceVariables = (template: string, contact: Partial<Contact>): string => {
    let replacedText = template
      .replace(/\{companyName\}/g, contact.companyName || "there")
      .replace(/\{companyCategory\}/g, contact.companyCategory || "your industry")
      .replace(/\{website\}/g, contact.website || "")

    // Replace custom dynamic variables
    if (contact.dynamicData) {
      for (const key in contact.dynamicData) {
        if (Object.prototype.hasOwnProperty.call(contact.dynamicData, key)) {
          const value = contact.dynamicData[key]
          // Use a more robust regex to match the exact variable name
          replacedText = replacedText.replace(new RegExp(`\\{${key}\\}`, "g"), String(value || ""))
        }
      }
    }
    return replacedText
  }

  const generateContactId = (phone: string): string => {
    return `contact_${phone.replace(/[^\d]/g, "")}_${Date.now()}`
  }

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setFileError(
        `File size (${fileSizeMB}MB) exceeds the maximum limit of 10MB. Please reduce the file size or split into smaller files.`,
      )
      return false
    }
    setFileError("")
    return true
  }

  const processFile = useCallback(
    async (file: File) => {
      // Validate file size first
      if (!validateFileSize(file)) {
        return
      }

      setIsLoading(true)
      setFileError("")

      try {
        let data: string[][] = []

        if (file.name.endsWith(".csv")) {
          // Process CSV file
          const text = await file.text()
          const lines = text.split("\n").filter((line) => line.trim())
          data = lines.map((line) => {
            // Handle CSV parsing with proper quote handling
            const result: string[] = []
            let current = ""
            let inQuotes = false

            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === "," && !inQuotes) {
                result.push(current.trim())
                current = ""
              } else {
                current += char
              }
            }
            result.push(current.trim())
            return result
          })
        } else {
          // Process Excel file
          const buffer = await file.arrayBuffer()
          const workbook = XLSX.read(buffer, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
        }

        const processedContacts: Contact[] = []
        const seenNumbers = new Set<string>()

        // Find header row and column indices
        const headerRow = data[0] || []
        const phoneColumns: number[] = []
        let companyNameCol = -1
        let companyCategoryCol = -1
        let websiteCol = -1
        const dynamicDataCols: { name: string; index: number }[] = []

        headerRow.forEach((header, index) => {
          const headerStr = String(header).toLowerCase()
          if (headerStr.includes("phone") || headerStr.includes("mobile") || headerStr.includes("number")) {
            phoneColumns.push(index)
          } else if (headerStr.includes("company") && headerStr.includes("name")) {
            companyNameCol = index
          } else if (headerStr.includes("category") || headerStr.includes("industry") || headerStr.includes("type")) {
            companyCategoryCol = index
          } else if (headerStr.includes("website") || headerStr.includes("url") || headerStr.includes("site")) {
            websiteCol = index
          } else if (headerStr) {
            // Any other non-empty header is considered a dynamic data column
            dynamicDataCols.push({ name: String(header), index })
          }
        })

        data.forEach((row, rowIndex) => {
          if (rowIndex === 0) return // Skip header row

          let phoneNumber = ""
          let companyName = ""
          let companyCategory = ""
          let website = ""
          const dynamicData: Record<string, string | number | boolean | null | undefined> = {}

          // Extract phone number
          if (phoneColumns.length > 0) {
            phoneNumber = String(row[phoneColumns[0]] || "")
          } else {
            // Fallback: search all columns for phone numbers
            row.forEach((cell) => {
              if (cell && typeof cell === "string") {
                const phoneRegex = /(\+?966\s*|0)?[5]\s*\d[\s\d]{7,}/
                if (phoneRegex.test(cell) && !phoneNumber) {
                  phoneNumber = cell
                }
              }
            })
          }

          // Extract company data
          if (companyNameCol >= 0) companyName = String(row[companyNameCol] || "")
          if (companyCategoryCol >= 0) companyCategory = String(row[companyCategoryCol] || "")
          if (websiteCol >= 0) website = String(row[websiteCol] || "")

          // Extract dynamic data
          dynamicDataCols.forEach((col) => {
            if (row[col.index] !== undefined && row[col.index] !== null && String(row[col.index]).trim() !== "") {
              dynamicData[col.name] = row[col.index]
            }
          })

          // Clean and validate website
          if (website) {
            website = website.trim()
            if (website && !website.startsWith("http")) {
              website = "https://" + website
            }
            // Check if website looks valid
            if (!website.includes(".") || website.length < 8) {
              website = ""
            }
          }

          if (phoneNumber) {
            const normalized = normalizePhoneNumber(phoneNumber)
            if (normalized && !seenNumbers.has(normalized)) {
              seenNumbers.add(normalized)

              // Determine if company has website
              const hasWebsite = Boolean(website)

              // Auto-categorize if no category provided
              if (!companyCategory && !hasWebsite) {
                companyCategory = "No Website"
              }

              const contact: Contact = {
                id: generateContactId(normalized),
                original: phoneNumber,
                normalized,
                whatsappLink: generateWhatsAppLink(normalized, customMessage), // Will be updated later with full message
                companyName: companyName || undefined,
                companyCategory: companyCategory || undefined,
                website: website || undefined,
                hasWebsite,
                status: "pending",
                lastUpdated: new Date().toISOString(),
                source: file.name,
                dynamicData: Object.keys(dynamicData).length > 0 ? dynamicData : undefined,
              }

              processedContacts.push(contact)
            }
          }
        })

        // Update WhatsApp links with full personalized messages
        const finalContacts = processedContacts.map((contact) => ({
          ...contact,
          whatsappLink: generateWhatsAppLink(contact.normalized, replaceVariables(customMessage, contact)),
        }))

        setContacts(finalContacts)
        toast.success(`Successfully processed ${finalContacts.length} contacts from ${file.name}`)
      } catch (error) {
        console.error("Error processing file:", error)
        setFileError("Error processing file. Please ensure it's a valid .xlsx, .xls, or .csv file.")
        toast.error("Failed to process file")
      } finally {
        setIsLoading(false)
      }
    },
    [customMessage],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (uploadPassword !== UPLOAD_PASSWORD) {
        setPasswordError("Incorrect password. Please enter the correct password to upload.")
        return
      }
      setPasswordError("") // Clear password error if correct

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (
          file.type.includes("sheet") ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls") ||
          file.name.endsWith(".csv") ||
          file.type === "text/csv"
        ) {
          processFile(file)
        } else {
          setFileError("Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)")
        }
      }
    },
    [processFile, uploadPassword],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadPassword !== UPLOAD_PASSWORD) {
      setPasswordError("Incorrect password. Please enter the correct password to upload.")
      e.target.value = "" // Clear the file input
      return
    }
    setPasswordError("") // Clear password error if correct

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (
        file.type.includes("sheet") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv") ||
        file.type === "text/csv"
      ) {
        processFile(file)
      } else {
        setFileError("Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)")
      }
    }
  }

  const applyTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setCustomMessage(template.content)
    updateWhatsAppLinks(template.content)
  }

  const updateWhatsAppLinks = (message?: string) => {
    const messageToUse = message || customMessage
    const updatedContacts = contacts.map((contact) => ({
      ...contact,
      whatsappLink: generateWhatsAppLink(contact.normalized, replaceVariables(messageToUse, contact)),
    }))
    setContacts(updatedContacts)
  }

  const clearAll = async () => {
    try {
      // Clear from storage first
      const result = await clearAllContacts()

      if (result.success) {
        // Clear local state
        setContacts([])
        setCustomMessage("")
        setSelectedTemplate(null)
        setFileError("")
        setManualPhoneNumber("")
        setManualLink("")
        setManualLinkCopied(false)
        setManualPhoneError("")
        setIsBatchSending(false)
        setCurrentBatchIndex(0)
        if (batchSendTimeoutRef.current) {
          clearTimeout(batchSendTimeoutRef.current)
        }

        toast.success("All contacts cleared successfully")
      } else {
        toast.error(result.message || "Failed to clear contacts")
      }
    } catch (error) {
      console.error("Error clearing contacts:", error)
      toast.error("Failed to clear contacts")
    }
  }

  const loadSavedContacts = () => {
    if (database.contacts.length > 0) {
      setContacts(database.contacts)
      toast.success(`Loaded ${database.contacts.length} saved contacts`)
    }
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
      toast.success("Link copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy text: ", err)
      toast.error("Failed to copy link")
    }
  }

  const formatPhoneDisplay = (phone: string) => {
    if (phone.startsWith("+966")) {
      const number = phone.substring(4)
      return `+966 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`
    }
    return phone
  }

  const handleOpenWhatsApp = (contact: Contact) => {
    window.open(contact.whatsappLink, "_blank")
  }

  const handleUpdateContactStatus = (contact: Contact) => {
    setSelectedContact(contact)
  }

  const handleDeleteContact = async (contactId: string) => {
    const result = await deleteContact(contactId)
    if (result.success) {
      // Remove from current contacts if it exists there
      const updatedCurrentContacts = contacts.filter((c) => c.id !== contactId)
      setContacts(updatedCurrentContacts)
      toast.success("Contact deleted successfully")
    } else {
      toast.error("Failed to delete contact")
    }
  }

  const handleGenerateManualLink = () => {
    setManualLinkCopied(false)
    setManualPhoneError("")
    if (!manualPhoneNumber) {
      setManualPhoneError("Please enter a phone number.")
      setManualLink("")
      return
    }
    const normalizedPhone = normalizePhoneNumber(manualPhoneNumber)
    if (!normalizedPhone) {
      setManualPhoneError("Invalid Saudi phone number format.")
      setManualLink("")
      return
    }
    const link = generateWhatsAppLink(normalizedPhone, customMessage)
    setManualLink(link)
    toast.success("WhatsApp link generated!")
  }

  const handleCopyManualLink = async () => {
    if (manualLink) {
      try {
        await navigator.clipboard.writeText(manualLink)
        setManualLinkCopied(true)
        setTimeout(() => setManualLinkCopied(false), 2000)
        toast.success("Link copied to clipboard!")
      } catch (err) {
        console.error("Failed to copy manual link: ", err)
        toast.error("Failed to copy link")
      }
    }
  }

  const handleImportContacts = (newContacts: Contact[]) => {
    // Merge with existing contacts, avoiding duplicates
    const existingNumbers = new Set(contacts.map((c) => c.normalized))
    const uniqueNewContacts = newContacts.filter((contact) => !existingNumbers.has(contact.normalized))

    if (uniqueNewContacts.length > 0) {
      const updatedContacts = [...contacts, ...uniqueNewContacts]
      setContacts(updatedContacts)

      // Update WhatsApp links with current message
      const finalContacts = updatedContacts.map((contact) => ({
        ...contact,
        whatsappLink: generateWhatsAppLink(contact.normalized, replaceVariables(customMessage, contact)),
      }))
      setContacts(finalContacts)
    }
  }

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (type === "success") {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  // Memoized filtered contacts for performance
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Category filter
      if (filterCategory !== "all" && contact.companyCategory !== filterCategory) return false

      // Website filter
      if (filterWebsite === "with_website" && !contact.hasWebsite) return false
      if (filterWebsite === "no_website" && contact.hasWebsite) return false

      // Status filter
      if (filterStatus !== "all" && contact.status !== filterStatus) return false

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          contact.companyName?.toLowerCase().includes(searchLower) ||
          contact.companyCategory?.toLowerCase().includes(searchLower) ||
          contact.normalized.includes(searchTerm) ||
          contact.website?.toLowerCase().includes(searchLower) ||
          (contact.dynamicData &&
            Object.values(contact.dynamicData).some((val) => String(val).toLowerCase().includes(searchLower)))

        if (!matchesSearch) return false
      }

      return true
    })
  }, [contacts, filterCategory, filterWebsite, filterStatus, searchTerm])

  // Get unique categories and website status for filtering
  const categories = Array.from(new Set(contacts.map((c) => c.companyCategory).filter(Boolean)))
  const websiteStats = {
    total: contacts.length,
    withWebsite: contacts.filter((c) => c.hasWebsite).length,
    noWebsite: contacts.filter((c) => !c.hasWebsite).length,
  }

  // Extract all unique dynamic data keys for template hints
  const availableCustomVariables = useMemo(() => {
    const keys = new Set<string>()
    contacts.forEach((contact) => {
      if (contact.dynamicData) {
        Object.keys(contact.dynamicData).forEach((key) => keys.add(key))
      }
    })
    return Array.from(keys)
  }, [contacts])

  // Batch Sending Logic
  const startBatchSend = useCallback(() => {
    if (filteredContacts.length === 0) {
      toast.error("No contacts to send in the filtered list.")
      return
    }
    setIsBatchSending(true)
    setCurrentBatchIndex(0)
    processBatchSend(0)
  }, [filteredContacts])

  const processBatchSend = useCallback(
    (index: number) => {
      if (index >= filteredContacts.length || !isBatchSending) {
        setIsBatchSending(false)
        setCurrentBatchIndex(0)
        if (batchSendTimeoutRef.current) {
          clearTimeout(batchSendTimeoutRef.current)
        }
        toast.success("Batch sending completed!")
        return
      }

      const contact = filteredContacts[index]
      handleOpenWhatsApp(contact) // Opens the WhatsApp link in a new tab

      // Automatically update status to 'sent' after opening
      // This is a client-side simulation; actual delivery status requires WhatsApp API
      updateContactStatus(contact.id, "sent")

      setCurrentBatchIndex(index + 1)

      batchSendTimeoutRef.current = setTimeout(() => {
        processBatchSend(index + 1)
      }, BATCH_SEND_DELAY_MS)
    },
    [filteredContacts, isBatchSending, updateContactStatus],
  )

  const stopBatchSend = useCallback(() => {
    setIsBatchSending(false)
    if (batchSendTimeoutRef.current) {
      clearTimeout(batchSendTimeoutRef.current)
    }
    toast.info("Batch sending stopped.")
  }, [])

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
              WhatsApp Business Link Generator
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
          <TabsList className="grid w-full grid-cols-5">
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
                          type={showPassword ? "text" : "password"}
                          value={uploadPassword}
                          onChange={(e) => {
                            setUploadPassword(e.target.value)
                            setPasswordError("") // Clear error on change
                          }}
                          placeholder="Enter your upload password"
                          className={`pr-10 text-sm sm:text-base ${passwordError ? "border-red-500 focus:border-red-500" : "border-amber-300 focus:border-amber-500"}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-amber-600" />
                          )}
                        </Button>
                      </div>
                      {passwordError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-red-700">{passwordError}</p>
                        </div>
                      )}
                      {uploadPassword === UPLOAD_PASSWORD && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-green-700">
                            Password verified. You can now upload files.
                          </p>
                        </div>
                      )}
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs text-blue-700">
                          <strong>Default Password:</strong> Pass123123
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          This security measure protects against unauthorized file uploads.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* File Size Error */}
                {fileError && (
                  <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-800 text-sm sm:text-base">Upload Error</h4>
                        <p className="text-xs sm:text-sm text-red-700 mt-1">{fileError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-all duration-300 ${
                    dragActive
                      ? "border-green-400 bg-green-50 scale-105"
                      : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
                  } ${uploadPassword !== UPLOAD_PASSWORD ? "opacity-50 cursor-not-allowed" : ""}`}
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
                        disabled={uploadPassword !== UPLOAD_PASSWORD}
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
                        disabled={uploadPassword !== UPLOAD_PASSWORD}
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
            <GoogleSheetsImport onImportContacts={handleImportContacts} onShowToast={showToast} />
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
                    value={manualPhoneNumber}
                    onChange={(e) => {
                      setManualPhoneNumber(e.target.value)
                      setManualPhoneError("")
                      setManualLink("") // Clear link when phone number changes
                    }}
                    placeholder="e.g., 0551234567 or +966551234567"
                    className={`text-sm sm:text-base ${manualPhoneError ? "border-red-500" : ""}`}
                  />
                  {manualPhoneError && (
                    <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {manualPhoneError}
                    </p>
                  )}
                </div>
                <Button onClick={handleGenerateManualLink} className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Generate Link
                </Button>

                {manualLink && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm font-medium">Generated WhatsApp Link</Label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Input value={manualLink} readOnly className="flex-1 text-xs sm:text-sm" />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyManualLink}
                          className="border-green-200 text-green-700 hover:bg-green-50 bg-transparent flex-1 sm:flex-none"
                        >
                          {manualLinkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2 sm:hidden">Copy</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(manualLink, "_blank")}
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

          {/* Templates Tab */}
          <TabsContent value="templates">
            <MessageTemplates
              templates={templates}
              onTemplateSelect={applyTemplate}
              selectedTemplate={selectedTemplate}
              onTemplateCreate={(template) => setTemplates([...templates, template])}
              onTemplateUpdate={(updatedTemplate) => {
                setTemplates(templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)))
              }}
              onTemplateDelete={(templateId) => {
                setTemplates(templates.filter((t) => t.id !== templateId))
                if (selectedTemplate?.id === templateId) {
                  setSelectedTemplate(null)
                }
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
              currentContacts={contacts}
              onUpdateCurrentContacts={setContacts}
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
              value={customMessage}
              onChange={setCustomMessage}
              placeholder="Type your message here... Use {companyName}, {companyCategory}, {website} for personalization"
            />
            {contacts.length > 0 && (
              <Button onClick={() => updateWhatsAppLinks()} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Send className="h-4 w-4 mr-2" />
                Update WhatsApp Links
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
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

        {/* Statistics and Filters */}
        {contacts.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-purple-800 text-lg sm:text-xl">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                Business Contacts Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{websiteStats.total}</div>
                  <div className="text-xs sm:text-sm text-blue-500">Total Contacts</div>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{websiteStats.withWebsite}</div>
                  <div className="text-xs sm:text-sm text-green-500">With Website</div>
                </div>
                <div className="bg-orange-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">{websiteStats.noWebsite}</div>
                  <div className="text-xs sm:text-sm text-orange-500">No Website</div>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">{categories.length}</div>
                  <div className="text-xs sm:text-sm text-purple-500">Categories</div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Search Contacts</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, category, phone..."
                      className="pl-8 sm:pl-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Filter by Category</Label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border rounded-md bg-white text-xs sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Filter by Website</Label>
                  <select
                    value={filterWebsite}
                    onChange={(e) => setFilterWebsite(e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border rounded-md bg-white text-xs sm:text-sm"
                  >
                    <option value="all">All Contacts</option>
                    <option value="with_website">With Website</option>
                    <option value="no_website">No Website</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Filter by Status</Label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border rounded-md bg-white text-xs sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="not_sent">Not Sent</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-gray-600 gap-2">
                <span>
                  {"Showing "}
                  {filteredContacts.length}
                  {" of "}
                  {contacts.length}
                  {" contacts"}
                </span>
                {(searchTerm || filterCategory !== "all" || filterWebsite !== "all" || filterStatus !== "all") && (
                  <span className="italic text-gray-500">{"Filters active"}</span>
                )}
              </div>

              {/* Batch Send Button */}
              {filteredContacts.length > 0 && (
                <div className="mt-4 sm:mt-6 text-center">
                  {isBatchSending ? (
                    <Button onClick={stopBatchSend} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto" size="lg">
                      <StopCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="hidden sm:inline">
                        Stop Sending ({currentBatchIndex}/{filteredContacts.length})
                      </span>
                      <span className="sm:hidden">
                        Stop ({currentBatchIndex}/{filteredContacts.length})
                      </span>
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={filteredContacts.length === 0}
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          size="lg"
                        >
                          <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          <span className="hidden sm:inline">Send All Filtered ({filteredContacts.length})</span>
                          <span className="sm:hidden">Send All ({filteredContacts.length})</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">Confirm Batch Send</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs sm:text-sm">
                            This will open {filteredContacts.length} WhatsApp chats in new tabs, one by one, with a
                            small delay. **Please ensure your browser allows pop-ups for this site, otherwise, the chats
                            will not open.**
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

        {/* Results Section - Contact Cards */}
        {filteredContacts.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-green-800 text-lg sm:text-xl">
                    <Building className="h-5 w-5 sm:h-6 sm:w-6" />
                    Business WhatsApp Links
                  </CardTitle>
                  <CardDescription className="text-green-600 text-xs sm:text-sm">
                    {filteredContacts.length} business contacts ready for messaging
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
                        This action will permanently delete all {contacts.length} contacts from your storage and cannot
                        be undone. Are you sure you want to proceed?
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
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredContacts.map((contact, index) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    index={index}
                    copiedIndex={copiedIndex}
                    onCopyToClipboard={copyToClipboard}
                    onOpenWhatsApp={handleOpenWhatsApp}
                    onUpdateStatus={handleUpdateContactStatus}
                    onDeleteContact={handleDeleteContact}
                    formatPhoneDisplay={formatPhoneDisplay}
                  />
                ))}
              </div>
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

                <p className="font-semibold text-sm sm:text-base">🏷️ Smart Categorization:</p>
                <p className="text-xs sm:text-sm">Auto-categorizes "No Website" companies</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-sm sm:text-base">📝 Template Variables:</p>
                <p className="text-xs sm:text-sm">
                  {"{companyName}"}, {"{companyCategory}"}, {"{website}"}, and your custom column headers like
                  {"{contactPerson}"}
                </p>

                <p className="font-semibold text-sm sm:text-base">🎯 Targeted Messaging:</p>
                <p className="text-xs sm:text-sm">Different templates for companies with/without websites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
