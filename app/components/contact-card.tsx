"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Globe,
  Tag,
  MessageCircle,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Calendar,
  User,
  Sparkles,
} from "lucide-react"
import type { Contact } from "../types/contact"

interface ContactCardProps {
  contact: Contact
  index: number
  isSelected?: boolean
  onToggleSelect?: () => void
  onUpdate: (contact: Contact) => void
  onDelete: () => void
  onShowToast: (message: string, type: "success" | "error") => void
}

export function ContactCard({
  contact,
  index,
  isSelected = false,
  onToggleSelect,
  onUpdate,
  onDelete,
  onShowToast,
}: ContactCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const getStatusColor = (status: Contact["status"]) => {
    switch (status) {
      case "sent":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "not_sent":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-amber-50 text-amber-700 border-amber-200"
    }
  }

  const getStatusIcon = (status: Contact["status"]) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4" />
      case "not_sent":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleWhatsAppClick = async () => {
    setIsUpdating(true)
    try {
      window.open(contact.whatsappLink, "_blank")

      // Auto-update status to sent after opening
      setTimeout(() => {
        if (contact.status === "pending") {
          onUpdate({ ...contact, status: "sent", sentAt: new Date().toISOString() })
        }
      }, 1000)
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      onShowToast("Copied to clipboard!", "success")
    } catch (error) {
      onShowToast("Failed to copy to clipboard", "error")
    }
  }

  const formatPhoneDisplay = (phone: string) => {
    if (phone.startsWith("+966")) {
      return phone.replace("+966", "+966 ").replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3")
    }
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
  }

  return (
    <Card
      className={`group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white/90 backdrop-blur-sm ${
        contact.hasWebsite
          ? "bg-gradient-to-r from-white via-emerald-50/30 to-white"
          : "bg-gradient-to-r from-white via-orange-50/30 to-white"
      } ${isSelected ? "ring-2 ring-blue-500 ring-opacity-50 shadow-xl" : ""}`}
    >
      <CardContent className="p-0">
        {/* Enhanced Horizontal Layout */}
        <div className="flex items-center gap-6 p-6">
          {/* Selection Checkbox */}
          {onToggleSelect && (
            <div className="flex-shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                className="h-5 w-5 border-2 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-blue-600"
              />
            </div>
          )}

          {/* Enhanced Contact Number Badge */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm px-4 py-2 shadow-md">
                #{String(index + 1).padStart(3, "0")}
              </Badge>
              {contact.hasWebsite && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Enhanced Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Company Info */}
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate text-xl mb-2">
                    {contact.companyName || "Unknown Company"}
                  </h3>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs border-slate-300 bg-slate-50">
                      <Tag className="h-3 w-3 mr-1" />
                      {contact.companyCategory || "Uncategorized"}
                    </Badge>
                    {contact.hasWebsite ? (
                      <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200 text-xs shadow-sm">
                        <Globe className="h-3 w-3 mr-1" />
                        Website Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 text-xs">
                        No Website
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(contact.status)} shadow-sm`}>
                  {getStatusIcon(contact.status)}
                  <span className="ml-2 capitalize text-xs font-medium">{contact.status.replace("_", " ")}</span>
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                    <DropdownMenuItem
                      onClick={() => onUpdate({ ...contact, status: contact.status === "sent" ? "pending" : "sent" })}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Toggle Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Enhanced Contact Details Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Phone */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Phone</p>
                  <p className="font-mono text-sm text-slate-900 truncate font-semibold">
                    {formatPhoneDisplay(contact.normalized)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(contact.normalized, "phone")}
                  className="h-8 w-8 p-0 flex-shrink-0 hover:bg-blue-100"
                >
                  {copiedField === "phone" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>

              {/* Website */}
              {contact.website && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Globe className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Website</p>
                    <p className="text-sm text-emerald-700 truncate font-semibold">
                      {contact.website.replace("https://", "")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(contact.website, "_blank")}
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-emerald-100"
                  >
                    <ExternalLink className="h-4 w-4 text-emerald-600" />
                  </Button>
                </div>
              )}

              {/* Source & Date */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-600 uppercase tracking-wide font-medium">Source</p>
                  <p className="text-sm text-purple-700 capitalize font-semibold">
                    {contact.source?.replace("_", " ") || "Unknown"}
                  </p>
                  <p className="text-xs text-purple-500">{new Date(contact.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Dynamic Data */}
            {contact.dynamicData && Object.keys(contact.dynamicData).length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(contact.dynamicData)
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200"
                    >
                      <div className="p-1 bg-indigo-100 rounded">
                        <User className="h-3 w-3 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-indigo-600 font-medium capitalize truncate">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-xs text-slate-700 truncate font-semibold">{String(value)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Tracking Info */}
            {contact.sentAt && (
              <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                <Clock className="h-3 w-3" />
                <span className="font-medium">Sent:</span> {new Date(contact.sentAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex-shrink-0 flex flex-col gap-3">
            <Button
              onClick={handleWhatsAppClick}
              disabled={isUpdating}
              className={`${
                contact.status === "sent"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              } text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-6`}
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isUpdating ? "Opening..." : contact.status === "sent" ? "Open Again" : "Send WhatsApp"}
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(contact.whatsappLink, "link")}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm hover:shadow-md transition-all duration-200 h-10 px-4"
              size="sm"
            >
              {copiedField === "link" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
