"use client"

import { useState } from "react"
import { Image as ImageIcon, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

interface ImageLinkButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export function ImageLinkButton({ isOpen, onClick, className }: ImageLinkButtonProps) {
  return (
    <Button
      type="button"
      variant={isOpen ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      title="Insert image link"
      className={className ?? "h-9 w-9 p-0"}
    >
      <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </Button>
  )
}

interface ImageLinkPanelProps {
  onInsert: (url: string) => void
  onClose: () => void
}

export function ImageLinkPanel({ onInsert, onClose }: ImageLinkPanelProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [previewFailed, setPreviewFailed] = useState(false)

  const handleInsert = () => {
    const trimmed = url.trim()
    if (!isHttpUrl(trimmed)) {
      setError("Enter a valid image URL starting with http:// or https://")
      return
    }
    onInsert(trimmed)
    onClose()
  }

  return (
    <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-center gap-2">
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError("")
            setPreviewFailed(false)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleInsert()
            }
          }}
          placeholder="https://example.com/photo.jpg"
          className="h-9 flex-1 bg-white text-sm"
          autoFocus
        />
        <Button type="button" size="sm" onClick={handleInsert} className="h-9 w-9 shrink-0 bg-emerald-600 p-0 hover:bg-emerald-700">
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 shrink-0 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {url && !error && isHttpUrl(url) && (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Preview"
            className="h-16 w-16 rounded-md border border-emerald-200 bg-white object-cover"
            onError={() => setPreviewFailed(true)}
            onLoad={() => setPreviewFailed(false)}
          />
          {previewFailed && (
            <p className="text-xs text-amber-700">Couldn't load a preview — it will still be inserted as a link.</p>
          )}
        </div>
      )}

      <p className="text-xs text-emerald-700">
        WhatsApp links can't attach a file directly, so this adds the image URL to your message. Most WhatsApp clients
        show a preview thumbnail for it automatically.
      </p>
    </div>
  )
}

interface ImageLinkInserterProps {
  onInsert: (url: string) => void
  triggerClassName?: string
}

/** Uncontrolled convenience wrapper combining the button and panel. */
export function ImageLinkInserter({ onInsert, triggerClassName }: ImageLinkInserterProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return <ImageLinkButton isOpen={false} onClick={() => setIsOpen(true)} className={triggerClassName} />
  }

  return (
    <ImageLinkPanel
      onInsert={(url) => {
        onInsert(url)
        setIsOpen(false)
      }}
      onClose={() => setIsOpen(false)}
    />
  )
}
