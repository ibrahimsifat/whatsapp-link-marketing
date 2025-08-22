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
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-slate-100 cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-slate-800 text-xl">Custom Message Editor</CardTitle>
              <CardDescription className="text-slate-600">
                {isExpanded
                  ? `Create personalized messages with variables: {companyName}, {companyCategory}, {website}`
                  : `Message: "${customMessage.slice(0, 50)}${customMessage.length > 50 ? "..." : ""}" • Click to expand editor`}
              </CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-8 space-y-6">
          <div className="text-slate-600 text-sm mb-4">
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
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
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
