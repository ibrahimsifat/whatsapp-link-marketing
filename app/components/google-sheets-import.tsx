"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Globe,
  Share2,
  Settings,
} from "lucide-react"
import type { Contact } from "../types/contact"
import { PhoneService } from "../services/phone-service"
import { WhatsAppService } from "../services/whatsapp-service"

interface GoogleSheetsImportProps {
  onImportContacts: (contacts: Contact[]) => void
  onShowToast: (message: string, type?: "success" | "error") => void
}

export function GoogleSheetsImport({ onImportContacts, onShowToast }: GoogleSheetsImportProps) {
  const [sheetsUrl, setSheetsUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastImportInfo, setLastImportInfo] = useState<{
    count: number
    timestamp: string
    url: string
  } | null>(null)

  const validateGoogleSheetsUrl = (url: string): boolean => {
    const patterns = [
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
    ]
    return patterns.some((pattern) => pattern.test(url))
  }

  const convertToCSVUrl = (url: string): string => {
    // Extract the spreadsheet ID from various Google Sheets URL formats
    let spreadsheetId = ""

    const docMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)

    if (docMatch) {
      spreadsheetId = docMatch[1]
    } else if (driveMatch) {
      spreadsheetId = driveMatch[1]
    }

    if (!spreadsheetId) {
      throw new Error("Could not extract spreadsheet ID from URL")
    }

    // Convert to CSV export URL
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`
  }

  const fetchAndProcessSheet = async (csvUrl: string): Promise<Contact[]> => {
    try {
      const response = await fetch(csvUrl)

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Access denied. Please make sure the Google Sheet is publicly accessible (Anyone with the link can view).",
          )
        }
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }

      const csvText = await response.text()

      if (!csvText.trim()) {
        throw new Error("The Google Sheet appears to be empty")
      }

      // Parse CSV data
      const lines = csvText.split("\n").filter((line) => line.trim())
      const data = lines.map((line) => {
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

      // Process the data using FileService logic
      const processedContacts: Contact[] = []
      const seenNumbers = new Set<string>()

      if (data.length < 2) {
        throw new Error("Sheet should contain at least a header row and one data row")
      }

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
        } else if (headerStr.trim()) {
          dynamicDataCols.push({ name: String(header), index })
        }
      })

      data.slice(1).forEach((row, rowIndex) => {
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
          if (!website.includes(".") || website.length < 8) {
            website = ""
          }
        }

        if (phoneNumber) {
          const normalized = PhoneService.normalizePhoneNumber(phoneNumber)
          if (normalized && !seenNumbers.has(normalized)) {
            seenNumbers.add(normalized)

            const hasWebsite = Boolean(website)
            if (!companyCategory && !hasWebsite) {
              companyCategory = "No Website"
            }

            const contact: Contact = {
              id: `contact_${normalized.replace(/[^\d]/g, "")}_${Date.now()}_${rowIndex}`,
              original: phoneNumber,
              normalized,
              whatsappLink: WhatsAppService.generateWhatsAppLink(normalized),
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

      return processedContacts
    } catch (error) {
      console.error("Error processing Google Sheet:", error)
      throw error
    }
  }

  const handleImport = async () => {
    if (!sheetsUrl.trim()) {
      setError("Please enter a Google Sheets URL")
      return
    }

    if (!validateGoogleSheetsUrl(sheetsUrl)) {
      setError("Please enter a valid Google Sheets URL")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const csvUrl = convertToCSVUrl(sheetsUrl)
      const contacts = await fetchAndProcessSheet(csvUrl)

      if (contacts.length === 0) {
        setError("No valid contacts found in the Google Sheet")
        return
      }

      onImportContacts(contacts)
      setLastImportInfo({
        count: contacts.length,
        timestamp: new Date().toLocaleString(),
        url: sheetsUrl,
      })

      onShowToast(`Successfully imported ${contacts.length} contacts from Google Sheets`, "success")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to import from Google Sheets"
      setError(errorMessage)
      onShowToast(errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateFromSheet = async () => {
    if (!lastImportInfo) return
    setSheetsUrl(lastImportInfo.url)
    await handleImport()
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg sm:text-xl">
          <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6" />
          Google Sheets Import
        </CardTitle>
        <CardDescription className="text-emerald-600 text-xs sm:text-sm">
          Import contacts directly from a public Google Sheets document
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Import Data
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Setup Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            {/* Import Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheets-url" className="text-sm font-medium">
                  Google Sheets URL
                </Label>
                <Input
                  id="sheets-url"
                  type="url"
                  value={sheetsUrl}
                  onChange={(e) => {
                    setSheetsUrl(e.target.value)
                    setError("")
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit..."
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">Paste the shareable link of your Google Sheets document</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleImport}
                  disabled={isLoading || !sheetsUrl.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import from Sheets
                    </>
                  )}
                </Button>

                {lastImportInfo && (
                  <Button
                    onClick={handleUpdateFromSheet}
                    disabled={isLoading}
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update from Sheet
                  </Button>
                )}
              </div>
            </div>

            {/* Last Import Info */}
            {lastImportInfo && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="space-y-1">
                    <p>
                      <strong>Last import:</strong> {lastImportInfo.count} contacts on {lastImportInfo.timestamp}
                    </p>
                    <p className="text-xs text-gray-600 break-all">
                      <strong>Source:</strong> {lastImportInfo.url}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Expected Format */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p className="font-medium">Expected columns in your Google Sheet:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                      <p>Phone Number</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        Optional
                      </Badge>
                      <p>Company Name, Category, Website</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Any additional columns will be imported as custom variables for templates.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            {/* Setup Instructions */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">How to Set Up Your Google Sheet</h3>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Create or Open Your Google Sheet</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Open Google Sheets and create a new spreadsheet or use an existing one with your contact data.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Set Up Your Columns</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Make sure your first row contains headers. Include at least a phone number column.
                      </p>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-gray-700 mb-2">Recommended column headers:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>• Phone Number</div>
                          <div>• Company Name</div>
                          <div>• Company Category</div>
                          <div>• Website</div>
                          <div>• Contact Person</div>
                          <div>• Any custom fields</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Make Your Sheet Public</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Click the "Share" button in the top-right corner of your Google Sheet.
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Share2 className="h-4 w-4 text-blue-500" />
                          <span>Click "Change to anyone with the link"</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-green-500" />
                          <span>Set permission to "Viewer"</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Copy the Share Link</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Copy the shareable link and paste it in the import form above.
                      </p>
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> The link should look like:
                          <br />
                          <code className="text-xs bg-yellow-100 px-1 rounded">
                            https://docs.google.com/spreadsheets/d/[ID]/edit...
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Data */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Sample Data Format</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left border-r">Phone Number</th>
                        <th className="px-3 py-2 text-left border-r">Company Name</th>
                        <th className="px-3 py-2 text-left border-r">Company Category</th>
                        <th className="px-3 py-2 text-left">Website</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-3 py-2 border-r">0551234567</td>
                        <td className="px-3 py-2 border-r">Tech Solutions</td>
                        <td className="px-3 py-2 border-r">Technology</td>
                        <td className="px-3 py-2">https://example.com</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-3 py-2 border-r">+966559876543</td>
                        <td className="px-3 py-2 border-r">Local Restaurant</td>
                        <td className="px-3 py-2 border-r">Food & Beverage</td>
                        <td className="px-3 py-2">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Troubleshooting</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex gap-2">
                    <span className="text-red-500">•</span>
                    <span>
                      <strong>Access denied error:</strong> Make sure your sheet is set to "Anyone with the link can
                      view"
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-500">•</span>
                    <span>
                      <strong>No data found:</strong> Check that your sheet has a header row and at least one data row
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-500">•</span>
                    <span>
                      <strong>Invalid phone numbers:</strong> Ensure phone numbers are in Saudi format (05xxxxxxxx or
                      +9665xxxxxxxx)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
