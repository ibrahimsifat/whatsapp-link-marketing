"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  MessageCircle,
  Building,
  Globe,
  Phone,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Tag,
  FileText,
} from "lucide-react"
import type { Contact } from "../types/contact"

interface ContactCardProps {
  contact: Contact
  index: number
  isSelected: boolean
  onToggleSelect: () => void
  onUpdate: (contact: Contact) => void
  onDelete: () => void
  onShowToast: (message: string, type?: "success" | "error") => void
}

export function ContactCard({
  contact,
  index,
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
  onShowToast,
}: ContactCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContact, setEditedContact] = useState<Contact>(contact)

  const handleOpenChat = async () => {
    try {
      // Update contact status to "sent" when opening WhatsApp
      const updatedContact = {
        ...contact,
        status: "sent" as const,
        sentAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }

      onUpdate(updatedContact)

      // Open WhatsApp link
      window.open(contact.whatsappLink, "_blank")

      onShowToast("WhatsApp chat opened and status updated to sent", "success")
    } catch (error) {
      console.error("Error opening chat:", error)
      onShowToast("Failed to update contact status", "error")
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(contact.whatsappLink)
      onShowToast("WhatsApp link copied to clipboard", "success")
    } catch (error) {
      console.error("Failed to copy link:", error)
      onShowToast("Failed to copy link", "error")
    }
  }

  const handleSaveEdit = () => {
    onUpdate(editedContact)
    setIsEditing(false)
    onShowToast("Contact updated successfully", "success")
  }

  const handleCancelEdit = () => {
    setEditedContact(contact)
    setIsEditing(false)
  }

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

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${isSelected ? "ring-2 ring-blue-500 bg-blue-50/30" : ""}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Selection Checkbox */}
          <div className="flex items-center pt-1">
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="h-4 w-4" />
          </div>

          {/* Contact Number */}
          <div className="flex-shrink-0 w-8 sm:w-10 text-center">
            <span className="text-xs sm:text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {index + 1}
            </span>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Building className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                  {contact.companyName || "Unknown Company"}
                </h3>
                {contact.companyCategory && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    <Tag className="h-3 w-3 mr-1" />
                    {contact.companyCategory}
                  </Badge>
                )}
              </div>
              <Badge className={`${getStatusColor(contact.status)} text-xs flex-shrink-0`}>
                {getStatusIcon(contact.status)}
                <span className="ml-1 capitalize">{contact.status.replace("_", " ")}</span>
              </Badge>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700 font-mono text-xs sm:text-sm">{contact.original}</span>
              </div>
              {contact.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate text-xs sm:text-sm"
                  >
                    {contact.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>

            {/* Dynamic Data */}
            {contact.dynamicData && Object.keys(contact.dynamicData).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(contact.dynamicData).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 text-xs">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamps */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              {contact.sentAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Sent: {new Date(contact.sentAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Updated: {new Date(contact.lastUpdated).toLocaleString()}</span>
              </div>
            </div>

            {/* Notes */}
            {contact.notes && (
              <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                <FileText className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button
              onClick={handleOpenChat}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Open Chat</span>
              <span className="sm:hidden">Chat</span>
            </Button>

            <Button onClick={handleCopyLink} variant="outline" size="sm" className="px-3 py-1.5 text-xs bg-transparent">
              <Copy className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Copy Link</span>
              <span className="sm:hidden">Copy</span>
            </Button>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="px-3 py-1.5 text-xs bg-transparent">
                  <Edit className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-base">Edit Contact</DialogTitle>
                  <DialogDescription className="text-sm">Update the contact information below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      value={editedContact.companyName || ""}
                      onChange={(e) => setEditedContact({ ...editedContact, companyName: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCategory" className="text-sm font-medium">
                      Category
                    </Label>
                    <Input
                      id="companyCategory"
                      value={editedContact.companyCategory || ""}
                      onChange={(e) => setEditedContact({ ...editedContact, companyCategory: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium">
                      Website
                    </Label>
                    <Input
                      id="website"
                      value={editedContact.website || ""}
                      onChange={(e) => setEditedContact({ ...editedContact, website: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={editedContact.notes || ""}
                      onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveEdit} className="flex-1 text-sm">
                      Save Changes
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline" className="flex-1 text-sm bg-transparent">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 px-3 py-1.5 text-xs bg-transparent"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Del</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base">Delete Contact</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    Are you sure you want to delete this contact? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                    Delete Contact
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
