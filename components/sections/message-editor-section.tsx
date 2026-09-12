"use client"

import { MessageCircle, Send } from "lucide-react"
import { RichTextEditor } from "@/app/components/rich-text-editor"
import { SectionCard } from "@/components/ui/section-card"

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
    <SectionCard
      icon={MessageCircle}
      title="Custom Message Editor"
      description={
        isExpanded
          ? `Create personalized messages with variables: {companyName}, {companyCategory}, {website}, {city}, {language}`
          : `Message: "${customMessage.slice(0, 50)}${customMessage.length > 50 ? "..." : ""}" • Click to expand editor`
      }
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-3 sm:space-y-4">
        <div className="text-slate-600 text-sm">
          {availableCustomVariables.length > 0 && (
            <span>
              Available variables: {"{companyName}"}, {"{companyCategory}"}, {"{website}"}, {"{city}"}, {"{language}"}, and your custom variables:{" "}
              {availableCustomVariables.map((v) => `{${v}}`).join(", ")}
            </span>
          )}
        </div>
        <RichTextEditor
          value={customMessage}
          onChange={onCustomMessageChange}
          placeholder="Type your message here... Use {companyName}, {companyCategory}, {website}, {city}, {language} for personalization"
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
      </div>
    </SectionCard>
  )
}
