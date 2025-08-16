"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  Building,
  Globe,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  X,
  MessageSquare,
} from "lucide-react"
import { ClipboardUtils } from "../utils/clipboard-utils"
import type { Contact } from "../types/contact"

interface ContactCardProps {
  contact: Contact
  index: number
  isSelected: boolean
  onToggleSelect: () => void
  onUpdate: (contact: Contact) => void
  onDelete: () => void
  onShowToast: (message: string, type: "success" | "error") => void
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
  const [linkCopied, setLinkCopied] = useState(false)

  const handleCopyLink = async () => {
    const success = await ClipboardUtils.copyToClipboard(contact.whatsappLink)
    if (success) {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      onShowToast("WhatsApp link copied to clipboard!", "success")
    } else {
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

  const handleOpenChat = () => {
    // Update contact status to sent
    const updatedContact = {
      ...contact,
      status: "sent" as const,
      sentAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }

    onUpdate(updatedContact)

    // Open WhatsApp link
    window.open(contact.whatsappLink, "_blank")

    // Show success message
    onShowToast("WhatsApp chat opened and status updated to sent", "success")
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
        return <CheckCircle className="h-4 w-4" />
      case "not_sent":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-lg border-l-4 ${
        isSelected
          ? "border-l-purple-500 bg-purple-50/50 shadow-md"
          : contact.hasWebsite
            ? "border-l-green-500 hover:bg-green-50/30"
            : "border-l-orange-500 hover:bg-orange-50/30"
      }`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Selection Checkbox */}
          <div className="flex items-center pt-1">
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="h-5 w-5" />
          </div>

          {/* Contact Number */}
          <div className="flex-shrink-0 w-12 text-center">
            <div className="text-sm font-bold text-slate-600 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto">
              {index + 1}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
                    {contact.companyName || "Unknown Company"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{contact.normalized}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <Badge className={`${getStatusColor(contact.status)} flex items-center gap-1 flex-shrink-0`}>
                {getStatusIcon(contact.status)}
                <span className="capitalize">{contact.status.replace("_", " ")}</span>
              </Badge>
            </div>

            {/* Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Category
                </Badge>
                <span className="text-slate-600 truncate">{contact.companyCategory || "Not specified"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                {contact.hasWebsite ? (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate hover:underline"
                  >
                    {contact.website}
                  </a>
                ) : (
                  <span className="text-slate-400">No website</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Source
                </Badge>
                <span className="text-slate-600 truncate">{contact.source}</span>
              </div>
            </div>

            {/* Custom Fields */}
            {contact.dynamicData && Object.keys(contact.dynamicData).length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custom Fields</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(contact.dynamicData).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {key}
                      </Badge>
                      <span className="text-slate-600 truncate">{String(value || "N/A")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleCopyLink} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                {linkCopied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                <span className="hidden sm:inline">{linkCopied ? "Copied!" : "Copy Link"}</span>
                <span className="sm:hidden">{linkCopied ? "✓" : "Copy"}</span>
              </Button>

              <Button
                onClick={handleOpenChat}
                size="sm"
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Open Chat</span>
                <span className="sm:hidden">Open</span>
              </Button>

              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 bg-transparent"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5" />
                      Edit Contact
                    </DialogTitle>
                    <DialogDescription>Update contact information and custom fields</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={editedContact.companyName || ""}
                          onChange={(e) => setEditedContact({ ...editedContact, companyName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyCategory">Category</Label>
                        <Input
                          id="companyCategory"
                          value={editedContact.companyCategory || ""}
                          onChange={(e) => setEditedContact({ ...editedContact, companyCategory: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={editedContact.website || ""}
                        onChange={(e) =>
                          setEditedContact({
                            ...editedContact,
                            website: e.target.value,
                            hasWebsite: !!e.target.value,
                          })
                        }
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={editedContact.notes || ""}
                        onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
                        rows={3}
                        placeholder="Add notes about this contact..."
                      />
                    </div>

                    {/* Custom Fields */}
                    {editedContact.dynamicData && Object.keys(editedContact.dynamicData).length > 0 && (
                      <div className="space-y-3">
                        <Label>Custom Fields</Label>
                        <div className="space-y-2">
                          {Object.entries(editedContact.dynamicData).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-2 items-center">
                              <Label className="text-sm font-medium">{key}</Label>
                              <Input
                                value={String(value || "")}
                                onChange={(e) =>
                                  setEditedContact({
                                    ...editedContact,
                                    dynamicData: {
                                      ...editedContact.dynamicData,
                                      [key]: e.target.value,
                                    },
                                  })
                                }
                                className="col-span-2"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Del</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {contact.companyName || contact.normalized}? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                      Delete Contact
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Sent Timestamp */}
            {contact.status === "sent" && contact.sentAt && (
              <div className="text-xs text-slate-500 flex items-center gap-1 pt-2 border-t border-slate-100">
                <MessageSquare className="h-3 w-3" />
                <span>Sent: {new Date(contact.sentAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
