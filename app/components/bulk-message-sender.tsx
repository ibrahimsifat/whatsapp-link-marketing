"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Send,
  Pause,
  Play,
  Square,
  Settings,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Shield,
  Timer,
  MessageCircle,
  BarChart3,
  AlertTriangle,
  Zap,
  Eye,
} from "lucide-react"
import type { Contact, MessageTemplate } from "../types/contact"
import {
  EnhancedBulkMessageService,
  type BulkMessageSettings,
  type BulkMessageProgress,
} from "../services/enhanced-bulk-message-service"

interface BulkMessageSenderProps {
  contacts: Contact[]
  selectedContacts: Contact[]
  templates: MessageTemplate[]
  selectedTemplate: MessageTemplate | null
  customMessage: string
  onContactStatusUpdate: (contactId: string, status: Contact["status"]) => Promise<void>
  onShowToast: (message: string, type: "success" | "error" | "warning" | "info") => void
}

export function BulkMessageSender({
  contacts,
  selectedContacts,
  templates,
  selectedTemplate,
  customMessage,
  onContactStatusUpdate,
  onShowToast,
}: BulkMessageSenderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [progress, setProgress] = useState<BulkMessageProgress | null>(null)
  const [settings, setSettings] = useState<BulkMessageSettings>(EnhancedBulkMessageService.getSettings())
  const [previewMessage, setPreviewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const targetContacts = selectedContacts.length > 0 ? selectedContacts : contacts.filter((c) => c.status !== "sent")
  const validation = EnhancedBulkMessageService.validateContacts(targetContacts)
  const rateLimitStatus = EnhancedBulkMessageService.getRateLimitStatus()
  const businessHoursStatus = EnhancedBulkMessageService.getBusinessHoursStatus()

  // Generate preview message
  const generatePreview = useCallback(() => {
    if (targetContacts.length > 0) {
      const sampleContact = targetContacts[0]
      let preview = customMessage
        .replace(/{companyName}/g, sampleContact.companyName || "[Company Name]")
        .replace(/{companyCategory}/g, sampleContact.companyCategory || "[Category]")
        .replace(/{website}/g, sampleContact.website || "[Website]")
        .replace(/{phone}/g, sampleContact.phone || "[Phone]")

      // Replace dynamic data
      if (sampleContact.dynamicData) {
        Object.entries(sampleContact.dynamicData).forEach(([key, value]) => {
          const regex = new RegExp(`{${key}}`, "g")
          preview = preview.replace(regex, String(value || `[${key}]`))
        })
      }

      setPreviewMessage(preview)
    }
  }, [customMessage, targetContacts])

  const handleStartBulkSend = async () => {
    if (!customMessage.trim()) {
      onShowToast("Please enter a message before sending", "error")
      return
    }

    if (validation.valid.length === 0) {
      onShowToast("No valid contacts available for sending", "error")
      return
    }

    // Check business hours and show warning if needed
    let proceedWithSend = true

    if (settings.respectBusinessHours && !businessHoursStatus.isWithinHours) {
      const businessHoursWarning = businessHoursStatus.isWeekend
        ? `⏰ WEEKEND DETECTED\n\nIt's currently ${new Date().toLocaleString()}.\nBusiness hours are ${settings.businessHoursStart}:00 - ${settings.businessHoursEnd}:00 on weekdays.\n\nNext business hours: ${businessHoursStatus.nextBusinessHour}\n\nDo you want to proceed anyway?`
        : `⏰ OUTSIDE BUSINESS HOURS\n\nCurrent time: ${new Date().toLocaleTimeString()}\nBusiness hours: ${settings.businessHoursStart}:00 - ${settings.businessHoursEnd}:00\n\nNext business hours: ${businessHoursStatus.nextBusinessHour}\n\nDo you want to proceed anyway?`

      proceedWithSend = window.confirm(businessHoursWarning)
    }

    if (!proceedWithSend) {
      onShowToast("Bulk sending cancelled - outside business hours", "info")
      return
    }

    // Show comprehensive warning
    const confirmed = window.confirm(
      `⚠️ PROFESSIONAL WHATSAPP BULK MESSAGING ⚠️\n\n` +
        `You are about to send ${validation.valid.length} personalized messages.\n\n` +
        `🛡️ SAFETY FEATURES ACTIVE:\n` +
        `• Smart delays: ${settings.delayBetweenMessages / 1000}s base + randomization\n` +
        `• Rate limiting: Max ${settings.maxMessagesPerHour}/hour, ${settings.maxMessagesPerDay}/day\n` +
        `• Batch processing: ${settings.batchSize} messages per batch\n` +
        `• Business hours: ${settings.respectBusinessHours ? (businessHoursStatus.isWithinHours ? "WITHIN HOURS" : "OVERRIDE ACTIVE") : "DISABLED"}\n` +
        `• Anti-spam mode: ${settings.enableAntiSpamMode ? "ENABLED" : "DISABLED"}\n` +
        `• Human behavior: ${settings.humanLikeBehavior ? "ENABLED" : "DISABLED"}\n\n` +
        `📱 Each message opens in WhatsApp Web - you must manually click 'Send'.\n` +
        `⏱️ Estimated time: ${EnhancedBulkMessageService.formatEstimatedTime(
          EnhancedBulkMessageService.estimateTotalTime(validation.valid.length),
        )}\n\n` +
        `Continue with professional bulk messaging?`,
    )

    if (!confirmed) return

    try {
      await EnhancedBulkMessageService.sendBulkMessages(
        validation.valid,
        customMessage,
        settings,
        (progressUpdate) => {
          setProgress(progressUpdate)
        },
        async (updatedContact) => {
          await onContactStatusUpdate(updatedContact.id, updatedContact.status)
        },
      )

      onShowToast(
        `✅ Bulk messaging completed! Sent: ${progress?.sent || 0}, Failed: ${progress?.failed || 0}`,
        "success",
      )
    } catch (error) {
      console.error("Bulk send error:", error)
      onShowToast("❌ Bulk messaging failed: " + (error instanceof Error ? error.message : "Unknown error"), "error")
    } finally {
      setProgress(null)
    }
  }

  const handlePause = () => {
    EnhancedBulkMessageService.pause()
    onShowToast("⏸️ Bulk messaging paused", "info")
  }

  const handleResume = () => {
    EnhancedBulkMessageService.resume()
    onShowToast("▶️ Bulk messaging resumed", "info")
  }

  const handleStop = () => {
    EnhancedBulkMessageService.stop()
    setProgress(null)
    onShowToast("⏹️ Bulk messaging stopped", "info")
  }

  const updateSettings = (newSettings: Partial<BulkMessageSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    EnhancedBulkMessageService.updateSettings(updatedSettings)
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 1) return "< 1 min"
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={generatePreview}
          className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          disabled={targetContacts.length === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          Professional Bulk Send ({targetContacts.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl">
              <MessageCircle className="h-6 w-6 text-emerald-600" />
            </div>
            Professional WhatsApp Bulk Messenger
          </DialogTitle>
          <DialogDescription className="text-base">
            Enterprise-grade bulk messaging with advanced anti-spam protection and professional timing controls
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh]">
            <TabsContent value="overview" className="space-y-6">
              {/* Safety Status */}
              <Alert className="border-emerald-200 bg-emerald-50">
                <Shield className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  <strong>WhatsApp Safety Protocol Active:</strong> Advanced anti-spam protection, rate limiting, and
                  human-like behavior patterns are enabled to protect your account.
                </AlertDescription>
              </Alert>

              {settings.respectBusinessHours && !businessHoursStatus.isWithinHours && (
                <Alert className="border-orange-200 bg-orange-50">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Outside Business Hours:</strong>{" "}
                    {businessHoursStatus.isWeekend
                      ? "It's currently weekend."
                      : `Current time is ${businessHoursStatus.currentHour}:00.`}{" "}
                    Business hours are {settings.businessHoursStart}:00 - {settings.businessHoursEnd}:00 on weekdays.
                    You can still send messages, but they may be less effective.
                  </AlertDescription>
                </Alert>
              )}

              {/* Rate Limit Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Rate Limit Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {rateLimitStatus.messagesThisHour}/{rateLimitStatus.maxMessagesPerHour}
                      </div>
                      <div className="text-sm text-blue-600">This Hour</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {rateLimitStatus.messagesThisDay}/{rateLimitStatus.maxMessagesPerDay}
                      </div>
                      <div className="text-sm text-purple-600">Today</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{rateLimitStatus.consecutiveMessages}</div>
                      <div className="text-sm text-orange-600">Consecutive</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {businessHoursStatus.isWithinHours ? "✓" : "⚠️"}
                      </div>
                      <div className="text-sm text-green-600">
                        {businessHoursStatus.isWeekend
                          ? "Weekend"
                          : businessHoursStatus.isWithinHours
                            ? "Business Hours"
                            : "After Hours"}
                      </div>
                      {!businessHoursStatus.isWithinHours && settings.respectBusinessHours && (
                        <div className="text-xs text-orange-600 mt-1">Next: {businessHoursStatus.nextBusinessHour}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Contact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{targetContacts.length}</div>
                      <div className="text-sm text-blue-600">Total Selected</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{validation.valid.length}</div>
                      <div className="text-sm text-green-600">Valid Contacts</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{validation.invalid.length}</div>
                      <div className="text-sm text-red-600">Invalid/Skipped</div>
                    </div>
                  </div>

                  {validation.invalid.length > 0 && (
                    <Alert className="mt-4 border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <strong>{validation.invalid.length} contacts will be skipped</strong> due to validation errors
                        (invalid phone numbers, duplicates, or missing data).
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Anti-Spam Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {EnhancedBulkMessageService.getAntiSpamRecommendations(validation.valid.length).map(
                      (recommendation, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{recommendation}</span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timing & Rate Limiting</CardTitle>
                  <CardDescription>Configure delays and limits to avoid being flagged as spam</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="delay">Base Delay Between Messages (seconds)</Label>
                      <Input
                        id="delay"
                        type="number"
                        min="2"
                        max="30"
                        value={settings.delayBetweenMessages / 1000}
                        onChange={(e) =>
                          updateSettings({
                            delayBetweenMessages: Number.parseInt(e.target.value) * 1000,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Recommended: 5-8 seconds for safety</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="randomRange">Random Delay Range (±seconds)</Label>
                      <Input
                        id="randomRange"
                        type="number"
                        min="0"
                        max="10"
                        value={settings.randomDelayRange / 1000}
                        onChange={(e) =>
                          updateSettings({
                            randomDelayRange: Number.parseInt(e.target.value) * 1000,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Adds randomization to appear more human</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxHourly">Max Messages Per Hour</Label>
                      <Input
                        id="maxHourly"
                        type="number"
                        min="10"
                        max="200"
                        value={settings.maxMessagesPerHour}
                        onChange={(e) =>
                          updateSettings({
                            maxMessagesPerHour: Number.parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Conservative limit to avoid rate limiting</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxDaily">Max Messages Per Day</Label>
                      <Input
                        id="maxDaily"
                        type="number"
                        min="50"
                        max="1000"
                        value={settings.maxMessagesPerDay}
                        onChange={(e) =>
                          updateSettings({
                            maxMessagesPerDay: Number.parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Daily safety limit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Batch Processing</CardTitle>
                  <CardDescription>Process messages in batches with cooldown periods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="batchSize">Messages Per Batch</Label>
                      <Input
                        id="batchSize"
                        type="number"
                        min="5"
                        max="50"
                        value={settings.batchSize}
                        onChange={(e) =>
                          updateSettings({
                            batchSize: Number.parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Smaller batches are safer</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batchDelay">Delay Between Batches (minutes)</Label>
                      <Input
                        id="batchDelay"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.batchDelayMinutes}
                        onChange={(e) =>
                          updateSettings({
                            batchDelayMinutes: Number.parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Rest period between batches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety Features</CardTitle>
                  <CardDescription>Advanced protection against spam detection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="business-hours">Respect Business Hours</Label>
                      <p className="text-sm text-gray-500">Only send during business hours</p>
                    </div>
                    <Switch
                      id="business-hours"
                      checked={settings.respectBusinessHours}
                      onCheckedChange={(checked) =>
                        updateSettings({
                          respectBusinessHours: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="anti-spam">Enable Anti-Spam Mode</Label>
                      <p className="text-sm text-gray-500">Advanced spam prevention</p>
                    </div>
                    <Switch
                      id="anti-spam"
                      checked={settings.enableAntiSpamMode}
                      onCheckedChange={(checked) =>
                        updateSettings({
                          enableAntiSpamMode: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="human-behavior">Human-Like Behavior</Label>
                      <p className="text-sm text-gray-500">Simulate human sending patterns</p>
                    </div>
                    <Switch
                      id="human-behavior"
                      checked={settings.humanLikeBehavior}
                      onCheckedChange={(checked) =>
                        updateSettings({
                          humanLikeBehavior: checked,
                        })
                      }
                    />
                  </div>

                  {settings.respectBusinessHours && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-hour">Business Hours Start</Label>
                        <Input
                          id="start-hour"
                          type="number"
                          min="0"
                          max="23"
                          value={settings.businessHoursStart}
                          onChange={(e) =>
                            updateSettings({
                              businessHoursStart: Number.parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-hour">Business Hours End</Label>
                        <Input
                          id="end-hour"
                          type="number"
                          min="0"
                          max="23"
                          value={settings.businessHoursEnd}
                          onChange={(e) =>
                            updateSettings({
                              businessHoursEnd: Number.parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Message Preview</CardTitle>
                  <CardDescription>Preview how your message will appear to recipients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">WhatsApp Message Preview</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 border shadow-sm">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                        {previewMessage || "No message preview available"}
                      </pre>
                    </div>
                  </div>

                  {targetContacts.length > 1 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Sample previews for first 3 contacts:</p>
                      <div className="space-y-2">
                        {targetContacts.slice(0, 3).map((contact, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                            <div className="font-medium text-gray-700 mb-1">{contact.companyName || contact.phone}</div>
                            <div className="text-gray-600 text-xs">
                              {customMessage
                                .replace(/{companyName}/g, contact.companyName || "[Company Name]")
                                .replace(/{companyCategory}/g, contact.companyCategory || "[Category]")
                                .replace(/{website}/g, contact.website || "[Website]")
                                .substring(0, 100)}
                              ...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              {progress ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        Sending Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {progress.current} / {progress.total} ({progress.percentage}%)
                          </span>
                        </div>
                        <Progress value={progress.percentage} className="h-3" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-semibold text-lg">{progress.sent}</span>
                          </div>
                          <div className="text-xs text-green-600">Sent</div>
                        </div>

                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="font-semibold text-lg">{progress.failed}</span>
                          </div>
                          <div className="text-xs text-red-600">Failed</div>
                        </div>

                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-blue-600">
                            <Users className="h-4 w-4" />
                            <span className="font-semibold text-lg">{progress.remaining}</span>
                          </div>
                          <div className="text-xs text-blue-600">Remaining</div>
                        </div>

                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-center gap-1 text-purple-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-semibold text-lg">
                              {formatTime(progress.estimatedTimeRemaining / 60000)}
                            </span>
                          </div>
                          <div className="text-xs text-purple-600">ETA</div>
                        </div>
                      </div>

                      {progress.currentContact && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="font-medium text-blue-800">Currently Processing</span>
                          </div>
                          <div className="text-sm text-blue-700">
                            <div className="font-medium">{progress.currentContact.companyName}</div>
                            <div className="text-xs">{progress.currentContact.phone}</div>
                          </div>
                        </div>
                      )}

                      {progress.nextBatchIn > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-800">Batch Cooldown</span>
                          </div>
                          <div className="text-sm text-orange-700">
                            Next batch in: {Math.ceil(progress.nextBatchIn / 1000)} seconds
                          </div>
                        </div>
                      )}

                      {progress.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-800">Recent Errors ({progress.errors.length})</span>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {progress.errors.slice(-5).map((error, index) => (
                              <div key={index} className="text-xs text-red-600">
                                <span className="font-medium">{error.contact.companyName}:</span> {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active bulk messaging session</p>
                    <p className="text-sm text-gray-400">Start a bulk send to see progress here</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-3">
            {progress?.isRunning ? (
              <>
                {progress.isPaused ? (
                  <Button onClick={handleResume} className="bg-green-600 hover:bg-green-700">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={handlePause} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleStop} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            ) : (
              <Button
                onClick={handleStartBulkSend}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg"
                disabled={!customMessage.trim() || validation.valid.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Start Professional Bulk Send ({validation.valid.length} messages)
              </Button>
            )}
          </div>

          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
