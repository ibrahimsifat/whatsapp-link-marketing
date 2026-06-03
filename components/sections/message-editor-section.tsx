"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react"
import { RichTextEditor } from "@/app/components/rich-text-editor"

interface MessageEditorSectionProps {
  isExpanded: boolean
  onToggle: () => void
  customMessage: string
  onCustomMessageChange: (value: string) => void
  availableCustomVariables: string[]
  contactsCount: number
  onUpdateWhatsAppLinks: () => void
}

export function MessageEditorSection({
  isExpanded,
  onToggle,
  customMessage,
  onCustomMessageChange,
  availableCustomVariables,
  contactsCount,
  onUpdateWhatsAppLinks,
}: MessageEditorSectionProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader
        className="bg-white rounded-t-lg border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors p-4 sm:p-5"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-slate-800 text-lg sm:text-xl">Custom Message Editor</CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm break-words">
                {isExpanded
                  ? `Create personalized messages with variables: {companyName}, {companyCategory}, {website}`
                  : `Message: "${customMessage.slice(0, 50)}${customMessage.length > 50 ? "..." : ""}" • Click to expand editor`}
              </CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-500 flex-shrink-0 mt-1" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0 mt-1" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
          <div className="text-slate-600 text-sm">
            {availableCustomVariables.length > 0 && (
              <span>
                Available variables: {"{companyName}"}, {"{companyCategory}"}, {"{website}"}, and your custom variables:{" "}
                {availableCustomVariables.map((v) => `{${v}}`).join(", ")}
              </span>
            )}
          </div>
          <RichTextEditor
            value={customMessage}
            onChange={onCustomMessageChange}
            placeholder="Type your message here... Use {companyName}, {companyCategory}, {website} for personalization"
          />
          {contactsCount > 0 && (
            <button
              onClick={onUpdateWhatsAppLinks}
              className="inline-flex w-full sm:w-auto items-center justify-center px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md transition-colors"
            >
              <Send className="h-5 w-5 mr-2" />
              Update WhatsApp Links
            </button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
