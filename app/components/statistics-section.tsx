"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { BarChart3, Download, Trash2, X, Play, StopCircle } from "lucide-react"
import { BulkMessageSender } from "./bulk-message-sender"
import type { Contact, MessageTemplate } from "../types/contact"

interface StatisticsSectionProps {
  filteredContacts: Contact[]
  paginatedContacts: { contacts: Contact[]; currentPage: number; totalPages: number }
  selectedContacts: Contact[]
  searchCriteria: any
  batchState: { isBatchSending: boolean; currentBatchIndex: number }
  templates: MessageTemplate[]
  selectedTemplate: MessageTemplate | null
  customMessage: string
  onSelectAllVisible: () => void
  onClearSelection: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
  onClearSearch: () => void
  onStartBatchSend: () => void
  onStopBatchSend: () => void
  onContactStatusUpdate: (contactId: string, status: Contact["status"]) => void
  onShowToast: (message: string, type?: "success" | "error" | "warning" | "info") => void
}

export function StatisticsSection({
  filteredContacts,
  paginatedContacts,
  selectedContacts,
  searchCriteria,
  batchState,
  templates,
  selectedTemplate,
  customMessage,
  onSelectAllVisible,
  onClearSelection,
  onBulkExport,
  onBulkDelete,
  onClearSearch,
  onStartBatchSend,
  onStopBatchSend,
  onContactStatusUpdate,
  onShowToast,
}: StatisticsSectionProps) {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg border-b border-slate-100">
        <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          Business Contacts Overview
          {Object.keys(searchCriteria).length > 0 && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200">Filtered</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">{filteredContacts.length}</div>
            <div className="text-sm text-blue-600 font-medium">
              {Object.keys(searchCriteria).length > 0 ? "Filtered" : "Total"} Contacts
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl text-center border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {filteredContacts.filter((c) => c.hasWebsite).length}
            </div>
            <div className="text-sm text-emerald-600 font-medium">With Website</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl text-center border border-orange-200">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {filteredContacts.filter((c) => !c.hasWebsite).length}
            </div>
            <div className="text-sm text-orange-600 font-medium">No Website</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">{selectedContacts.length}</div>
            <div className="text-sm text-purple-600 font-medium">Selected</div>
          </div>
        </div>

        {/* Enhanced Bulk Actions */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={
                  paginatedContacts.contacts.length > 0 &&
                  paginatedContacts.contacts.every((contact) =>
                    selectedContacts.some((selected) => selected.id === contact.id),
                  )
                }
                onCheckedChange={onSelectAllVisible}
                className="h-5 w-5"
              />
              <span className="text-sm text-slate-700 font-medium">
                Select All ({paginatedContacts.contacts.length})
              </span>
            </div>
            {selectedContacts.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">{selectedContacts.length} selected</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Enhanced Bulk Message Sender */}
            <BulkMessageSender
              contacts={filteredContacts}
              selectedContacts={selectedContacts}
              templates={templates}
              selectedTemplate={selectedTemplate}
              customMessage={customMessage}
              onContactStatusUpdate={onContactStatusUpdate}
              onShowToast={onShowToast}
            />

            {selectedContacts.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkExport}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-sm"
                >
                  Clear Selection
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50 bg-white shadow-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Contacts</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedContacts.length} selected contacts? This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete {selectedContacts.length} Contacts
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-600 gap-3 mb-6">
          <span>
            {"Showing "}
            {paginatedContacts.contacts.length}
            {" of "}
            {filteredContacts.length}
            {" contacts"}
            {Object.keys(searchCriteria).length > 0 && " (filtered)"}
          </span>
          {Object.keys(searchCriteria).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSearch}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Enhanced Batch Send Button */}
        {paginatedContacts.contacts.length > 0 && (
          <div className="text-center">
            {batchState.isBatchSending ? (
              <Button
                onClick={onStopBatchSend}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 px-8"
                size="lg"
              >
                <StopCircle className="h-5 w-5 mr-2" />
                Stop Sending ({batchState.currentBatchIndex}/{paginatedContacts.contacts.length})
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={paginatedContacts.contacts.length === 0}
                    className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 px-8"
                    size="lg"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Send Current Page ({paginatedContacts.contacts.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5 text-emerald-600" />
                      Confirm Batch Send
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will open {paginatedContacts.contacts.length} WhatsApp chats from the current page in new
                      tabs, one by one, with a small delay. **Please ensure your browser allows pop-ups for this site,
                      otherwise, the chats will not open.**
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onStartBatchSend}
                      className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                    >
                      Start Sending
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
