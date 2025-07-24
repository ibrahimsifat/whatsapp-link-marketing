"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Download, ExternalLink, AlertCircle, CheckCircle, RefreshCw, HelpCircle, FileSpreadsheet } from "lucide-react"
import type { Contact } from "../types/contact"

interface GoogleSheetsImportProps {
  onImportContacts: (contacts: Contact[]) => void
  onShowToast: (message: string, type?: "success" | "error") => void
}

export function GoogleSheetsImport({ onImportContacts, onShowToast }: GoogleSheetsImportProps) {
  const [sheetUrl, setSheetUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")
  const [lastImportedUrl, setLastImportedUrl] = useState("")
  const [importStats, setImportStats] = useState<{
    total: number
    new: number
    duplicates: number
  } | null>(null)

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

  const generateContactId = (phone: string): string => {
    return `contact_${phone.replace(/[^\d]/g, "")}_${Date.now()}`
  }

  const convertToCSVUrl = (url: string): string => {
    // Handle different Google Sheets URL formats
    let csvUrl = url.trim()

    // If it's a sharing URL, convert to CSV export URL
    if (csvUrl.includes("/edit") || csvUrl.includes("usp=sharing")) {
      // Extract the sheet ID
      const sheetIdMatch = csvUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (sheetIdMatch) {
        const sheetId = sheetIdMatch[1]
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
      }
    }

    // If it already contains export format, use as is
    if (csvUrl.includes("/export?format=csv")) {
      return csvUrl
    }

    return csvUrl
  }

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split("\n").filter((line) => line.trim())
    const result: string[][] = []

    for (const line of lines) {
      const row: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          row.push(current.trim().replace(/^"|"$/g, ""))
          current = ""
        } else {
          current += char
        }
      }
      row.push(current.trim().replace(/^"|"$/g, ""))
      result.push(row)
    }

    return result
  }

  const importFromGoogleSheets = async () => {
    if (!sheetUrl.trim()) {
      setError("Please enter a Google Sheets URL")
      return
    }

    setIsImporting(true)
    setError("")

    try {
      const csvUrl = convertToCSVUrl(sheetUrl)

      const response = await fetch(csvUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`)
      }

      const csvText = await response.text()
      const data = parseCSV(csvText)

      if (data.length === 0) {
        throw new Error("The sheet appears to be empty")
      }

      // Process the data
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
        } else if (headerStr && headerStr !== "phone" && headerStr !== "mobile" && headerStr !== "number") {
          // Any other non-empty header is considered a dynamic data column
          dynamicDataCols.push({ name: String(header), index })
        }
      })

      // Process each row
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
              whatsappLink: generateWhatsAppLink(normalized),
              companyName: companyName || undefined,
              companyCategory: companyCategory || undefined,
              website: website || undefined,
              hasWebsite,
              status: "pending",
              lastUpdated: new Date().toISOString(),
              source: "Google Sheets",
              dynamicData: Object.keys(dynamicData).length > 0 ? dynamicData : undefined,
            }

            processedContacts.push(contact)
          }
        }
      })

      if (processedContacts.length === 0) {
        throw new Error("No valid contacts found in the sheet. Please check the format.")
      }

      // Import the contacts
      onImportContacts(processedContacts)
      setLastImportedUrl(sheetUrl)
      setImportStats({
        total: processedContacts.length,
        new: processedContacts.length,
        duplicates: 0,
      })

      onShowToast(`Successfully imported ${processedContacts.length} contacts from Google Sheets!`, "success")
    } catch (error) {
      console.error("Error importing from Google Sheets:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to import: ${errorMessage}`)
      onShowToast("Failed to import from Google Sheets", "error")
    } finally {
      setIsImporting(false)
    }
  }

  const updateFromSheet = async () => {
    if (lastImportedUrl) {
      setSheetUrl(lastImportedUrl)
      await importFromGoogleSheets()
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg sm:text-xl">
          <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6" />
          Google Sheets Import & Cloud Sync
        </CardTitle>
        <CardDescription className="text-emerald-600 text-xs sm:text-sm">
          Import contacts directly from a public Google Sheets document
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Instructions */}
        <Alert className="border-blue-200 bg-blue-50">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>How to use:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
              <li>Open your Google Sheet and click "Share" → "Anyone with the link can view"</li>
              <li>Copy the sharing link and paste it below</li>
              <li>Your sheet should have columns: Phone, Company Name, Category, Website</li>
              <li>Click "Import from Google Sheets" to sync your contacts</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="sheet-url" className="text-sm font-medium">
            Google Sheets URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="sheet-url"
              type="url"
              value={sheetUrl}
              onChange={(e) => {
                setSheetUrl(e.target.value)
                setError("")
              }}
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit..."
              className="flex-1"
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Google Sheets Setup Guide</SheetTitle>
                  <SheetDescription>Follow these steps to set up your Google Sheet for import</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 1: Prepare Your Sheet</h4>
                    <p className="text-sm text-gray-600">
                      Create a Google Sheet with these column headers in the first row:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1 text-gray-600">
                      <li>
                        <strong>Phone</strong> - Phone numbers (e.g., 0551234567)
                      </li>
                      <li>
                        <strong>Company Name</strong> - Business names
                      </li>
                      <li>
                        <strong>Category</strong> - Industry or business type
                      </li>
                      <li>
                        <strong>Website</strong> - Company websites (optional)
                      </li>
                      <li>Any custom columns for personalization</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 2: Make Sheet Public</h4>
                    <ol className="text-sm list-decimal list-inside space-y-1 text-gray-600">
                      <li>Click the "Share" button in your Google Sheet</li>
                      <li>Click "Change to anyone with the link"</li>
                      <li>Set permission to "Viewer"</li>
                      <li>Click "Copy link"</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Step 3: Import</h4>
                    <p className="text-sm text-gray-600">
                      Paste the copied link in the URL field and click "Import from Google Sheets"
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Stats */}
        {importStats && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700 text-sm">
              Last import: {importStats.total} contacts processed, {importStats.new} new contacts added
              {importStats.duplicates > 0 && `, ${importStats.duplicates} duplicates updated`}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={importFromGoogleSheets}
            disabled={!sheetUrl.trim() || isImporting}
            className="bg-emerald-600 hover:bg-emerald-700 flex-1"
          >
            {isImporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import from Google Sheets
              </>
            )}
          </Button>

          {lastImportedUrl && (
            <Button
              onClick={updateFromSheet}
              disabled={isImporting}
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update from Sheet
            </Button>
          )}

          {sheetUrl && (
            <Button
              onClick={() => window.open(sheetUrl, "_blank")}
              variant="outline"
              size="icon"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sample Sheet Link */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Need a template? Use our sample Google Sheet:</p>
          <Button
            onClick={() => window.open("https://docs.google.com/spreadsheets/d/1example/edit", "_blank")}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Sample Sheet
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
