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
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg border-b border-slate-100">
        <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Phone className="h-5 w-5 text-cyan-600" />
          </div>
          Manual Number Entry
        </CardTitle>
        <CardDescription className="text-slate-600">Generate a WhatsApp link for a single phone number</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="space-y-3">
          <Label htmlFor="manual-phone" className="text-sm font-medium text-slate-700">
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
            className={`h-12 text-base ${state.manualPhoneError ? "border-red-300" : "border-slate-200"} bg-white/80`}
          />
          {state.manualPhoneError && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {state.manualPhoneError}
            </p>
          )}
        </div>
        <Button
          onClick={onGenerateLink}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8"
        >
          <Send className="h-5 w-5 mr-2" />
          Generate Link
        </Button>

        {state.manualLink && (
          <div className="space-y-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <Label className="text-sm font-medium text-slate-700">Generated WhatsApp Link</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Input value={state.manualLink} readOnly className="flex-1 text-sm bg-white" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCopyLink}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm"
                >
                  {state.manualLinkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(state.manualLink, "_blank")}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-white shadow-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="ml-2">Open</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">This link uses the current message from the templates section.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
