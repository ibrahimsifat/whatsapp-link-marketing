"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Send, AlertTriangle, Copy, CheckCircle, ExternalLink } from "lucide-react"

interface ManualEntrySectionProps {
  state: {
    manualPhoneNumber: string
    manualPhoneError: string
    manualLink: string
    manualLinkCopied: boolean
  }
  onStateUpdate: (updates: any) => void
  onGenerateLink: () => void
  onCopyLink: () => void
}

export function ManualEntrySection({ state, onStateUpdate, onGenerateLink, onCopyLink }: ManualEntrySectionProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader className="bg-white rounded-t-lg border-b border-slate-200 p-4">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-800 text-lg sm:text-xl">
          <div className="p-1.5 sm:p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </div>
          Manual Number Entry
        </CardTitle>
        <CardDescription className="text-slate-600 text-xs sm:text-sm">Generate a WhatsApp link for a single phone number</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="space-y-2 sm:space-y-3">
          <Label htmlFor="manual-phone" className="text-xs sm:text-sm font-medium text-slate-700">
            Phone Number
          </Label>
          <Input
            id="manual-phone"
            type="tel"
            value={state.manualPhoneNumber}
            onChange={(e) => {
              onStateUpdate({
                manualPhoneNumber: e.target.value,
                manualPhoneError: "",
                manualLink: "",
              })
            }}
            placeholder="e.g., 0551234567 or +966551234567"
            className={`h-10 text-sm ${state.manualPhoneError ? "border-red-300" : "border-slate-200"} bg-white`}
          />
          {state.manualPhoneError && (
            <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1.5 sm:gap-2">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {state.manualPhoneError}
            </p>
          )}
        </div>
        <Button
          onClick={onGenerateLink}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-none transition-colors h-10 px-5 text-sm sm:text-base w-full sm:w-auto"
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
          Generate Link
        </Button>

        {state.manualLink && (
          <div className="space-y-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <Label className="text-xs sm:text-sm font-medium text-slate-700">Generated WhatsApp Link</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Input value={state.manualLink} readOnly className="flex-1 text-xs sm:text-sm bg-white h-9 sm:h-10" />
              <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCopyLink}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-none h-8 sm:h-9 text-[10px] sm:text-xs flex-1 sm:flex-none"
                >
                  {state.manualLinkCopied ? <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  <span className="ml-1 sm:ml-2">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(state.manualLink, "_blank")}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-none h-8 sm:h-9 text-[10px] sm:text-xs flex-1 sm:flex-none"
                >
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="ml-1 sm:ml-2">Open</span>
                </Button>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 break-words">This link uses the current message from the templates section.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
