import * as XLSX from "xlsx"
import type { Contact } from "../types/contact"
import { PhoneService } from "./phone-service"
import { WhatsAppService } from "./whatsapp-service"

export interface FileProcessingResult {
  contacts: Contact[]
  errors: string[]
  warnings: string[]
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export class FileService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly SUPPORTED_EXTENSIONS = [".xlsx", ".xls", ".csv"]

  /**
   * Validates file size and type
   */
  static validateFileSize(file: File): FileValidationResult {
    if (file.size > this.MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return {
        isValid: false,
        error: `File size (${fileSizeMB}MB) exceeds the maximum limit of 10MB. Please reduce the file size or split into smaller files.`,
      }
    }

    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `Unsupported file type. Please upload ${this.SUPPORTED_EXTENSIONS.join(", ")} files only.`,
      }
    }

    return { isValid: true }
  }

  /**
   * Processes uploaded file and extracts contacts
   */
  static async processFile(file: File, customMessage = ""): Promise<FileProcessingResult> {
    const result: FileProcessingResult = {
      contacts: [],
      errors: [],
      warnings: [],
    }

    try {
      let data: string[][] = []

      if (file.name.toLowerCase().endsWith(".csv")) {
        data = await this.processCSVFile(file)
      } else {
        data = await this.processExcelFile(file)
      }

      if (data.length === 0) {
        result.errors.push("File appears to be empty or corrupted")
        return result
      }

      const processedContacts = this.extractContactsFromData(data, file.name, customMessage)
      result.contacts = processedContacts.contacts
      result.warnings = processedContacts.warnings
    } catch (error) {
      result.errors.push(`Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    return result
  }

  /**
   * Processes CSV file. Handles quoted fields, escaped ("") quotes within
   * quoted fields, and quoted fields that contain embedded newlines.
   */
  private static async processCSVFile(file: File): Promise<string[][]> {
    const text = await file.text()
    const rows: string[][] = []
    let row: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const next = text[i + 1]

      if (inQuotes) {
        if (char === '"' && next === '"') {
          current += '"'
          i++
        } else if (char === '"') {
          inQuotes = false
        } else {
          current += char
        }
      } else if (char === '"') {
        inQuotes = true
      } else if (char === ",") {
        row.push(current.trim())
        current = ""
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && next === "\n") i++
        row.push(current.trim())
        current = ""
        if (row.some((cell) => cell !== "")) rows.push(row)
        row = []
      } else {
        current += char
      }
    }

    if (current !== "" || row.length > 0) {
      row.push(current.trim())
      if (row.some((cell) => cell !== "")) rows.push(row)
    }

    return rows
  }

  /**
   * Processes Excel file
   */
  private static async processExcelFile(file: File): Promise<string[][]> {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
  }

  /**
   * Extracts contacts from processed data
   */
  private static extractContactsFromData(
    data: string[][],
    fileName: string,
    customMessage: string,
  ): { contacts: Contact[]; warnings: string[] } {
    const contacts: Contact[] = []
    const warnings: string[] = []
    const seenNumbers = new Set<string>()
    let duplicateCount = 0

    if (data.length < 2) {
      warnings.push("File should contain at least a header row and one data row")
      return { contacts, warnings }
    }

    // Find header row and column indices
    const headerRow = data[0] || []
    const columnMapping = this.mapColumns(headerRow)

    // Process data rows
    data.slice(1).forEach((row, rowIndex) => {
      try {
        const { contact, skipReason } = this.extractContactFromRow(row, columnMapping, fileName, customMessage)

        if (contact) {
          if (seenNumbers.has(contact.normalized)) {
            duplicateCount++
            warnings.push(`Duplicate phone number found at row ${rowIndex + 2}: ${contact.original}`)
          } else {
            seenNumbers.add(contact.normalized)
            contacts.push(contact)
          }
        } else if (skipReason === "no-phone") {
          warnings.push(`Row ${rowIndex + 2} skipped: no phone number found in this row`)
        } else if (skipReason === "invalid-phone") {
          warnings.push(`Row ${rowIndex + 2} skipped: phone number could not be recognized as a valid number`)
        }
      } catch (error) {
        warnings.push(
          `Error processing row ${rowIndex + 2}: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
    })

    if (duplicateCount > 0) {
      warnings.push(`Found ${duplicateCount} duplicate phone numbers within the file`)
    }

    return { contacts, warnings }
  }

  /**
   * Maps column headers to their indices
   */
  private static mapColumns(headerRow: string[]): {
    phoneColumns: number[]
    companyNameCol: number
    companyCategoryCol: number
    websiteCol: number
    cityCol: number
    languageCol: number
    dynamicDataCols: { name: string; index: number }[]
  } {
    const phoneColumns: number[] = []
    let companyNameCol = -1
    let companyCategoryCol = -1
    let websiteCol = -1
    let cityCol = -1
    let languageCol = -1
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
      } else if (
        headerStr.includes("city") ||
        headerStr.includes("town") ||
        headerStr.includes("location") ||
        headerStr.includes("region")
      ) {
        cityCol = index
      } else if (headerStr.includes("language") || headerStr.includes("lang") || headerStr.includes("locale")) {
        languageCol = index
      } else if (headerStr.trim()) {
        dynamicDataCols.push({ name: String(header), index })
      }
    })

    return {
      phoneColumns,
      companyNameCol,
      companyCategoryCol,
      websiteCol,
      cityCol,
      languageCol,
      dynamicDataCols,
    }
  }

  /**
   * Extracts a single contact from a data row
   */
  private static extractContactFromRow(
    row: string[],
    columnMapping: ReturnType<typeof FileService.mapColumns>,
    fileName: string,
    customMessage: string,
  ): { contact: Contact | null; skipReason?: "empty" | "no-phone" | "invalid-phone" } {
    let phoneNumber = ""
    let companyName = ""
    let companyCategory = ""
    let website = ""
    let city = ""
    let language = ""
    const dynamicData: Record<string, string | number | boolean | null | undefined> = {}

    const isBlankRow = row.every((cell) => String(cell ?? "").trim() === "")
    if (isBlankRow) {
      return { contact: null, skipReason: "empty" }
    }

    // Extract phone number
    if (columnMapping.phoneColumns.length > 0) {
      phoneNumber = String(row[columnMapping.phoneColumns[0]] || "")
    } else {
      // Fallback: search all columns for phone numbers
      const foundNumbers = PhoneService.extractPhoneNumbers(row.join(" "))
      phoneNumber = foundNumbers[0] || ""
    }

    if (!phoneNumber) {
      return { contact: null, skipReason: "no-phone" }
    }

    const normalized = PhoneService.normalizePhoneNumber(phoneNumber)
    if (!normalized) {
      return { contact: null, skipReason: "invalid-phone" }
    }

    // Extract company data
    if (columnMapping.companyNameCol >= 0) {
      companyName = String(row[columnMapping.companyNameCol] || "")
    }
    if (columnMapping.companyCategoryCol >= 0) {
      companyCategory = String(row[columnMapping.companyCategoryCol] || "")
    }
    if (columnMapping.websiteCol >= 0) {
      website = this.cleanWebsiteUrl(String(row[columnMapping.websiteCol] || ""))
    }
    if (columnMapping.cityCol >= 0) {
      city = String(row[columnMapping.cityCol] || "").trim()
    }
    if (columnMapping.languageCol >= 0) {
      language = String(row[columnMapping.languageCol] || "").trim()
    }

    // Extract dynamic data
    columnMapping.dynamicDataCols.forEach((col) => {
      if (row[col.index] !== undefined && row[col.index] !== null && String(row[col.index]).trim() !== "") {
        dynamicData[col.name] = row[col.index]
      }
    })

    // Auto-categorize if no category provided
    const hasWebsite = Boolean(website)
    if (!companyCategory && !hasWebsite) {
      companyCategory = "No Website"
    }

    return {
      contact: {
        id: this.generateContactId(normalized),
        original: phoneNumber,
        normalized,
        whatsappLink: WhatsAppService.generateWhatsAppLink(normalized, customMessage),
        companyName: companyName || undefined,
        companyCategory: companyCategory || undefined,
        website: website || undefined,
        city: city || undefined,
        language: language || undefined,
        hasWebsite,
        status: "pending",
        lastUpdated: new Date().toISOString(),
        source: fileName,
        dynamicData: Object.keys(dynamicData).length > 0 ? dynamicData : undefined,
      },
    }
  }

  /**
   * Cleans and validates website URL
   */
  private static cleanWebsiteUrl(website: string): string {
    if (!website) return ""

    website = website.trim()
    if (website && !website.startsWith("http")) {
      website = "https://" + website
    }

    // Basic validation
    if (!website.includes(".") || website.length < 8) {
      return ""
    }

    return website
  }

  /**
   * Generates unique contact ID
   */
  private static generateContactId(phone: string): string {
    return `contact_${phone.replace(/[^\d]/g, "")}_${Date.now()}`
  }

  /**
   * Escapes a single CSV field, quoting it when it contains a comma, quote, or newline
   */
  private static escapeCsvField(value: string): string {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * Serializes contacts to a downloadable file. Currently only CSV is supported.
   */
  static exportContacts(contacts: Contact[], format: "csv" = "csv"): string {
    const headers = [
      "Company Name",
      "Phone Number",
      "Category",
      "Website",
      "City",
      "Language",
      "Status",
      "Notes",
      "Source",
      "Last Updated",
    ]
    const rows = contacts.map((contact) =>
      [
        contact.companyName || "",
        contact.original,
        contact.companyCategory || "",
        contact.website || "",
        contact.city || "",
        contact.language || "",
        contact.status,
        contact.notes || "",
        contact.source,
        contact.lastUpdated,
      ]
        .map((field) => this.escapeCsvField(String(field)))
        .join(","),
    )

    return [headers.join(","), ...rows].join("\r\n")
  }

  /**
   * Triggers a browser download of the given text content
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
