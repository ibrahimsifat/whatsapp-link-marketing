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
        return "bg-green-100 text-green-800 border-green-200"
      case "not_sent":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusIcon = (status: Contact["status"]) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-3 w-3" />
      case "not_sent":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
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
      className={`group hover:shadow-xl transition-all duration-300 border-l-4 ${
        contact.hasWebsite
          ? "border-l-green-500 bg-gradient-to-r from-white to-green-50/30"
          : "border-l-orange-500 bg-gradient-to-r from-white to-orange-50/30"
      } ${isSelected ? "ring-2 ring-blue-500 ring-opacity-50" : ""}`}
    >
      <CardContent className="p-0">
        {/* Horizontal Layout */}
        <div className="flex items-center gap-4 p-4">
          {/* Selection Checkbox */}
          {onToggleSelect && (
            <div className="flex-shrink-0">
              <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="h-5 w-5" />
            </div>
          )}

          {/* Contact Number Badge */}
          <div className="flex-shrink-0">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-bold text-sm px-3 py-1">
              #{String(index + 1).padStart(3, "0")}
            </Badge>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Company Info */}
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-lg">
                    {contact.companyName || "Unknown Company"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {contact.companyCategory || "Uncategorized"}
                    </Badge>
                    {contact.hasWebsite ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Website
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
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(contact.status)}>
                  {getStatusIcon(contact.status)}
                  <span className="ml-1 capitalize text-xs">{contact.status.replace("_", " ")}</span>
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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

            {/* Contact Details Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Phone */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <Phone className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="font-mono text-sm text-gray-900 truncate">{formatPhoneDisplay(contact.normalized)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(contact.normalized, "phone")}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  {copiedField === "phone" ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-400" />
                  )}
                </Button>
              </div>

              {/* Website */}
              {contact.website && (
                <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3">
                  <Globe className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Website</p>
                    <p className="text-sm text-green-700 truncate">{contact.website.replace("https://", "")}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(contact.website, "_blank")}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <ExternalLink className="h-3 w-3 text-green-600" />
                  </Button>
                </div>
              )}

              {/* Source & Date */}
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Source</p>
                  <p className="text-sm text-blue-700 capitalize">{contact.source?.replace("_", " ") || "Unknown"}</p>
                  <p className="text-xs text-gray-500">{new Date(contact.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Dynamic Data */}
            {contact.dynamicData && Object.keys(contact.dynamicData).length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {Object.entries(contact.dynamicData)
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 bg-purple-50 rounded-lg p-2">
                      <User className="h-3 w-3 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-purple-600 font-medium capitalize truncate">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-xs text-gray-700 truncate">{String(value)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Tracking Info */}
            {contact.sentAt && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Sent: {new Date(contact.sentAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <Button
              onClick={handleWhatsAppClick}
              disabled={isUpdating}
              className={`${
                contact.status === "sent" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
              } text-white shadow-md hover:shadow-lg transition-all duration-200`}
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isUpdating ? "Opening..." : contact.status === "sent" ? "Open Again" : "Send WhatsApp"}
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>

            <Button
              variant="outline"
              onClick={() => copyToClipboard(contact.whatsappLink, "link")}
              className="border-green-200 text-green-700 hover:bg-green-50"
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
