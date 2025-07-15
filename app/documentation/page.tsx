"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  BookOpen,
  Upload,
  MessageSquare,
  Building,
  Globe,
  Users,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Target,
  Zap,
  FileSpreadsheet,
  Smartphone,
  Copy,
  ExternalLink,
  Play,
  Settings,
  BarChart3,
  Filter,
  Edit,
  Tag,
  Clock,
  TrendingUp,
  MessageCircle,
  Key,
  Phone,
} from "lucide-react"

export default function Documentation() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.open("/", "_self")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">WhatsApp Link Generator</h1>
                  <p className="text-gray-600">Complete User Documentation</p>
                </div>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 px-3 py-1">v1.1.0</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <nav className="space-y-1">
                  {[
                    { id: "overview", title: "Overview", icon: BookOpen },
                    { id: "getting-started", title: "Getting Started", icon: Play },
                    { id: "excel-setup", title: "Excel File Setup", icon: FileSpreadsheet },
                    { id: "upload-process", title: "Upload Process", icon: Upload },
                    { id: "manual-entry", title: "Manual Number Entry", icon: Phone }, // New section
                    { id: "templates", title: "Message Templates", icon: MessageSquare },
                    { id: "personalization", title: "Personalization", icon: Edit },
                    { id: "filtering", title: "Filtering & Analytics", icon: Filter },
                    { id: "whatsapp-integration", title: "WhatsApp Integration", icon: Smartphone },
                    { id: "best-practices", title: "Best Practices", icon: Target },
                    { id: "troubleshooting", title: "Troubleshooting", icon: Settings },
                    { id: "tips", title: "Pro Tips", icon: Lightbulb },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-gray-500" />
                        {item.title}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Overview */}
            <section id="overview">
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <BookOpen className="h-6 w-6" />
                    Product Overview
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Transform your business communication with automated WhatsApp messaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">What it does:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Processes Excel files with business contact data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Validates and normalizes Saudi phone numbers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Creates personalized WhatsApp messages</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Generates ready-to-use WhatsApp links</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Allows manual number entry for quick links</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Key Benefits:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span>Save 90% of manual messaging time</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Target className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Increase response rates with personalization</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Scale your outreach to hundreds of contacts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Professional business communication</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Getting Started */}
            <section id="getting-started">
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Play className="h-6 w-6" />
                    Getting Started
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Quick start guide to begin using the WhatsApp Link Generator
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-white font-bold text-lg">1</span>
                          </div>
                          <h3 className="font-semibold mb-2">Prepare Excel File</h3>
                          <p className="text-sm text-gray-600">Set up your Excel with required columns</p>
                        </CardContent>
                      </Card>
                      <Card className="border-2 border-green-200 bg-green-50">
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-white font-bold text-lg">2</span>
                          </div>
                          <h3 className="font-semibold mb-2">Upload & Process</h3>
                          <p className="text-sm text-gray-600">Upload file and let the system process</p>
                        </CardContent>
                      </Card>
                      <Card className="border-2 border-purple-200 bg-purple-50">
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-white font-bold text-lg">3</span>
                          </div>
                          <h3 className="font-semibold mb-2">Send Messages</h3>
                          <p className="text-sm text-gray-600">Use generated links to send WhatsApp messages</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-yellow-800">Before You Start</h4>
                          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                            <li>• Ensure you have WhatsApp Business installed on your device</li>
                            <li>• Prepare your Excel file with business contact information</li>
                            <li>• Have your message templates ready</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Excel File Setup */}
            <section id="excel-setup">
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <FileSpreadsheet className="h-6 w-6" />
                    Excel File Setup
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    How to structure your Excel file for optimal results
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Required Columns</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-green-800 mb-2">✅ Required Columns</h4>
                          <ul className="space-y-1 text-sm">
                            <li>
                              • <strong>Phone Number</strong> (any column name with "phone", "mobile", "number")
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">📈 Optional Columns (Recommended)</h4>
                          <ul className="space-y-1 text-sm">
                            <li>
                              • <strong>Company Name</strong> (for personalization)
                            </li>
                            <li>
                              • <strong>Company Category</strong> (for targeting)
                            </li>
                            <li>
                              • <strong>Website</strong> (for smart categorization)
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Column Header Examples</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <h4 className="font-semibold mb-2">Phone Number:</h4>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Phone</li>
                            <li>• Mobile</li>
                            <li>• Phone Number</li>
                            <li>• Contact</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Company Name:</h4>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Company Name</li>
                            <li>• Business Name</li>
                            <li>• Company</li>
                            <li>• Organization</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Category:</h4>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Category</li>
                            <li>• Industry</li>
                            <li>• Business Type</li>
                            <li>• Sector</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Website:</h4>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Website</li>
                            <li>• URL</li>
                            <li>• Site</li>
                            <li>• Web Address</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Phone Number Formats</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-green-800 mb-2">✅ Supported Formats</h4>
                          <ul className="space-y-1 text-sm font-mono">
                            <li>• 0558845503</li>
                            <li>• 05 58 84 55 03</li>
                            <li>• +966558845503</li>
                            <li>• 966558845503</li>
                            <li>• 5 5884 5503</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-red-800 mb-2">❌ Invalid Formats</h4>
                          <ul className="space-y-1 text-sm font-mono">
                            <li>• 1234567890 (not Saudi)</li>
                            <li>• 0123456789 (wrong prefix)</li>
                            <li>• +1234567890 (wrong country)</li>
                            <li>• abc123def456 (contains letters)</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Pro Tip: Excel Best Practices</h4>
                        <ul className="mt-2 space-y-1 text-sm text-blue-700">
                          <li>• Keep headers in the first row</li>
                          <li>• Avoid merged cells</li>
                          <li>• Format phone numbers as text (not numbers)</li>
                          <li>• Remove empty rows between data</li>
                          <li>• Save as .xlsx format for best compatibility</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Upload Process */}
            <section id="upload-process">
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Upload className="h-6 w-6" />
                    Upload Process
                  </CardTitle>
                  <CardDescription className="text-purple-700">
                    Step-by-step guide to uploading and processing your Excel file
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Enter Password</h3>
                        <p className="text-gray-600">
                          Before uploading, enter the correct password to unlock the upload feature.
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                          <Key className="h-4 w-4 text-gray-600" />
                          <span className="font-mono text-sm text-gray-700">Password: Pass123123</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Choose Upload Method</h3>
                        <p className="text-gray-600">You have two options to upload your Excel file:</p>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="font-medium">Drag & Drop</h4>
                            <p className="text-sm text-gray-600">Simply drag your Excel file onto the upload area</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="font-medium">File Picker</h4>
                            <p className="text-sm text-gray-600">Click "Choose File" to browse and select your file</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">File Processing</h3>
                        <p className="text-gray-600">The system will automatically:</p>
                        <ul className="space-y-1 text-sm text-gray-600 ml-4">
                          <li>• Detect column headers</li>
                          <li>• Extract phone numbers from all columns</li>
                          <li>• Validate and normalize phone numbers</li>
                          <li>• Extract company information</li>
                          <li>• Categorize companies by website status</li>
                          <li>• Remove duplicates</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">4</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Review Results</h3>
                        <p className="text-gray-600">After processing, you'll see:</p>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <h4 className="font-medium text-green-800">Statistics Dashboard</h4>
                            <p className="text-sm text-green-600">Total contacts, website status, categories</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-blue-800">Contact Cards</h4>
                            <p className="text-sm text-blue-600">Individual cards for each valid contact</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-green-800">What Happens During Processing</h4>
                        <ul className="mt-2 space-y-1 text-sm text-green-700">
                          <li>• Invalid phone numbers are automatically filtered out</li>
                          <li>• Duplicate numbers are removed</li>
                          <li>• Website URLs are cleaned and validated</li>
                          <li>• Companies without websites get "No Website" category</li>
                          <li>• All phone numbers are normalized to +966 format</li>
                          <li>• Maximum file size is 10MB</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Manual Number Entry */}
            <section id="manual-entry">
              <Card>
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2 text-cyan-900">
                    <Phone className="h-6 w-6" />
                    Manual Number Entry
                  </CardTitle>
                  <CardDescription className="text-cyan-700">
                    Quickly generate a WhatsApp link for a single phone number
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">How to Use:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Enter a Saudi phone number in the input field.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>(Optional) Use the "Custom Message Editor" to add a message.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Click "Generate Link" to get your WhatsApp link.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Use the "Open WhatsApp" or "Copy Link" buttons.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Note:</h4>
                        <p className="mt-2 text-sm text-blue-700">
                          This feature is for single number generation and does not save contacts to your database. For
                          bulk operations and tracking, use the Excel upload.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Message Templates */}
            <section id="templates">
              <Card>
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <MessageSquare className="h-6 w-6" />
                    Message Templates
                  </CardTitle>
                  <CardDescription className="text-indigo-700">
                    Create and manage professional message templates with smart variables
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Pre-built Templates</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-green-600" />
                            <h4 className="font-semibold text-green-800">With Website Template</h4>
                          </div>
                          <p className="text-sm text-green-700 mb-2">For companies that have websites</p>
                          <div className="bg-white p-2 rounded text-xs font-mono">
                            Hello *{"{companyName}"}*! I visited your website at {"{website}"} and I'm impressed!
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="h-4 w-4 text-orange-600" />
                            <h4 className="font-semibold text-orange-800">No Website Template</h4>
                          </div>
                          <p className="text-sm text-orange-700 mb-2">For companies without websites</p>
                          <div className="bg-white p-2 rounded text-xs font-mono">
                            Hello *{"{companyName}"}*! In today's digital world, having an online presence is crucial...
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Available Variables</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4 text-center">
                          <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <h4 className="font-semibold text-blue-800">{"{companyName}"}</h4>
                          <p className="text-sm text-blue-600">Company or business name</p>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4 text-center">
                          <Tag className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <h4 className="font-semibold text-purple-800">{"{companyCategory}"}</h4>
                          <p className="text-sm text-purple-600">Industry or business category</p>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4 text-center">
                          <Globe className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <h4 className="font-semibold text-green-800">{"{website}"}</h4>
                          <p className="text-sm text-green-600">Company website URL</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Creating Custom Templates</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Click "New Template"</h4>
                          <p className="text-sm text-gray-600">Start creating a new message template</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Fill Template Details</h4>
                          <p className="text-sm text-gray-600">Name, category, target audience, and message content</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Use Variables</h4>
                          <p className="text-sm text-gray-600">
                            Insert {"{companyName}"}, {"{companyCategory}"}, {"{website}"} for personalization
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">4</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Save and Use</h4>
                          <p className="text-sm text-gray-600">Save template and apply to your contact list</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Template Best Practices</h4>
                        <ul className="mt-2 space-y-1 text-sm text-blue-700">
                          <li>• Keep messages concise and professional</li>
                          <li>• Always include a clear call-to-action</li>
                          <li>• Use variables to personalize each message</li>
                          <li>• Test templates with preview before sending</li>
                          <li>• Create different templates for different audiences</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Personalization */}
            <section id="personalization">
              <Card>
                <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                  <CardTitle className="flex items-center gap-2 text-pink-900">
                    <Edit className="h-6 w-6" />
                    Message Personalization
                  </CardTitle>
                  <CardDescription className="text-pink-700">
                    How the system personalizes messages for each contact
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Automatic Variable Replacement</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Example Transformation:</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Template:</p>
                          <div className="bg-white p-3 rounded border font-mono text-sm">
                            Hello *{"{companyName}"}*! I see you're in the _{"{companyCategory}"}_ industry. I visited
                            your website at {"{website}"} and I'm impressed!
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">↓</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Personalized Message:</p>
                          <div className="bg-green-50 p-3 rounded border font-mono text-sm">
                            Hello *ABC Technology*! I see you're in the _Software Development_ industry. I visited your
                            website at https://abctech.com and I'm impressed!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Smart Fallbacks</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">No Company Name</h4>
                          <p className="text-sm text-blue-600 mb-2">Falls back to:</p>
                          <div className="bg-white p-2 rounded text-xs font-mono">"there"</div>
                          <p className="text-xs text-blue-500 mt-1">Hello there! instead of Hello {"{companyName}"}!</p>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">No Category</h4>
                          <p className="text-sm text-purple-600 mb-2">Falls back to:</p>
                          <div className="bg-white p-2 rounded text-xs font-mono">"your industry"</div>
                          <p className="text-xs text-purple-500 mt-1">
                            in your industry instead of in {"{companyCategory}"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-green-800 mb-2">No Website</h4>
                          <p className="text-sm text-green-600 mb-2">Falls back to:</p>
                          <div className="bg-white p-2 rounded text-xs font-mono">""</div>
                          <p className="text-xs text-green-500 mt-1">Variable is removed from message</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">WhatsApp Formatting</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Supported WhatsApp Formatting:</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <code className="bg-white px-2 py-1 rounded">*text*</code>
                            <span className="text-sm">
                              → <strong>Bold text</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <code className="bg-white px-2 py-1 rounded">_text_</code>
                            <span className="text-sm">
                              → <em>Italic text</em>
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <code className="bg-white px-2 py-1 rounded">~text~</code>
                            <span className="text-sm">
                              → <del>Strikethrough</del>
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <code className="bg-white px-2 py-1 rounded">\`\`\`text\`\`\`</code>
                            <span className="text-sm">
                              → <code>Monospace</code>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Filtering & Analytics */}
            <section id="filtering">
              <Card>
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <CardTitle className="flex items-center gap-2 text-teal-900">
                    <BarChart3 className="h-6 w-6" />
                    Filtering & Analytics
                  </CardTitle>
                  <CardDescription className="text-teal-700">
                    Analyze your contacts and filter for targeted messaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Business Overview Dashboard</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4 text-center">
                          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">150</div>
                          <div className="text-sm text-blue-500">Total Contacts</div>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4 text-center">
                          <Globe className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">89</div>
                          <div className="text-sm text-green-500">With Website</div>
                        </CardContent>
                      </Card>
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4 text-center">
                          <Building className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-orange-600">61</div>
                          <div className="text-sm text-orange-500">No Website</div>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4 text-center">
                          <Tag className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">12</div>
                          <div className="text-sm text-purple-500">Categories</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Filtering Options</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-indigo-200 bg-indigo-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Filter className="h-5 w-5 text-indigo-600" />
                            <h4 className="font-semibold text-indigo-800">Filter by Category</h4>
                          </div>
                          <ul className="space-y-1 text-sm text-indigo-700">
                            <li>• Technology</li>
                            <li>• Healthcare</li>
                            <li>• Retail</li>
                            <li>• Manufacturing</li>
                            <li>• And more...</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Filter by Website Status</h4>
                          </div>
                          <ul className="space-y-1 text-sm text-green-700">
                            <li>• All Contacts</li>
                            <li>• With Website</li>
                            <li>• No Website</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Strategic Use Cases</h3>
                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">Target Companies Without Websites</h4>
                          <p className="text-sm text-blue-700">
                            Filter for "No Website" and use website development templates to offer digital services.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-green-500 bg-green-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-green-800 mb-2">Industry-Specific Campaigns</h4>
                          <p className="text-sm text-green-700">
                            Filter by category (e.g., "Healthcare") and send industry-specific promotional messages.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-purple-500 bg-purple-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">Established Business Outreach</h4>
                          <p className="text-sm text-purple-700">
                            Filter for "With Website" and use partnership or collaboration templates.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* WhatsApp Integration */}
            <section id="whatsapp-integration">
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Smartphone className="h-6 w-6" />
                    WhatsApp Integration
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    How to use generated links with WhatsApp Business
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Using WhatsApp Links</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <ExternalLink className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Open WhatsApp Button</h4>
                          </div>
                          <p className="text-sm text-green-700 mb-2">Directly opens WhatsApp with pre-filled message</p>
                          <ul className="space-y-1 text-xs text-green-600">
                            <li>• Works on mobile and desktop</li>
                            <li>• Message is ready to send</li>
                            <li>• One-click messaging</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Copy className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Copy Link Button</h4>
                          </div>
                          <p className="text-sm text-blue-700 mb-2">Copies the WhatsApp link to clipboard</p>
                          <ul className="space-y-1 text-xs text-blue-600">
                            <li>• Share via email or other apps</li>
                            <li>• Save for later use</li>
                            <li>• Bulk copy for campaigns</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    {/* Add this new block */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-yellow-800">Important Note on Batch Sending:</h4>
                          <p className="mt-2 text-sm text-yellow-700">
                            When using the "Send All Filtered" button, your browser's pop-up blocker might prevent new
                            WhatsApp tabs from opening. Please ensure you **allow pop-ups for this site** in your
                            browser settings to enable this feature.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">WhatsApp Business Setup</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Install WhatsApp Business</h4>
                          <p className="text-sm text-gray-600">
                            Download WhatsApp Business app on your phone or use WhatsApp Web
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Set Up Business Profile</h4>
                          <p className="text-sm text-gray-600">
                            Add your business name, description, and contact information
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Use Generated Links</h4>
                          <p className="text-sm text-gray-600">
                            Click "Open WhatsApp" buttons to start conversations with pre-filled messages
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Best Practices for WhatsApp Business</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-yellow-800 mb-2">✅ Do's</h4>
                          <ul className="space-y-1 text-sm text-yellow-700">
                            <li>• Send messages during business hours</li>
                            <li>• Personalize each message</li>
                            <li>• Be professional and respectful</li>
                            <li>• Respond quickly to replies</li>
                            <li>• Use proper business greeting</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-red-800 mb-2">❌ Don'ts</h4>
                          <ul className="space-y-1 text-sm text-red-700">
                            <li>• Don't send spam messages</li>
                            <li>• Don't message too frequently</li>
                            <li>• Don't use generic templates only</li>
                            <li>• Don't ignore customer responses</li>
                            <li>• Don't send messages late at night</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-green-800">Optimal Messaging Times</h4>
                        <ul className="mt-2 space-y-1 text-sm text-green-700">
                          <li>
                            • <strong>Best times:</strong> 9 AM - 12 PM and 2 PM - 5 PM
                          </li>
                          <li>
                            • <strong>Avoid:</strong> Early morning (before 8 AM) and late evening (after 8 PM)
                          </li>
                          <li>
                            • <strong>Weekends:</strong> Use sparingly, only for urgent matters
                          </li>
                          <li>
                            • <strong>Response time:</strong> Aim to respond within 1-2 hours during business hours
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Best Practices */}
            <section id="best-practices">
              <Card>
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Target className="h-6 w-6" />
                    Best Practices
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    Professional guidelines for effective WhatsApp business communication
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Message Quality Guidelines</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-green-800 mb-3">✅ High-Quality Messages</h4>
                          <ul className="space-y-2 text-sm text-green-700">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>Personalized with company name and details</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>Clear value proposition</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>Professional tone and language</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>Specific call-to-action</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>Relevant to recipient's business</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-red-800 mb-3">❌ Avoid These Mistakes</h4>
                          <ul className="space-y-2 text-sm text-red-700">
                            <li className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>Generic "Dear Sir/Madam" greetings</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>Overly salesy or pushy language</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>Too long messages (over 160 words)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>Spelling and grammar errors</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>Irrelevant or outdated information</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Campaign Strategy</h3>
                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">1. Segment Your Audience</h4>
                          <p className="text-sm text-blue-700">
                            Use filters to create targeted campaigns for different business types, industries, or
                            website status.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-green-500 bg-green-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-green-800 mb-2">2. Test Different Templates</h4>
                          <p className="text-sm text-green-700">
                            Create multiple versions of the same template and test which ones get better response rates
                            for different audiences.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-purple-500 bg-purple-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">3. Follow Up Strategically</h4>
                          <p className="text-sm text-purple-700">
                            Plan follow-up messages for non-responders, but wait at least 3-5 days between messages.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-orange-500 bg-orange-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-orange-800 mb-2">4. Track and Analyze</h4>
                          <p className="text-sm text-orange-700">
                            Keep track of response rates, successful conversions, and adjust your strategy accordingly.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Legal and Compliance</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-yellow-800">Important Compliance Notes</h4>
                          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                            <li>• Always respect opt-out requests immediately</li>
                            <li>• Include your business name and contact information</li>
                            <li>• Follow local regulations for business messaging</li>
                            <li>• Don't send messages to numbers that have blocked you</li>
                            <li>• Maintain professional standards in all communications</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting">
              <Card>
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <Settings className="h-6 w-6" />
                    Troubleshooting
                  </CardTitle>
                  <CardDescription className="text-red-700">Common issues and their solutions</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">File Upload Issues</h3>
                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-red-500 bg-red-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-red-800 mb-2">❌ Incorrect Password</h4>
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Solution:</strong> Ensure you enter the correct password "Pass123123".
                          </p>
                          <ul className="text-xs text-red-600 space-y-1">
                            <li>• Password is case-sensitive.</li>
                            <li>• Double-check for typos.</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-red-500 bg-red-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-red-800 mb-2">❌ "File format not supported"</h4>
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Solution:</strong> Ensure your file is saved as .xlsx or .xls format
                          </p>
                          <ul className="text-xs text-red-600 space-y-1">
                            <li>• Open Excel → File → Save As → Choose Excel Workbook (.xlsx)</li>
                            <li>• Avoid .csv, .txt, or other formats</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-orange-500 bg-orange-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-orange-800 mb-2">⚠️ "No phone numbers found"</h4>
                          <p className="text-sm text-orange-700 mb-2">
                            <strong>Solution:</strong> Check your phone number format and column headers
                          </p>
                          <ul className="text-xs text-orange-600 space-y-1">
                            <li>• Ensure phone numbers start with 05, 5, +966, or 966</li>
                            <li>• Use column headers like "Phone", "Mobile", "Number"</li>
                            <li>• Format cells as text, not numbers</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ "File too large"</h4>
                          <p className="text-sm text-yellow-700 mb-2">
                            <strong>Solution:</strong> Reduce file size or split into smaller files
                          </p>
                          <ul className="text-xs text-yellow-600 space-y-1">
                            <li>• Maximum file size is 10MB</li>
                            <li>• Remove unnecessary columns and rows</li>
                            <li>• Split large datasets into multiple files</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">WhatsApp Link Issues</h3>
                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">❌ "WhatsApp link doesn't work"</h4>
                          <p className="text-sm text-blue-700 mb-2">
                            <strong>Solution:</strong> Check WhatsApp installation and phone number format
                          </p>
                          <ul className="text-xs text-blue-600 space-y-1">
                            <li>• Ensure WhatsApp or WhatsApp Business is installed</li>
                            <li>• Try opening link in different browser</li>
                            <li>• Check if phone number is valid Saudi format</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-green-500 bg-green-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-green-800 mb-2">❌ "Message not pre-filled"</h4>
                          <p className="text-sm text-green-700 mb-2">
                            <strong>Solution:</strong> Update WhatsApp links after changing message
                          </p>
                          <ul className="text-xs text-green-600 space-y-1">
                            <li>• Click "Update WhatsApp Links" button after editing message</li>
                            <li>• Refresh the page if links still show old message</li>
                            <li>• Check if message contains special characters that need encoding</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Template Issues</h3>
                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-purple-500 bg-purple-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">❌ "Variables not replacing"</h4>
                          <p className="text-sm text-purple-700 mb-2">
                            <strong>Solution:</strong> Check variable syntax and data availability
                          </p>
                          <ul className="text-xs text-purple-600 space-y-1">
                            <li>
                              • Use exact syntax: {"{companyName}"}, {"{companyCategory}"}, {"{website}"}
                            </li>
                            <li>• Ensure Excel file contains the required columns</li>
                            <li>• Variables with no data will use fallback values</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Manual Entry Issues</h3>
                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-red-500 bg-red-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-red-800 mb-2">❌ "Invalid phone number"</h4>
                          <p className="text-sm text-red-700 mb-2">
                            <strong>Solution:</strong> Ensure the phone number is a valid Saudi format.
                          </p>
                          <ul className="text-xs text-red-600 space-y-1">
                            <li>• Must start with 05, 5, +9665, or 9665.</li>
                            <li>• Must be 9 digits after the prefix (e.g., 05XXXXXXXX).</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Still Having Issues?</h4>
                        <ul className="mt-2 space-y-1 text-sm text-blue-700">
                          <li>• Clear your browser cache and cookies</li>
                          <li>• Try using a different browser (Chrome recommended)</li>
                          <li>• Check your internet connection</li>
                          <li>• Ensure JavaScript is enabled in your browser</li>
                          <li>• Try refreshing the page and uploading again</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Pro Tips */}
            <section id="tips">
              <Card>
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2 text-violet-900">
                    <Lightbulb className="h-6 w-6" />
                    Pro Tips & Advanced Features
                  </CardTitle>
                  <CardDescription className="text-violet-700">
                    Expert tips to maximize your WhatsApp marketing effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Time-Saving Tips</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Batch Processing</h4>
                          </div>
                          <ul className="space-y-1 text-sm text-green-700">
                            <li>• Process multiple Excel files in sequence</li>
                            <li>• Use keyboard shortcuts (Ctrl+C, Ctrl+V) for quick copying</li>
                            <li>• Keep template library organized by category</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Workflow Optimization</h4>
                          </div>
                          <ul className="space-y-1 text-sm text-blue-700">
                            <li>• Prepare Excel files in advance</li>
                            <li>• Create templates for different scenarios</li>
                            <li>• Use filters to target specific audiences</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Advanced Strategies</h3>
                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-indigo-500 bg-indigo-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-indigo-800 mb-2">🎯 A/B Testing Templates</h4>
                          <p className="text-sm text-indigo-700">
                            Create multiple versions of the same template and test which performs better. Track response
                            rates for each version.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-pink-500 bg-pink-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-pink-800 mb-2">📊 Response Tracking</h4>
                          <p className="text-sm text-pink-700">
                            Keep a spreadsheet to track which contacts responded, conversion rates, and successful
                            follow-ups.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-teal-500 bg-teal-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-teal-800 mb-2">🔄 Follow-up Sequences</h4>
                          <p className="text-sm text-teal-700">
                            Plan 2-3 follow-up messages for non-responders, spaced 3-5 days apart with different value
                            propositions.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Industry-Specific Tips</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-orange-800 mb-2">🏥 Healthcare</h4>
                          <ul className="space-y-1 text-sm text-orange-700">
                            <li>• Focus on patient care improvements</li>
                            <li>• Mention compliance and security</li>
                            <li>• Use professional medical terminology</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">🛒 Retail</h4>
                          <ul className="space-y-1 text-sm text-purple-700">
                            <li>• Emphasize customer experience</li>
                            <li>• Mention inventory management</li>
                            <li>• Focus on sales growth</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-cyan-200 bg-cyan-50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-cyan-800 mb-2">💻 Technology</h4>
                          <ul className="space-y-1 text-sm text-cyan-700">
                            <li>• Highlight innovation and efficiency</li>
                            <li>• Mention scalability solutions</li>
                            <li>• Use technical but accessible language</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 text-lg mb-3">Success Metrics to Track</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-yellow-800 mb-2">Immediate Metrics:</h5>
                            <ul className="space-y-1 text-sm text-yellow-700">
                              <li>• Message delivery rate</li>
                              <li>• Response rate (within 24 hours)</li>
                              <li>• Link click-through rate</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-yellow-800 mb-2">Long-term Metrics:</h5>
                            <ul className="space-y-1 text-sm text-yellow-700">
                              <li>• Conversion to meetings/calls</li>
                              <li>• Actual business generated</li>
                              <li>• Customer lifetime value</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Footer */}
            <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Ready to Get Started?</h2>
                  </div>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Now that you understand how to use the WhatsApp Link Generator effectively, it's time to put this
                    knowledge into practice and transform your business communication.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => window.open("/", "_self")}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Using the App
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => scrollToSection("overview")}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Review Documentation
                    </Button>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Documentation Version 1.1.0 • Last Updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
