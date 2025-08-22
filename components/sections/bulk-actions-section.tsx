"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { CheckCircle } from "lucide-react"
import type { Contact } from "@/app/types/contact"

interface BulkActionsSectionProps {
  selectedContacts: Contact[]
  bulkStatusUpdate: {
    isOpen: boolean
    newStatus: Contact["status"]
    notes: string
  }
  onBulkStatusUpdateChange: (update: { isOpen: boolean; newStatus: Contact["status"]; notes: string }) => void
  onBulkStatusUpdate: () => void
  onClearSelection: () => void
}

export function BulkActionsSection({
  selectedContacts,
  bulkStatusUpdate,
  onBulkStatusUpdateChange,
  onBulkStatusUpdate,
  onClearSelection,
}: BulkActionsSectionProps) {
  if (selectedContacts.length === 0) return null

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Bulk Actions</h3>
              <p className="text-sm text-slate-600">{selectedContacts.length} contacts selected</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog
              open={bulkStatusUpdate.isOpen}
              onOpenChange={(open) => onBulkStatusUpdateChange({ ...bulkStatusUpdate, isOpen: open })}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Update Status for {selectedContacts.length} Contacts</DialogTitle>
                  <DialogDescription>
                    Change the status and optionally add notes for all selected contacts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">New Status</Label>
                    <select
                      id="status"
                      value={bulkStatusUpdate.newStatus}
                      onChange={(e) =>
                        onBulkStatusUpdateChange({
                          ...bulkStatusUpdate,
                          newStatus: e.target.value as Contact["status"],
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="not_sent">Not Sent</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkNotes">Notes (Optional)</Label>
                    <Textarea
                      id="bulkNotes"
                      value={bulkStatusUpdate.notes}
                      onChange={(e) => onBulkStatusUpdateChange({ ...bulkStatusUpdate, notes: e.target.value })}
                      placeholder="Add notes for all selected contacts..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={onBulkStatusUpdate} className="flex-1">
                      Update {selectedContacts.length} Contacts
                    </Button>
                    <Button
                      onClick={() => onBulkStatusUpdateChange({ isOpen: false, newStatus: "pending", notes: "" })}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={onClearSelection} variant="outline">
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
