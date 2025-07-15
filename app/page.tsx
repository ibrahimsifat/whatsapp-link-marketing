"use client"

import type React from "react"

import { useState, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
} from "lucide-react"
import * as XLSX from "xlsx"
import { RichTextEditor } from "./components/rich-text-editor"
import { MessageTemplates } from "./components/message-templates"
import { ContactManagement } from "./components/contact-management"
import { ContactCard } from "./components/contact-card"
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
      } catch (error) {
        console.error("Error processing file:", error)
        setFileError("Error processing file. Please ensure it's a valid .xlsx, .xls, or .csv file.")
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

  const clearAll = () => {
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
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
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
  }

  const handleCopyManualLink = async () => {
    if (manualLink) {
      try {
        await navigator.clipboard.writeText(manualLink)
        setManualLinkCopied(true)
        setTimeout(() => setManualLinkCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy manual link: ", err)
      }
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
      alert("No contacts to send in the filtered list.")
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
    alert("Batch sending stopped.")
  }, [])

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto space-y-8 px-4">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-green-600 rounded-full">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              WhatsApp Business Link Generator
            </h1>
          </div>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Upload Excel with Company Name, Category & Website columns. Generate personalized WhatsApp messages with
            smart templates and track your outreach.
          </p>
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => window.open("/documentation", "_blank")}
              variant="outline"
              size="lg"
              className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              View Documentation
            </Button>
          </div>
        </div>

        {/* Contact Management System */}
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

        {/* Upload Section */}
        <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Upload className="h-6 w-6" />
              Upload Excel File with Business Data
            </CardTitle>
            <CardDescription className="text-green-600">
              Excel/CSV columns: Phone Number, Company Name, Company Category, Website (optional) • Max file size: 10MB
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Password Input */}
            <div className="mb-4 space-y-2">
              <Label htmlFor="upload-password">Upload Password</Label>
              <Input
                id="upload-password"
                type="password"
                value={uploadPassword}
                onChange={(e) => {
                  setUploadPassword(e.target.value)
                  setPasswordError("") // Clear error on change
                }}
                placeholder="Enter password to enable upload"
                className={passwordError ? "border-red-500" : ""}
              />
              {passwordError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {passwordError}
                </p>
              )}
              <p className="text-xs text-gray-500">Default password: `Pass123123`</p>
            </div>

            {/* File Size Error */}
            {fileError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800">Upload Error</h4>
                    <p className="text-sm text-red-700 mt-1">{fileError}</p>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? "border-green-400 bg-green-50 scale-105"
                  : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
              } ${uploadPassword !== UPLOAD_PASSWORD ? "opacity-50 cursor-not-allowed" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto">
                  <Upload className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-700">Drag and drop your Excel file here</p>
                  <p className="text-gray-500">or</p>
                  <Label htmlFor="file-upload">
                    <Button
                      size="lg"
                      variant="outline"
                      className="cursor-pointer bg-white hover:bg-green-50 border-green-200"
                      disabled={uploadPassword !== UPLOAD_PASSWORD}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploadPassword !== UPLOAD_PASSWORD}
                  />
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Expected columns: Phone, Company Name, Category, Website, and any custom columns</p>
                  <p>Supports: .xlsx, .xls, .csv files • Maximum size: 10MB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Number Entry Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-cyan-800">
              <Phone className="h-6 w-6" />
              Manual Number Entry
            </CardTitle>
            <CardDescription className="text-cyan-600">
              Generate a WhatsApp link for a single phone number
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-phone">Phone Number</Label>
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
                className={manualPhoneError ? "border-red-500" : ""}
              />
              {manualPhoneError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {manualPhoneError}
                </p>
              )}
            </div>
            <Button onClick={handleGenerateManualLink} className="bg-cyan-600 hover:bg-cyan-700">
              <Send className="h-4 w-4 mr-2" />
              Generate Link
            </Button>

            {manualLink && (
              <div className="space-y-2 mt-4">
                <Label>Generated WhatsApp Link</Label>
                <div className="flex items-center gap-2">
                  <Input value={manualLink} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyManualLink}
                    className="border-green-200 text-green-700 hover:bg-green-50 bg-transparent"
                  >
                    {manualLinkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(manualLink, "_blank")}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">This link uses the current message from the editor below.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Templates Section */}
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
          availableCustomVariables={availableCustomVariables} // Pass custom variables
        />

        {/* Rich Text Editor Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <MessageCircle className="h-6 w-6" />
              Custom Message Editor
            </CardTitle>
            <CardDescription className="text-blue-600">
              Create personalized messages with variables: {"{companyName}"}, {"{companyCategory}"}, {"{website}"}
              {availableCustomVariables.length > 0 && (
                <span>, and your custom variables: {availableCustomVariables.map((v) => `{${v}}`).join(", ")}</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <RichTextEditor
              value={customMessage}
              onChange={setCustomMessage}
              placeholder="Type your message here... Use {companyName}, {companyCategory}, {website} for personalization"
            />
            {contacts.length > 0 && (
              <Button onClick={() => updateWhatsAppLinks()} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Update WhatsApp Links
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="shadow-lg">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto"></div>
                <p className="text-gray-600 text-lg">Processing Excel file...</p>
                <p className="text-gray-400 text-sm">Extracting business data and validating phone numbers</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics and Filters */}
        {contacts.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Users className="h-6 w-6" />
                Business Contacts Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{websiteStats.total}</div>
                  <div className="text-sm text-blue-500">Total Contacts</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{websiteStats.withWebsite}</div>
                  <div className="text-sm text-green-500">With Website</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{websiteStats.noWebsite}</div>
                  <div className="text-sm text-orange-500">No Website</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
                  <div className="text-sm text-purple-500">Categories</div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search Contacts</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, category, phone..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Filter by Category</Label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-white"
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
                  <Label className="text-sm font-medium">Filter by Website</Label>
                  <select
                    value={filterWebsite}
                    onChange={(e) => setFilterWebsite(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="all">All Contacts</option>
                    <option value="with_website">With Website</option>
                    <option value="no_website">No Website</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Filter by Status</Label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="not_sent">Not Sent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
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
                <div className="mt-6 text-center">
                  {isBatchSending ? (
                    <Button onClick={stopBatchSend} className="bg-red-600 hover:bg-red-700" size="lg">
                      <StopCircle className="h-5 w-5 mr-2" />
                      Stop Sending ({currentBatchIndex}/{filteredContacts.length})
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={filteredContacts.length === 0}
                          className="bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Send All Filtered ({filteredContacts.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Batch Send</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will open {filteredContacts.length} WhatsApp chats in new tabs, one by one, with a
                            small delay. **Please ensure your browser allows pop-ups for this site, otherwise, the chats
                            will not open.**
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={startBatchSend} className="bg-green-600 hover:bg-green-700">
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
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Building className="h-6 w-6" />
                    Business WhatsApp Links
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    {filteredContacts.length} business contacts ready for messaging
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={clearAll}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              How to use Business Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-semibold">📊 Excel Columns:</p>
                <p className="text-sm">Phone, Company Name, Category, Website, and any custom columns you add!</p>

                <p className="font-semibold">🏷️ Smart Categorization:</p>
                <p className="text-sm">Auto-categorizes "No Website" companies</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">📝 Template Variables:</p>
                <p className="text-sm">
                  {"{companyName}"}, {"{companyCategory}"}, {"{website}"}, and your custom column headers like
                  {"{contactPerson}"}
                </p>

                <p className="font-semibold">🎯 Targeted Messaging:</p>
                <p className="text-sm">Different templates for companies with/without websites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
