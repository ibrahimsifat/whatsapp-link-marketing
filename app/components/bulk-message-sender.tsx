"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
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
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  SkipForward,
  Send,
  Settings,
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
import { validateContacts } from "../services/bulk-message-service"
import { WHATSAPP_CONSTANTS } from "../constants/app-constants"

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

/** One contact queued up to send, with its message already resolved. */
interface QueueItem {
  contact: Contact
  message: string
  language?: string | null
  usedFallback?: boolean
}

const AUTO_ADVANCE_SECONDS_OPTIONS = [15, 30, 40, 60, 90, 120]

function resolveMessageForContact(
  contact: Contact,
  options: { usesLanguageRouting: boolean; selectedGroup: TemplateGroup | null; customMessage: string },
): { message: string; language?: string | null; usedFallback?: boolean } {
  if (options.usesLanguageRouting && options.selectedGroup) {
    const rendered = TemplateService.renderForContact(options.selectedGroup, contact)
    return { message: rendered.message, language: rendered.variant.language, usedFallback: rendered.usedFallback }
  }

  return { message: TemplateService.replaceVariables(options.customMessage, contact) }
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
  const [showLinkSettings, setShowLinkSettings] = useState(false)
  const [queue, setQueue] = useState<QueueItem[] | null>(null)
  const [queueIndex, setQueueIndex] = useState(0)
  const [sentCount, setSentCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(30)
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null)

  // The time the next auto-send is due. Read from `visibilitychange` so a
  // timer that could not fire while this tab was hidden (WhatsApp open in the
  // foreground on a phone) still fires the moment the operator comes back.
  const autoSendAtRef = useRef<number | null>(null)
  const sendInFlightRef = useRef(false)

  // The preference lives in localStorage, which is outside React. Subscribing
  // to it keeps the select in step without a state-setting effect, and yields
  // "auto" during server rendering where there is no device to detect.
  const linkTarget = useSyncExternalStore(
    WhatsAppService.subscribeLinkTarget,
    WhatsAppService.getLinkTarget,
    WhatsAppService.getServerLinkTarget,
  )

  const targetContacts = selectedContacts.length > 0 ? selectedContacts : contacts.filter((contact) => contact.status !== "sent")
  const validation = useMemo(() => validateContacts(targetContacts), [targetContacts])

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
    return resolveMessageForContact(sampleContact, { usesLanguageRouting, selectedGroup, customMessage }).message
  }, [customMessage, targetContacts, validation.valid, usesLanguageRouting, selectedGroup])

  const isSending = queue !== null
  const isDone = isSending && queueIndex >= (queue?.length ?? 0)
  const current = isSending && !isDone ? queue![queueIndex] : null

  const resetSession = () => {
    setQueue(null)
    setQueueIndex(0)
    setSentCount(0)
    setSkippedCount(0)
    setPopupBlocked(false)
    setAutoCountdown(null)
    autoSendAtRef.current = null
    sendInFlightRef.current = false
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) resetSession()
  }

  const handleConfirmStart = () => {
    const builtQueue: QueueItem[] = validation.valid.map((contact) => ({
      contact,
      ...resolveMessageForContact(contact, { usesLanguageRouting, selectedGroup, customMessage }),
    }))

    setQueue(builtQueue)
    setQueueIndex(0)
    setSentCount(0)
    setSkippedCount(0)
    setPopupBlocked(false)
  }

  const advance = () => {
    autoSendAtRef.current = null
    setAutoCountdown(null)
    setQueueIndex((index) => index + 1)
  }

  const handleSendCurrent = async () => {
    if (!current || sendInFlightRef.current) return
    sendInFlightRef.current = true

    try {
      if (!current.message.trim()) {
        onShowToast("This contact has no message to send - skipping", "warning")
        setSkippedCount((count) => count + 1)
        advance()
        return
      }

      if (current.message.length > WHATSAPP_CONSTANTS.MAX_MESSAGE_LENGTH) {
        onShowToast(`Message too long for ${current.contact.companyName || current.contact.normalized} - skipping`, "warning")
        setSkippedCount((count) => count + 1)
        advance()
        return
      }

      try {
        const link = WhatsAppService.generateWhatsAppLink(current.contact.normalized, current.message)
        WhatsAppService.openChat(link)
        setPopupBlocked(false)
      } catch {
        // Pop-up blocked: stay on this contact, turn auto-advance off (further
        // automatic attempts would just be blocked too), and let the operator
        // allow pop-ups and tap Send themselves.
        setPopupBlocked(true)
        setAutoAdvance(false)
        return
      }

      await onContactStatusUpdate(current.contact.id, "sent")
      setSentCount((count) => count + 1)
      advance()
    } finally {
      sendInFlightRef.current = false
    }
  }

  const handleSkipCurrent = () => {
    setSkippedCount((count) => count + 1)
    setPopupBlocked(false)
    advance()
  }

  // Auto-advance: counts down after each contact and sends the next one
  // automatically. WhatsApp opening as its own app backgrounds this tab, and
  // phones throttle timers in a backgrounded tab - so alongside the plain
  // timeout, `visibilitychange` catches the operator coming back and fires
  // immediately if the time is already up, instead of leaving them waiting on
  // a timer that never got to run.
  useEffect(() => {
    if (!isSending || isDone || !autoAdvance || popupBlocked || !current) return

    const dueAt = Date.now() + autoAdvanceSeconds * 1000
    autoSendAtRef.current = dueAt

    const timeout = setTimeout(() => {
      void handleSendCurrent()
    }, autoAdvanceSeconds * 1000)

    const tick = setInterval(() => {
      setAutoCountdown(Math.max(0, Math.ceil((dueAt - Date.now()) / 1000)))
    }, 250)

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && autoSendAtRef.current && Date.now() >= autoSendAtRef.current) {
        clearTimeout(timeout)
        void handleSendCurrent()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearTimeout(timeout)
      clearInterval(tick)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
    // handleSendCurrent is recreated every render, but it always reads the
    // latest `current`/`queueIndex` - re-running this effect on those two is
    // what matters, not the function identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueIndex, isSending, isDone, autoAdvance, autoAdvanceSeconds, popupBlocked])

  const handleFinish = () => {
    onShowToast(`Bulk send finished: ${sentCount} sent, ${skippedCount} skipped`, "success")
    setIsDialogOpen(false)
    resetSession()
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="w-full sm:w-auto justify-center bg-emerald-600 text-white shadow-none hover:bg-emerald-700"
          disabled={targetContacts.length === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          Bulk Send ({targetContacts.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-w-2xl w-[calc(100vw-1rem)] max-h-[92dvh] flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </span>
            WhatsApp Bulk Messenger
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isSending
              ? autoAdvance
                ? "Chats open automatically - tap Send Now or Skip anytime to move faster."
                : "Tap Send to open each chat in WhatsApp, one contact at a time."
              : "Review the message, then go through your contacts one tap at a time."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {!isSending ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryTile label="Ready to send" value={validation.valid.length} icon={<Users className="h-4 w-4" />} />
                <SummaryTile
                  label="Will be skipped"
                  value={validation.invalid.length}
                  tone="danger"
                  icon={<XCircle className="h-4 w-4" />}
                />
              </div>

              <Card className="mt-4">
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
                        {validation.invalid.length} contacts will be skipped because the number is missing, invalid, or
                        duplicated.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkSettings((value) => !value)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="h-4 w-4 text-emerald-600" />
                      Sending options
                    </CardTitle>
                    <span className="text-sm text-emerald-700">{showLinkSettings ? "Hide" : "Edit"}</span>
                  </button>
                </CardHeader>

                {showLinkSettings && (
                  <CardContent className="space-y-3">
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
                        Saved for this device only, so your phone can open the WhatsApp app while your desktop keeps
                        using WhatsApp Web.
                      </p>
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="auto-advance" className="text-sm font-medium">
                          Auto-advance to the next contact
                        </Label>
                        <Switch id="auto-advance" checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                      </div>

                      {autoAdvance && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor="auto-advance-seconds" className="text-xs text-slate-500">
                            Wait
                          </Label>
                          <select
                            id="auto-advance-seconds"
                            value={autoAdvanceSeconds}
                            onChange={(event) => setAutoAdvanceSeconds(Number(event.target.value))}
                            className="h-9 rounded-md border bg-white px-2 text-sm"
                          >
                            {AUTO_ADVANCE_SECONDS_OPTIONS.map((seconds) => (
                              <option key={seconds} value={seconds}>
                                {seconds} seconds
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-slate-500">between each contact</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-500">
                        When on, each chat opens automatically after the wait instead of waiting for you to tap Send.
                        Works best while this tab stays open. If WhatsApp opens as its own app on your phone, the next
                        chat opens the moment you switch back - but your browser may still block it, in which case
                        auto-advance turns off and you just tap Send.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </>
          ) : isDone ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">All done</h3>
              <p className="text-sm text-slate-600">
                {sentCount} sent{skippedCount > 0 ? `, ${skippedCount} skipped` : ""} out of {queue?.length ?? 0} contacts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Contact {queueIndex + 1} of {queue?.length ?? 0}
                  </span>
                  <span>{sentCount} sent{skippedCount > 0 ? ` - ${skippedCount} skipped` : ""}</span>
                </div>
                <Progress value={Math.round((queueIndex / (queue?.length || 1)) * 100)} className="h-2" />
              </div>

              <Card className="border-emerald-200">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {current?.contact.companyName || current?.contact.normalized}
                      </div>
                      <div className="text-sm text-slate-500">{current?.contact.normalized}</div>
                    </div>
                    {current?.language && (
                      <Badge variant="secondary" className="text-[10px]">
                        {languageLabel(current.language)}
                        {current.usedFallback ? " (default)" : ""}
                      </Badge>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto rounded-lg border bg-white p-3 text-sm leading-6 text-slate-800">
                    {current?.message}
                  </div>
                </CardContent>
              </Card>

              {popupBlocked && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    Your browser blocked the WhatsApp pop-up, so auto-advance has been turned off. Allow pop-ups for
                    this site, then tap Send again.
                  </AlertDescription>
                </Alert>
              )}

              {autoAdvance && !popupBlocked && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-emerald-800">
                    <Clock className="h-4 w-4" />
                    {autoCountdown !== null && autoCountdown > 0
                      ? `Sending automatically in ${autoCountdown}s`
                      : "Sending now..."}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setAutoAdvance(false)} className="h-7 text-xs text-emerald-700">
                    Pause auto
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {!isSending && (
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          )}

          {isSending && isDone ? (
            <Button onClick={handleFinish} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:ml-auto sm:w-auto">
              Done
            </Button>
          ) : isSending ? (
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
              <Button variant="outline" onClick={handleSkipCurrent} className="w-full sm:w-auto">
                <SkipForward className="h-4 w-4 mr-2" />
                Skip
              </Button>
              <Button onClick={handleSendCurrent} className="w-full bg-emerald-600 py-6 text-base text-white hover:bg-emerald-700 sm:w-auto sm:py-2 sm:text-sm">
                <Send className="h-4 w-4 mr-2" />
                {autoAdvance ? "Send Now" : "Send & Next"}
              </Button>
            </div>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full bg-emerald-600 text-white shadow-none hover:bg-emerald-700 sm:w-auto"
                  disabled={!customMessage.trim() || validation.valid.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Start Sending ({validation.valid.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Start bulk sending?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You&apos;ll go through {validation.valid.length} contacts one at a time. Each tap on Send opens that
                    contact&apos;s WhatsApp chat with the message ready - you send it from there.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmStart} className="bg-emerald-600 hover:bg-emerald-700">
                    Start
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
}: {
  label: string
  value: number | string
  icon: ReactNode
  tone?: "primary" | "danger"
}) {
  const color = tone === "danger" ? "text-red-600 bg-red-50 border-red-100" : "text-emerald-700 bg-emerald-50 border-emerald-100"

  return (
    <div className={`rounded-lg border ${color} p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-normal opacity-80">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold leading-none">{value}</div>
    </div>
  )
}
