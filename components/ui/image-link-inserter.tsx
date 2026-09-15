"use client"

import { useRef, useState } from "react"
import { Image as ImageIcon, Check, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { uploadsApi } from "@/lib/api/client"
import { IMAGE_UPLOAD_CONSTANTS } from "@/app/constants/app-constants"

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
      title="Add an image"
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
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInsertUrl = () => {
    const trimmed = url.trim()
    if (!isHttpUrl(trimmed)) {
      setError("Enter a valid image URL starting with http:// or https://")
      return
    }
    onInsert(trimmed)
    onClose()
  }

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return
    setError("")

    if (!(IMAGE_UPLOAD_CONSTANTS.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setError("Unsupported file type. Use JPEG, PNG, WebP, or GIF.")
      return
    }

    if (file.size > IMAGE_UPLOAD_CONSTANTS.MAX_SIZE) {
      setError(`Image is too large. Maximum size is ${IMAGE_UPLOAD_CONSTANTS.MAX_SIZE / (1024 * 1024)}MB.`)
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadsApi.image(file)
      onInsert(result.url)
      onClose()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_UPLOAD_CONSTANTS.ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-9 flex-1 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100"
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-2 h-3.5 w-3.5" />
          )}
          {isUploading ? "Uploading..." : "Upload an image"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 shrink-0 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-emerald-700/70">
        <div className="h-px flex-1 bg-emerald-200" />
        or paste a link
        <div className="h-px flex-1 bg-emerald-200" />
      </div>

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
              handleInsertUrl()
            }
          }}
          placeholder="https://example.com/photo.jpg"
          className="h-9 flex-1 bg-white text-sm"
        />
        <Button type="button" size="sm" onClick={handleInsertUrl} className="h-9 w-9 shrink-0 bg-emerald-600 p-0 hover:bg-emerald-700">
          <Check className="h-3.5 w-3.5" />
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
            <p className="text-xs text-amber-700">Couldn&apos;t load a preview — it will still be inserted as a link.</p>
          )}
        </div>
      )}

      <p className="text-xs text-emerald-700">
        WhatsApp links can&apos;t attach a file directly, so this adds an image URL to your message. Most WhatsApp clients
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
