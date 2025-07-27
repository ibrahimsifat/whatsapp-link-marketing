"use client"

import WhatsAppEditor from "./whatsapp-editor"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  variables?: string[]
  showVariables?: boolean
  onSave?: (template: { name: string; content: string; category: string }) => void
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Type your message...",
  variables = [],
  showVariables = true,
  onSave,
}: RichTextEditorProps) {
  return (
    <WhatsAppEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variables={variables}
      showVariables={showVariables}
      onSave={onSave}
    />
  )
}
