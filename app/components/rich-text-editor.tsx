"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Bold, Italic, Strikethrough, Code, Eye, EyeOff, Type } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const formatPreview = (text: string) => {
    return text
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/~([^~]+)~/g, "<del>$1</del>")
      .replace(
        /```([^`]+)```/g,
        '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>',
      )
      .replace(/\n/g, "<br>")
  }

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Bold",
      action: () => insertFormatting("*"),
      shortcut: "Ctrl+B",
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertFormatting("_"),
      shortcut: "Ctrl+I",
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      action: () => insertFormatting("~"),
      shortcut: "Ctrl+Shift+X",
    },
    {
      icon: Code,
      label: "Code",
      action: () => insertFormatting("```"),
      shortcut: "Ctrl+`",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              className="h-8 w-8 p-0 hover:bg-gray-200"
              title={`${button.label} (${button.shortcut})`}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-sm"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {/* Editor/Preview */}
      <div className="min-h-[200px]">
        {showPreview ? (
          <Card className="p-4 min-h-[200px] bg-white">
            <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              WhatsApp Preview:
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: value
                  ? formatPreview(value)
                  : '<span class="text-gray-400">Your formatted message will appear here...</span>',
              }}
            />
          </Card>
        ) : (
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[200px] resize-none font-mono text-sm"
            />

            {/* Formatting Help */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded border">
              <div className="flex items-center gap-1">
                <Type className="h-3 w-3" />
                *bold* _italic_ ~strike~ ```code```
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Templates */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Quick Templates:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Hello! 👋",
            "*Special Offer* 🎉",
            "_Thank you for your interest_",
            "```Contact us for more info```",
            "~Limited time only~",
          ].map((template, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onChange(value + (value ? "\n" : "") + template)}
              className="text-xs h-7"
            >
              {template}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
