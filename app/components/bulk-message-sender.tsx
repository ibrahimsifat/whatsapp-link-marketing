"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Send,
  Play,
  Pause,
  StopCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  MessageSquare,
  Settings,
  Eye,
  Zap,
} from "lucide-react"
import {
  BulkMessageService,
  type BulkMessageOptions,
  type BulkMessageResult,
  type BulkMessageProgress,
} from "../services/bulk-message-service"
import type { Contact, MessageTemplate } from "../types/contact"

interface BulkMessageSenderProps {
  contacts: Contact[]
  selectedContacts: Contact[]
  templates: MessageTemplate[]
  selectedTemplate: MessageTemplate | null
  customMessage: string
  onContactStatusUpdate: (contactId: string, status: Contact["status"]) => void
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
  const [isOpen, setIsOpen] = useState(false)
  const [progress, setProgress] = useState<BulkMessageProgress | null>(null)
  const [results, setResults] = useState<BulkMessageResult | null>(null)
  const [delayMs, setDelayMs] = useState(3000)
  const [useSelectedContacts, setUseSelectedContacts] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Get contacts to send to
  const targetContacts = useSelectedContacts ? selectedContacts : contacts
  const validationResult = BulkMessageService.validateContacts(targetContacts)

  // Update progress periodically when sending
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (BulkMessageService.isCurrentlyRunning()) {
      interval = setInterval(() => {
        setProgress(BulkMessageService.getProgress())
      }, 500)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [progress?.isRunning])

  const handleStartBulkSend = () => {
    if (validationResult.valid.length === 0) {
      onShowToast("No valid contacts to send messages to", "error")
      return
    }

    const message = selectedTemplate?.content || customMessage
    if (!message.trim()) {
      onShowToast("Please enter a message or select a template", "error")
      return
    }

    const options: BulkMessageOptions = {
      contacts: validationResult.valid,
      message,
      template: selectedTemplate || undefined,
      delayMs,
      onProgress: (current, total, contact) => {
        setProgress(BulkMessageService.getProgress())
      },
      onComplete: (result) => {
        setResults(result)
        setProgress(null)
        onShowToast(
          `Bulk sending completed! ${result.successful} successful, ${result.failed} failed`,
          result.failed === 0 ? "success" : "warning",
        )
      },
      onContactProcessed: (contact, success, error) => {
        if (success) {
          onContactStatusUpdate(contact.id, "sent")
        } else {
          onContactStatusUpdate(contact.id, "not_sent")
        }
      },
      onError: (error) => {
        onShowToast(`Bulk sending error: ${error}`, "error")
      },
    }

    BulkMessageService.startBulkSend(options)
    setProgress(BulkMessageService.getProgress())
    onShowToast("Bulk message sending started!", "info")
  }

  const handlePauseBulkSend = () => {
    BulkMessageService.pauseBulkSend()
    setProgress(BulkMessageService.getProgress())
    onShowToast("Bulk sending paused", "info")
  }

  const handleResumeBulkSend = () => {
    BulkMessageService.resumeBulkSend()
    setProgress(BulkMessageService.getProgress())
    onShowToast("Bulk sending resumed", "info")
  }

  const handleStopBulkSend = () => {
    BulkMessageService.stopBulkSend()
    setProgress(null)
    onShowToast("Bulk sending stopped", "info")
  }

  const generatePreview = () => {
    const message = selectedTemplate?.content || customMessage
    return BulkMessageService.generatePreview(targetContacts, message, selectedTemplate || undefined)
  }

  const estimatedTime = BulkMessageService.estimateTotalTime(validationResult.valid.length, delayMs)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={targetContacts.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Bulk Send Messages ({targetContacts.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              Bulk Message Sender
            </DialogTitle>
            <DialogDescription>Send personalized WhatsApp messages to multiple contacts at once</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contact Selection */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Target Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={useSelectedContacts}
                      onChange={() => setUseSelectedContacts(true)}
                      className="w-4 h-4"
                    />
                    <span>Selected Contacts ({selectedContacts.length})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useSelectedContacts}
                      onChange={() => setUseSelectedContacts(false)}
                      className="w-4 h-4"
                    />
                    <span>All Contacts ({contacts.length})</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{targetContacts.length}</div>
                    <div className="text-sm text-blue-600">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{validationResult.valid.length}</div>
                    <div className="text-sm text-green-600">Valid</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{validationResult.invalid.length}</div>
                    <div className="text-sm text-red-600">Invalid</div>
                  </div>
                </div>

                {validationResult.invalid.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Invalid Contacts</span>
                    </div>
                    <div className="text-sm text-yellow-700">
                      {validationResult.invalid.length} contacts will be skipped due to validation errors.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Configuration */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Message Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate ? (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-700">Template</Badge>
                      <span className="font-medium">{selectedTemplate.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedTemplate.content}</div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-700">Custom Message</Badge>
                    </div>
                    <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                      {customMessage || "No message configured"}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    disabled={!customMessage && !selectedTemplate}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Messages
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Section */}
            {progress && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5" />
                    Sending Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Progress: {progress.current} of {progress.total}
                      </span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                  </div>

                  {progress.currentContact && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium">Currently sending to:</div>
                      <div className="text-sm text-gray-600">
                        {progress.currentContact.companyName || progress.currentContact.normalized}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Estimated time remaining:{" "}
                      {BulkMessageService.formatEstimatedTime(progress.estimatedTimeRemaining)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {progress.isPaused ? (
                      <Button onClick={handleResumeBulkSend} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    ) : (
                      <Button onClick={handlePauseBulkSend} variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button onClick={handleStopBulkSend} variant="destructive">
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {results && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Sending Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{results.successful}</div>
                      <div className="text-sm text-green-600">Successful</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                      <div className="text-sm text-red-600">Failed</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {BulkMessageService.formatEstimatedTime(results.duration)}
                      </div>
                      <div className="text-sm text-blue-600">Duration</div>
                    </div>
                  </div>

                  {results.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">Errors</span>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {results.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700">
                            {error.contact.companyName || error.contact.normalized}: {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {!progress && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      disabled={validationResult.valid.length === 0 || (!customMessage && !selectedTemplate)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Start Bulk Send ({validationResult.valid.length} contacts)
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Bulk Message Send</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send personalized WhatsApp messages to {validationResult.valid.length} contacts. Each
                        message will open in a new tab with a {delayMs / 1000} second delay between messages.
                        <br />
                        <br />
                        <strong>Estimated time:</strong> {BulkMessageService.formatEstimatedTime(estimatedTime)}
                        <br />
                        <strong>Please ensure your browser allows pop-ups for this site.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleStartBulkSend}>Start Sending</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
            <DialogDescription>Preview of personalized messages for the first 5 contacts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {generatePreview().map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="font-medium text-sm mb-2">{item.contact.companyName || item.contact.normalized}</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{item.preview}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Send Settings</DialogTitle>
            <DialogDescription>Configure bulk message sending parameters</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delay">Delay between messages (seconds)</Label>
              <Input
                id="delay"
                type="number"
                min="1"
                max="60"
                value={delayMs / 1000}
                onChange={(e) => setDelayMs(Number.parseInt(e.target.value) * 1000)}
              />
              <div className="text-xs text-gray-500">Recommended: 3-5 seconds to avoid being flagged as spam</div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowSettings(false)}>Save Settings</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
