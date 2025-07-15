"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building,
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
} from "lucide-react"
import type { Contact } from "../types/contact"

interface ContactCardProps {
  contact: Contact
  index: number
  copiedIndex: number | null
  onCopyToClipboard: (text: string, index: number) => void
  onOpenWhatsApp: (contact: Contact) => void
  onUpdateStatus: (contact: Contact) => void
  onDeleteContact: (contactId: string) => void
  formatPhoneDisplay: (phone: string) => string
}

export function ContactCard({
  contact,
  index,
  copiedIndex,
  onCopyToClipboard,
  onOpenWhatsApp,
  onUpdateStatus,
  onDeleteContact,
  formatPhoneDisplay,
}: ContactCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

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
      // Open WhatsApp
      onOpenWhatsApp(contact)

      // Auto-update status to sent after a short delay (simulating user action)
      setTimeout(() => {
        if (contact.status === "pending") {
          onUpdateStatus(contact)
        }
      }, 1000)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50/30 relative">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with Status */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
              #{String(index + 1).padStart(3, "0")}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(contact.status)}>
                {getStatusIcon(contact.status)}
                <span className="ml-1 capitalize">{contact.status.replace("_", " ")}</span>
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onUpdateStatus(contact)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteContact(contact.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Website Status Badge */}
          <div className="flex gap-1">
            {contact.hasWebsite ? (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <Globe className="h-3 w-3 mr-1" />
                Website
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                No Website
              </Badge>
            )}
          </div>

          {/* Company Info */}
          {contact.companyName && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company</p>
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                <Building className="h-4 w-4 text-blue-600" />
                <p className="font-semibold text-blue-700">{contact.companyName}</p>
              </div>
            </div>
          )}

          {contact.companyCategory && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</p>
              <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                <Tag className="h-4 w-4 text-purple-600" />
                <p className="text-purple-700">{contact.companyCategory}</p>
              </div>
            </div>
          )}

          {contact.website && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</p>
              <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 text-sm truncate">{contact.website.replace("https://", "")}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(contact.website, "_blank")}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <ExternalLink className="h-3 w-3 text-green-600" />
                </Button>
              </div>
            </div>
          )}

          {/* Dynamic Data / Custom Variables */}
          {contact.dynamicData && Object.keys(contact.dynamicData).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Additional Info</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(contact.dynamicData).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <p className="font-semibold text-gray-700 text-sm capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </p>
                    <p className="text-sm text-gray-600 truncate">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phone Numbers */}
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <p className="font-mono text-sm text-gray-700">{formatPhoneDisplay(contact.normalized)}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopyToClipboard(contact.normalized, index * 2 + 1)}
                  className="h-6 w-6 p-0"
                >
                  {copiedIndex === index * 2 + 1 ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tracking Info */}
          {(contact.sentAt || contact.notes) && (
            <div className="space-y-2">
              {contact.sentAt && (
                <div className="text-xs text-gray-500">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Sent: {new Date(contact.sentAt).toLocaleString()}
                </div>
              )}
              {contact.notes && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Notes:</strong> {contact.notes}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleWhatsAppClick}
              disabled={isUpdating}
              className={`w-full shadow-md hover:shadow-lg transition-all duration-200 ${
                contact.status === "sent" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
              } text-white`}
              size="lg"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isUpdating ? "Opening..." : contact.status === "sent" ? "Open Again" : "Send WhatsApp"}
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => onCopyToClipboard(contact.whatsappLink, index * 1000)}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {copiedIndex === index * 1000 ? (
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

              {contact.status === "pending" && (
                <Button
                  variant="outline"
                  onClick={() => onUpdateStatus(contact)}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              )}
            </div>
          </div>

          {/* Source Info */}
          <div className="text-xs text-gray-400 border-t pt-2">
            Source: {contact.source} • Updated: {new Date(contact.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
