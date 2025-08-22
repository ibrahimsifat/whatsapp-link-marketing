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
        return <CheckCircle className="h-3 w-3" />
      case "not_sent":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-lg border-0 shadow-md bg-white/90 backdrop-blur-sm ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Selection and Index */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="h-4 w-4" />
            <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-slate-600">{index + 1}</span>
            </div>
          </div>

          {/* Company Info - Primary Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Building className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800 truncate text-sm">
                {contact.companyName || "Unknown Company"}
              </h3>
              {contact.companyCategory && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 border-slate-200">
                  {contact.companyCategory}
                </Badge>
              )}
            </div>

            {/* Contact Details Row */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-slate-400" />
                <span className="font-mono">{contact.original}</span>
              </div>
              {contact.website && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-slate-400" />
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 truncate max-w-32"
                  >
                    {contact.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Data - Compact Display */}
          {contact.dynamicData && Object.keys(contact.dynamicData).length > 0 && (
            <div className="hidden lg:flex flex-col gap-1 text-xs text-slate-600 max-w-48">
              {Object.entries(contact.dynamicData)
                .slice(0, 2)
                .map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1.5 truncate">
                    <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      <span className="font-medium text-slate-700">{key}:</span> {String(value)}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <Badge className={`${getStatusColor(contact.status)} text-xs px-2.5 py-1 font-medium`}>
              {getStatusIcon(contact.status)}
              <span className="ml-1.5 capitalize">{contact.status.replace("_", " ")}</span>
            </Badge>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              onClick={handleOpenChat}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs h-8 shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Chat
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="px-2.5 py-1.5 text-xs h-8 bg-white hover:bg-slate-50 border-slate-200"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2.5 py-1.5 text-xs h-8 bg-white hover:bg-slate-50 border-slate-200"
                >
                  <Edit className="h-3.5 w-3.5" />
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 text-xs h-8 bg-white border-slate-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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

        {(contact.notes || contact.sentAt) && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-start justify-between gap-4">
              {contact.notes && (
                <div className="flex items-start gap-2 flex-1">
                  <FileText className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">{contact.notes}</p>
                </div>
              )}
              <div className="flex flex-col gap-1 text-xs text-slate-500 flex-shrink-0">
                {contact.sentAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Sent: {new Date(contact.sentAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Updated: {new Date(contact.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
