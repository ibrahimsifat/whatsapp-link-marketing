"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageCircle,
  Pause,
  Play,
  Send,
  Settings,
  Shield,
  Square,
  Users,
  XCircle,
} from "lucide-react"
import type { Contact, MessageTemplate } from "../types/contact"
import type { TemplateGroup } from "../types/template-group"
import { isLanguageRoutingActive, summariseLanguageCoverage } from "../types/template-group"
import { TemplateService } from "../services/template-service"
import { languageLabel } from "@/lib/i18n/languages"
import {
  WhatsAppService,
  LINK_TARGET_OPTIONS,
  type WhatsAppLinkTarget,
} from "../services/whatsapp-service"
import {
  EnhancedBulkMessageService,
  type BulkMessageProgress,
  type BulkMessageSettings,
  type MessageResolver,
} from "../services/enhanced-bulk-message-service"

interface BulkMessageSenderProps {
  contacts: Contact[]
  selectedContacts: Contact[]
  templates: MessageTemplate[]
  selectedTemplate: MessageTemplate | null
  /**
   * The multilingual template in play, if one is selected. Its presence is
   * what switches the run from "one message for everyone" to "each contact
   * gets their own language".
   */
  selectedGroup: TemplateGroup | null
  customMessage: string
  onContactStatusUpdate: (contactId: string, status: Contact["status"]) => Promise<{ success: boolean; message?: string }>
  onShowToast: (message: string, type: "success" | "error" | "warning" | "info") => void
}

export function BulkMessageSender({
  contacts,
  selectedContacts,
  selectedTemplate,
  selectedGroup,
  customMessage,
  onContactStatusUpdate,
  onShowToast,
}: BulkMessageSenderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [progress, setProgress] = useState<BulkMessageProgress | null>(null)
  const [settings, setSettings] = useState<BulkMessageSettings>(EnhancedBulkMessageService.getSettings())
  // The preference lives in localStorage, which is outside React. Subscribing
  // to it keeps the select in step without a state-setting effect, and yields
  // "auto" during server rendering where there is no device to detect.
  const linkTarget = useSyncExternalStore(
    WhatsAppService.subscribeLinkTarget,
    WhatsAppService.getLinkTarget,
    WhatsAppService.getServerLinkTarget,
  )

  const targetContacts = selectedContacts.length > 0 ? selectedContacts : contacts.filter((contact) => contact.status !== "sent")
  const validation = EnhancedBulkMessageService.validateContacts(targetContacts)
  const rateLimitStatus = EnhancedBulkMessageService.getRateLimitStatus()
  const businessHoursStatus = EnhancedBulkMessageService.getBusinessHoursStatus()

  const estimatedTime = useMemo(() => {
    const delay = settings.delayBetweenMessages + settings.randomDelayRange / 2
    const batches = Math.max(1, Math.ceil(validation.valid.length / Math.max(1, settings.batchSize)))
    const batchBreaks = Math.max(0, batches - 1) * settings.batchDelayMinutes * 60 * 1000
    return validation.valid.length * delay + batchBreaks
  }, [settings.batchDelayMinutes, settings.batchSize, settings.delayBetweenMessages, settings.randomDelayRange, validation.valid.length])

  /**
   * Whether this run sends one message or one per language.
   *
   * Editing the message by hand is an explicit override: the operator wrote
   * that exact text and every contact gets it. Leaving it as the template left
   * it means the template is still in charge, so each contact is sent their own
   * language version.
   */
  const usesLanguageRouting = isLanguageRoutingActive(selectedGroup, selectedTemplate, customMessage)

  const coverage = useMemo(() => {
    if (!selectedGroup) return []
    return summariseLanguageCoverage(selectedGroup, targetContacts)
  }, [selectedGroup, targetContacts])

  const fallbackContacts = useMemo(
    () => coverage.filter((entry) => !entry.covered).reduce((total, entry) => total + entry.contactCount, 0),
    [coverage],
  )

  const previewMessage = useMemo(() => {
    const sampleContact = validation.valid[0] || targetContacts[0]
    if (!sampleContact || !customMessage.trim()) return ""

    let preview = customMessage
      .replace(/{companyName}/g, sampleContact.companyName || "[Company Name]")
      .replace(/{companyCategory}/g, sampleContact.companyCategory || "[Category]")
      .replace(/{website}/g, sampleContact.website || "[Website]")
      .replace(/{city}/g, sampleContact.city || "[City]")
      .replace(/{language}/g, sampleContact.language || "[Language]")
      .replace(/{phone}/g, sampleContact.normalized || sampleContact.original || "[Phone]")

    if (sampleContact.dynamicData) {
      Object.entries(sampleContact.dynamicData).forEach(([key, value]) => {
        preview = preview.replace(new RegExp(`{${key}}`, "g"), String(value || `[${key}]`))
      })
    }

    return preview
  }, [customMessage, targetContacts, validation.valid])

  const updateSettings = (newSettings: Partial<BulkMessageSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    EnhancedBulkMessageService.updateSettings(updatedSettings)
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.max(1, Math.round(ms / 60000))
    if (minutes < 60) return `${minutes} min`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  const handleStartBulkSend = async () => {
    if (!customMessage.trim()) {
      onShowToast("Please enter a message before sending", "error")
      return
    }

    if (validation.valid.length === 0) {
      onShowToast("No valid contacts available for sending", "error")
      return
    }

    const confirmed = window.confirm(
      `Start bulk sending to ${validation.valid.length} contacts?\n\nEach WhatsApp chat will open and you will manually confirm the send.`,
    )

    if (!confirmed) return

    try {
      // With a template selected and the message untouched, resolve per contact
      // so each company is written to in its own language, with that language's
      // image. Otherwise send the hand-written message to everyone.
      const resolver: MessageResolver | string =
        usesLanguageRouting && selectedGroup
          ? (contact) => {
              const rendered = TemplateService.renderForContact(selectedGroup, contact)
              return {
                message: rendered.message,
                language: rendered.variant.language,
                usedFallback: rendered.usedFallback,
              }
            }
          : customMessage

      const result = await EnhancedBulkMessageService.sendBulkMessages(
        validation.valid,
        resolver,
        settings,
        setProgress,
        async (updatedContact) => {
          await onContactStatusUpdate(updatedContact.id, updatedContact.status)
        },
      )

      const languageBreakdown = Object.entries(result.languageCounts)
        .filter(([language]) => language !== "unknown")
        .map(([language, count]) => `${count} ${languageLabel(language)}`)
        .join(", ")

      const summary = [
        `Bulk messaging finished. Sent: ${result.successful}, Failed: ${result.failed}`,
        languageBreakdown && `By language: ${languageBreakdown}`,
        result.fallbackCount > 0 && `${result.fallbackCount} used the default language version`,
      ]
        .filter(Boolean)
        .join(". ")

      onShowToast(summary, "success")
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Bulk messaging failed", "error")
    } finally {
      setProgress(null)
    }
  }

  /** Pre-send breakdown: who gets which language before anything is sent. */
  const renderLanguagePanel = () => {
    if (!selectedGroup) return null

    return (
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-medium">Language routing</Label>
          <Badge variant={usesLanguageRouting ? "default" : "outline"} className="text-[10px]">
            {usesLanguageRouting ? "On" : "Off - using edited message"}
          </Badge>
        </div>

        {usesLanguageRouting ? (
          <>
            <p className="text-xs text-slate-600">
              Each contact receives the <strong>{selectedGroup.name}</strong> version matching their language.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {coverage.map((entry) => (
                <Badge
                  key={entry.language ?? "none"}
                  variant={entry.covered ? "secondary" : "outline"}
                  className={entry.covered ? "text-[10px]" : "border-amber-300 bg-amber-50 text-[10px] text-amber-800"}
                >
                  {entry.contactCount} {entry.language ? languageLabel(entry.language) : "No language set"}
                  {!entry.covered && " -> default"}
                </Badge>
              ))}
            </div>
            {fallbackContacts > 0 && (
              <p className="text-xs text-amber-700">
                {fallbackContacts} contact{fallbackContacts === 1 ? "" : "s"} have no version in their language and will
                receive the {languageLabel(selectedGroup.fallback.language)} version. Add the missing versions in
                Message Templates to reach them in their own language.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-600">
            You edited the message, so everyone receives that exact text. Re-select the template to send each contact
            their own language version.
          </p>
        )}
      </div>
    )
  }

  const handlePause = () => {
    EnhancedBulkMessageService.pause()
    onShowToast("Bulk messaging paused", "info")
  }

  const handleResume = () => {
    EnhancedBulkMessageService.resume()
    onShowToast("Bulk messaging resumed", "info")
  }

  const handleStop = () => {
    EnhancedBulkMessageService.stop()
    setProgress(null)
    onShowToast("Bulk messaging stopped", "info")
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full sm:w-auto justify-center bg-emerald-600 text-white shadow-none hover:bg-emerald-700"
          disabled={targetContacts.length === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          Bulk Send ({targetContacts.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl w-[calc(100vw-1rem)] max-h-[92dvh] overflow-hidden p-0">
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </span>
            WhatsApp Bulk Messenger
          </DialogTitle>
          <DialogDescription className="text-sm">
            Review contacts, preview the message, adjust timing, then open WhatsApp chats one by one.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92dvh-158px)] overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile label="Ready" value={validation.valid.length} icon={<Users className="h-4 w-4" />} />
            <SummaryTile label="Skipped" value={validation.invalid.length} tone="danger" icon={<XCircle className="h-4 w-4" />} />
            <SummaryTile label="Estimated" value={formatDuration(estimatedTime)} icon={<Clock className="h-4 w-4" />} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Message Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-emerald-700">
                    <span>{selectedTemplate ? selectedTemplate.name : "Custom message"}</span>
                    <span>{validation.valid[0]?.companyName || validation.valid[0]?.normalized || "Sample contact"}</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-lg border bg-white p-3 text-sm leading-6 text-slate-800">
                    {previewMessage || "Write a message first to see the preview."}
                  </div>
                </div>

                {renderLanguagePanel()}

                {validation.invalid.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800">
                      {validation.invalid.length} contacts will be skipped because the number is missing, invalid, or duplicated.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sending Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert className="border-emerald-200 bg-emerald-50">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-sm text-emerald-800">
                    Conservative delays and batch pauses help keep sending steady and easier to manage.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Per hour" value={`${rateLimitStatus.messagesThisHour}/${rateLimitStatus.maxMessagesPerHour}`} />
                  <InfoRow label="Today" value={`${rateLimitStatus.messagesThisDay}/${rateLimitStatus.maxMessagesPerDay}`} />
                  <InfoRow label="Batch size" value={settings.batchSize} />
                  <InfoRow label="Business hours" value={businessHoursStatus.isWithinHours ? "Now" : "Later"} />
                </div>

                {!businessHoursStatus.isWithinHours && settings.respectBusinessHours && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Outside business hours. Next suggested time: {businessHoursStatus.nextBusinessHour}.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                className="flex w-full items-center justify-between text-left"
              >
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  Simple Settings
                </CardTitle>
                <span className="text-sm text-emerald-700">{showSettings ? "Hide" : "Edit"}</span>
              </button>
            </CardHeader>

            {showSettings && (
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <NumberField
                    id="delay"
                    label="Delay"
                    suffix="sec"
                    min={2}
                    max={30}
                    value={settings.delayBetweenMessages / 1000}
                    onChange={(value) => updateSettings({ delayBetweenMessages: value * 1000 })}
                  />
                  <NumberField
                    id="batch-size"
                    label="Batch size"
                    min={5}
                    max={50}
                    value={settings.batchSize}
                    onChange={(value) => updateSettings({ batchSize: value })}
                  />
                  <NumberField
                    id="batch-delay"
                    label="Batch pause"
                    suffix="min"
                    min={1}
                    max={60}
                    value={settings.batchDelayMinutes}
                    onChange={(value) => updateSettings({ batchDelayMinutes: value })}
                  />
                  <NumberField
                    id="daily-limit"
                    label="Daily limit"
                    min={50}
                    max={1000}
                    value={settings.maxMessagesPerDay}
                    onChange={(value) => updateSettings({ maxMessagesPerDay: value })}
                  />
                </div>

                <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3">
                  <Label htmlFor="link-target" className="text-sm font-medium">
                    Open chats in
                  </Label>
                  <select
                    id="link-target"
                    value={linkTarget}
                    onChange={(event) => WhatsAppService.setLinkTarget(event.target.value as WhatsAppLinkTarget)}
                    className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                  >
                    {LINK_TARGET_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.hint}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Saved for this device only, so your phone can open the WhatsApp app while your desktop keeps using
                    WhatsApp Web.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <ToggleRow
                    id="business-hours"
                    label="Business hours"
                    checked={settings.respectBusinessHours}
                    onCheckedChange={(checked) => updateSettings({ respectBusinessHours: checked })}
                  />
                  <ToggleRow
                    id="anti-spam"
                    label="Anti-spam mode"
                    checked={settings.enableAntiSpamMode}
                    onCheckedChange={(checked) => updateSettings({ enableAntiSpamMode: checked })}
                  />
                  <ToggleRow
                    id="human-like"
                    label="Human-like timing"
                    checked={settings.humanLikeBehavior}
                    onCheckedChange={(checked) => updateSettings({ humanLikeBehavior: checked })}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {progress ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span>{progress.current} of {progress.total}</span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryTile compact label="Sent" value={progress.sent} icon={<CheckCircle className="h-4 w-4" />} />
                    <SummaryTile compact label="Failed" value={progress.failed} tone="danger" icon={<XCircle className="h-4 w-4" />} />
                    <SummaryTile compact label="Remaining" value={progress.remaining} icon={<Users className="h-4 w-4" />} />
                    <SummaryTile compact label="ETA" value={formatDuration(progress.estimatedTimeRemaining)} icon={<Clock className="h-4 w-4" />} />
                  </div>
                  {progress.currentContact && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      Sending to {progress.currentContact.companyName || progress.currentContact.normalized}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No active sending session.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
            Close
          </Button>

          {progress?.isRunning ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {progress.isPaused ? (
                <Button onClick={handleResume} className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" className="w-full sm:w-auto">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={handleStop} variant="destructive" className="w-full sm:w-auto">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartBulkSend}
              className="w-full bg-emerald-600 text-white shadow-none hover:bg-emerald-700 sm:w-auto"
              disabled={!customMessage.trim() || validation.valid.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Start Sending ({validation.valid.length})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SummaryTile({
  label,
  value,
  icon,
  tone = "primary",
  compact = false,
}: {
  label: string
  value: number | string
  icon: ReactNode
  tone?: "primary" | "danger"
  compact?: boolean
}) {
  const color = tone === "danger" ? "text-red-600 bg-red-50 border-red-100" : "text-emerald-700 bg-emerald-50 border-emerald-100"

  return (
    <div className={`rounded-lg border ${color} ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-normal opacity-80">{label}</span>
        {icon}
      </div>
      <div className={`${compact ? "mt-1 text-lg" : "mt-2 text-2xl"} font-semibold leading-none`}>{value}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-800">{value}</div>
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number.parseInt(event.target.value) || min)}
          className="h-10 text-sm"
        />
        {suffix && <span className="w-8 text-sm text-slate-500">{suffix}</span>}
      </div>
    </div>
  )
}

function ToggleRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-slate-50 p-3">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
