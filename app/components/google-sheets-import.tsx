"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  Copy,
  RefreshCw,
  HelpCircle,
  Loader2,
  Globe,
  Building,
  Phone,
  Tag,
} from "lucide-react"
import { PhoneService } from "../services/phone-service"
import type { Contact } from "../types/contact"

interface GoogleSheetsImportProps {
  onImportContacts: (contacts: Contact[]) => void
  onShowToast: (message: string, type?: "success" | "error") => void
}

interface ImportStats {
  total: number
  successful: number
  duplicates: number
  errors: number
}

export function GoogleSheetsImport({ onImportContacts, onShowToast }: GoogleSheetsImportProps) {
  const [sheetUrl, setSheetUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState("")
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [lastImportUrl, setLastImportUrl] = useState("")

  // Example sheet URL for demonstration
  const exampleUrl = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"

  const extractSheetId = (url: string): string | null => {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit#gid=(\d+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }
    return null
  }

  const generateCsvUrls = (sheetId: string): string[] => {
    const baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`
    return [
      `${baseUrl}/export?format=csv&gid=0`,
      `${baseUrl}/export?format=csv`,
      `${baseUrl}/export?exportFormat=csv&gid=0`,
      `${baseUrl}/export?exportFormat=csv`,
      `${baseUrl}/gviz/tq?tqx=out:csv&sheet=Sheet1`,
      `${baseUrl}/gviz/tq?tqx=out:csv`,
    ]
  }

  const fetchAndProcessSheet = async (url: string): Promise<Contact[]> => {
    const sheetId = extractSheetId(url)
    if (!sheetId) {
      throw new Error("Invalid Google Sheets URL. Please check the URL format.")
    }

    const csvUrls = generateCsvUrls(sheetId)
    let lastError: Error | null = null

    // Try each CSV URL until one works
    for (let i = 0; i < csvUrls.length; i++) {
      const csvUrl = csvUrls[i]
      console.log(`Trying CSV URL ${i + 1}/${csvUrls.length}:`, csvUrl)

      try {
        const response = await fetch(csvUrl)

        if (response.ok) {
          const csvText = await response.text()

          if (csvText.trim() && !csvText.includes("<!DOCTYPE html")) {
            console.log(`Successfully fetched data from URL ${i + 1}`)
            return processCsvData(csvText)
          } else {
            throw new Error("Received HTML instead of CSV data")
          }
        } else {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`
          console.log(`URL ${i + 1} failed:`, errorMessage)
          lastError = new Error(errorMessage)
          continue
        }
      } catch (error) {
        console.log(`URL ${i + 1} failed:`, error)
        lastError = error as Error
        continue
      }
    }

    // If all URLs failed, throw the last error
    throw new Error(`Failed to fetch data from Google Sheets. Last error: ${lastError?.message || "Unknown error"}`)
  }

  const processCsvData = (csvText: string): Contact[] => {
    const lines = csvText.trim().split("\n")
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row")
    }

    // Parse CSV with proper quote handling
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++ // Skip next quote
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }

      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim())
    const contacts: Contact[] = []

    // Find column indices
    const phoneIndex = headers.findIndex(
      (h) => h.includes("phone") || h.includes("mobile") || h.includes("tel") || h.includes("number"),
    )
    const companyIndex = headers.findIndex((h) => h.includes("company") || h.includes("business") || h.includes("name"))
    const categoryIndex = headers.findIndex(
      (h) => h.includes("category") || h.includes("type") || h.includes("industry"),
    )
    const websiteIndex = headers.findIndex((h) => h.includes("website") || h.includes("url") || h.includes("site"))

    if (phoneIndex === -1) {
      throw new Error("No phone number column found. Expected columns: phone, mobile, tel, or number")
    }

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i])

      if (row.length < headers.length) {
        console.warn(`Row ${i + 1} has fewer columns than headers, skipping`)
        continue
      }

      const phoneNumber = row[phoneIndex]?.trim()
      if (!phoneNumber) continue

      const normalized = PhoneService.normalizePhoneNumber(phoneNumber)
      if (!normalized) {
        console.warn(`Invalid phone number in row ${i + 1}: ${phoneNumber}`)
        continue
      }

      const companyName = companyIndex >= 0 ? row[companyIndex]?.trim() : ""
      const companyCategory = categoryIndex >= 0 ? row[categoryIndex]?.trim() : ""
      let website = websiteIndex >= 0 ? row[websiteIndex]?.trim() : ""

      // Process website URL
      if (website && !website.startsWith("http")) {
        website = `https://${website}`
      }

      // Collect dynamic data from other columns
      const dynamicData: Record<string, any> = {}
      headers.forEach((header, index) => {
        if (index !== phoneIndex && index !== companyIndex && index !== categoryIndex && index !== websiteIndex) {
          const value = row[index]?.trim()
          if (value) {
            const cleanHeader = header.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
            dynamicData[cleanHeader] = value
          }
        }
      })

      const contact: Contact = {
        id: `import-${Date.now()}-${i}`,
        original: phoneNumber,
        normalized,
        companyName: companyName || "Unknown Company",
        companyCategory: companyCategory || "Uncategorized",
        website: website || "",
        hasWebsite: !!website,
        whatsappLink: "",
        status: "pending" as const,
        source: "google_sheets",
        lastUpdated: new Date().toISOString(),
        dynamicData: Object.keys(dynamicData).length > 0 ? dynamicData : undefined,
      }

      contacts.push(contact)
    }

    if (contacts.length === 0) {
      throw new Error("No valid contacts found in the sheet")
    }

    return contacts
  }

  const handleImport = async () => {
    if (!sheetUrl.trim()) {
      setImportError("Please enter a Google Sheets URL")
      return
    }

    setIsImporting(true)
    setImportError("")
    setImportStats(null)

    try {
      const contacts = await fetchAndProcessSheet(sheetUrl)

      const stats: ImportStats = {
        total: contacts.length,
        successful: contacts.length,
        duplicates: 0,
        errors: 0,
      }

      setImportStats(stats)
      setLastImportUrl(sheetUrl)
      onImportContacts(contacts)
      onShowToast(`Successfully imported ${contacts.length} contacts from Google Sheets`, "success")
    } catch (error) {
      console.error("Import error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setImportError(`Error processing Google Sheet: ${errorMessage}`)
      onShowToast("Failed to import from Google Sheets", "error")
    } finally {
      setIsImporting(false)
    }
  }

  const handleUpdate = async () => {
    if (!lastImportUrl) return

    const originalUrl = sheetUrl
    setSheetUrl(lastImportUrl)
    await handleImport()
    setSheetUrl(originalUrl)
  }

  const copyExampleUrl = async () => {
    try {
      await navigator.clipboard.writeText(exampleUrl)
      onShowToast("Example URL copied to clipboard", "success")
    } catch (error) {
      console.error("Failed to copy:", error)
      onShowToast("Failed to copy URL", "error")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileSpreadsheet className="h-6 w-6" />
            Google Sheets Import
          </CardTitle>
          <CardDescription className="text-blue-600">
            Import contacts directly from a public Google Sheets document
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="import" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import Data</TabsTrigger>
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <div className="space-y-4">
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
                        setImportError("")
                      }}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleImport}
                      disabled={isImporting || !sheetUrl.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Make sure your Google Sheet is publicly accessible (Anyone with the link can view)
                  </p>
                </div>

                {lastImportUrl && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Last import successful</span>
                    </div>
                    <Button
                      onClick={handleUpdate}
                      disabled={isImporting}
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                  </div>
                )}

                {importError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{importError}</AlertDescription>
                  </Alert>
                )}

                {importStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{importStats.total}</div>
                      <div className="text-xs text-gray-600">Total Rows</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importStats.successful}</div>
                      <div className="text-xs text-gray-600">Imported</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{importStats.duplicates}</div>
                      <div className="text-xs text-gray-600">Duplicates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importStats.errors}</div>
                      <div className="text-xs text-gray-600">Errors</div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Try with Example Sheet</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1">Example Google Sheet:</p>
                        <p className="text-sm font-mono text-gray-800 truncate">{exampleUrl}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={copyExampleUrl}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 bg-transparent"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setSheetUrl(exampleUrl)}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          Use Example
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Setup Instructions</h3>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Prepare Your Google Sheet</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Create a Google Sheet with the following columns (case-insensitive):
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <Badge variant="outline" className="justify-start">
                            <Phone className="h-3 w-3 mr-1" />
                            Phone/Mobile/Tel
                          </Badge>
                          <Badge variant="outline" className="justify-start">
                            <Building className="h-3 w-3 mr-1" />
                            Company/Business
                          </Badge>
                          <Badge variant="outline" className="justify-start">
                            <Tag className="h-3 w-3 mr-1" />
                            Category/Type
                          </Badge>
                          <Badge variant="outline" className="justify-start">
                            <Globe className="h-3 w-3 mr-1" />
                            Website/URL
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Make Sheet Public</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Click "Share" → "Change to anyone with the link" → "Viewer"
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Copy the URL</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Copy the full Google Sheets URL from your browser's address bar
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Import Data</h4>
                        <p className="text-sm text-gray-600 mt-1">Paste the URL in the import tab and click "Import"</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Troubleshooting
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex gap-2">
                      <span className="text-red-600">•</span>
                      <span>
                        <strong>400 Error:</strong> Make sure the sheet is publicly accessible
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-red-600">•</span>
                      <span>
                        <strong>403 Error:</strong> Check sharing permissions (Anyone with link can view)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-red-600">•</span>
                      <span>
                        <strong>No data found:</strong> Ensure you have a header row and at least one data row
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-red-600">•</span>
                      <span>
                        <strong>Phone column missing:</strong> Include a column with "phone", "mobile", "tel", or
                        "number" in the header
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Add custom columns for personalized messaging (e.g., Contact Person, Location)</li>
                    <li>• Use consistent phone number formats (Saudi numbers: 05XXXXXXXX or +966XXXXXXXXX)</li>
                    <li>• Include website URLs for better business targeting</li>
                    <li>• Use the "Update" button to refresh data from the same sheet</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
