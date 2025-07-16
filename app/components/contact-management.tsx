"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Save,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  FileText,
  Database,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import type { Contact, ContactDatabase } from "../types/contact"

interface ContactManagementProps {
  database: ContactDatabase
  isLoading: boolean
  onSaveContacts: (contacts: Contact[]) => Promise<{ success: boolean; message: string }>
  onMergeContacts: (contacts: Contact[], source: string) => Promise<{ success: boolean; message: string; stats?: any }>
  onUpdateContactStatus: (
    contactId: string,
    status: Contact["status"],
    notes?: string,
  ) => Promise<{ success: boolean; message?: string }>
  onDeleteContact: (contactId: string) => Promise<{ success: boolean; message: string }>
  onExportContacts: () => { success: boolean; message: string }
  onClearAllContacts: () => Promise<{ success: boolean; message: string }>
  currentContacts: Contact[]
  onUpdateCurrentContacts: (contacts: Contact[]) => void
}

export function ContactManagement({
  database,
  isLoading,
  onSaveContacts,
  onMergeContacts,
  onUpdateContactStatus,
  onDeleteContact,
  onExportContacts,
  onClearAllContacts,
  currentContacts,
  onUpdateCurrentContacts,
}: ContactManagementProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [notes, setNotes] = useState("")
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [mergeStats, setMergeStats] = useState<any>(null)

  const handleSaveCurrentContacts = async () => {
    if (currentContacts.length === 0) {
      alert("No contacts to save")
      return
    }

    const result = await onSaveContacts(currentContacts)
    if (result.success) {
      alert(result.message)
    } else {
      alert(`Error: ${result.message}`)
    }
  }

  const handleMergeWithExisting = async () => {
    if (currentContacts.length === 0) {
      alert("No contacts to merge")
      return
    }

    const source = `Upload_${new Date().toISOString().split("T")[0]}`
    const result = await onMergeContacts(currentContacts, source)

    if (result.success) {
      setMergeStats(result.stats)
      setShowMergeDialog(true)
      // Update current contacts to reflect the merged state
      onUpdateCurrentContacts([]) // Clear current session contacts after merging
    } else {
      alert(`Error: ${result.message}`)
    }
  }

  const handleStatusUpdate = async (contact: Contact, newStatus: Contact["status"]) => {
    const result = await onUpdateContactStatus(contact.id, newStatus, notes)
    if (result.success) {
      // Update the contact in current contacts if it exists there
      const updatedCurrentContacts = currentContacts.map((c) =>
        c.id === contact.id
          ? { ...c, status: newStatus, sentAt: newStatus === "sent" ? new Date().toISOString() : c.sentAt }
          : c,
      )
      onUpdateCurrentContacts(updatedCurrentContacts)
      setSelectedContact(null)
      setNotes("")
    } else {
      alert(`Error: ${result.message}`)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    const result = await onDeleteContact(contactId)
    if (result.success) {
      // Remove from current contacts if it exists there
      const updatedCurrentContacts = currentContacts.filter((c) => c.id !== contactId)
      onUpdateCurrentContacts(updatedCurrentContacts)
      alert(result.message)
    } else {
      alert(`Error: ${result.message}`)
    }
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
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg sm:text-xl">
          <Database className="h-5 w-5 sm:h-6 sm:w-6" />
          Contact Management System
        </CardTitle>
        <CardDescription className="text-indigo-700 text-xs sm:text-sm">
          Save, track, and manage your business contacts with send status tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 sm:p-4 text-center">
              <Database className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg sm:text-xl font-bold text-blue-600">{database.totalContacts}</div>
              <div className="text-xs text-blue-500">Total Saved</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3 sm:p-4 text-center">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mx-auto mb-2" />
              <div className="text-lg sm:text-xl font-bold text-green-600">{database.sentCount}</div>
              <div className="text-xs text-green-500">Messages Sent</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-3 sm:p-4 text-center">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-lg sm:text-xl font-bold text-yellow-600">{database.pendingCount}</div>
              <div className="text-xs text-yellow-500">Pending</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 sm:p-4 text-center">
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mx-auto mb-2" />
              <div className="text-lg sm:text-xl font-bold text-red-600">{database.notSentCount}</div>
              <div className="text-xs text-red-500">Not Sent</div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50 col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4 text-center">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg sm:text-xl font-bold text-purple-600">
                {database.totalContacts > 0 ? Math.round((database.sentCount / database.totalContacts) * 100) : 0}%
              </div>
              <div className="text-xs text-purple-500">Send Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <Button
            onClick={handleSaveCurrentContacts}
            disabled={isLoading || currentContacts.length === 0}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save Current Contacts ({currentContacts.length})</span>
            <span className="sm:hidden">Save Contacts ({currentContacts.length})</span>
          </Button>

          <Button
            onClick={handleMergeWithExisting}
            disabled={isLoading || currentContacts.length === 0}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50 bg-transparent w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Merge with Existing</span>
            <span className="sm:hidden">Merge</span>
          </Button>

          <Button
            onClick={onExportContacts}
            disabled={isLoading || database.totalContacts === 0}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export Database</span>
            <span className="sm:hidden">Export</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isLoading || database.totalContacts === 0}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50 bg-transparent w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base sm:text-lg">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm">
                  This action cannot be undone. This will permanently delete all saved contacts and their tracking data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearAllContacts}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                >
                  Delete All Contacts
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Current Session Info */}
        {currentContacts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <h4 className="font-semibold text-orange-800 text-sm sm:text-base">Current Session</h4>
              </div>
              <p className="text-xs sm:text-sm text-orange-700">
                You have {currentContacts.length} contacts loaded in the current session. Save or merge them to preserve
                the data and enable tracking features.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Merge Results Dialog */}
        <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
          <DialogContent className="mx-4 max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Merge Completed Successfully
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Your contacts have been merged with the existing database.
              </DialogDescription>
            </DialogHeader>
            {mergeStats && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{mergeStats.newContacts}</div>
                    <div className="text-xs sm:text-sm text-gray-600">New Contacts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{mergeStats.duplicates}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{mergeStats.total}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total</div>
                  </div>
                </div>
                <Button onClick={() => setShowMergeDialog(false)} className="w-full">
                  Continue
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Contact Status Update Dialog */}
        <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
          <DialogContent className="mx-4 max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                Update Contact Status
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {selectedContact?.companyName || selectedContact?.normalized}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Status</Label>
                <Badge className={getStatusColor(selectedContact?.status || "pending")}>
                  {getStatusIcon(selectedContact?.status || "pending")}
                  <span className="ml-1 capitalize">{selectedContact?.status || "pending"}</span>
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this contact..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => selectedContact && handleStatusUpdate(selectedContact, "sent")}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Sent
                </Button>
                <Button
                  onClick={() => selectedContact && handleStatusUpdate(selectedContact, "not_sent")}
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Not Sent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Database Info */}
        {database.totalContacts > 0 && (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    Database last updated: {new Date(database.lastUpdated).toLocaleString()}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  v{database.version}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
