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
import { BarChart3, Download, Trash2, Play, StopCircle } from "lucide-react"
import { BulkMessageSender } from "./bulk-message-sender"
import type { Contact, MessageTemplate } from "../types/contact"

interface StatisticsSectionProps {
  filteredContacts: Contact[]
  paginatedContacts: { contacts: Contact[]; currentPage: number; totalPages: number }
  selectedContacts: Contact[]
  batchState: { isBatchSending: boolean; currentBatchIndex: number }
  templates: MessageTemplate[]
  selectedTemplate: MessageTemplate | null
  customMessage: string
  onSelectAllVisible: () => void
  onClearSelection: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
  onStartBatchSend: () => void
  onStopBatchSend: () => void
  onContactStatusUpdate: (contactId: string, status: Contact["status"]) => void
  onShowToast: (message: string, type?: "success" | "error" | "warning" | "info") => void
}

export function StatisticsSection({
  filteredContacts,
  paginatedContacts,
  selectedContacts,
  batchState,
  templates,
  selectedTemplate,
  customMessage,
  onSelectAllVisible,
  onClearSelection,
  onBulkExport,
  onBulkDelete,
  onStartBatchSend,
  onStopBatchSend,
  onContactStatusUpdate,
  onShowToast,
}: StatisticsSectionProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader className="bg-white rounded-t-lg border-b border-slate-200 p-4 sm:p-5">
        <CardTitle className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-800 text-lg sm:text-xl">
          <div className="p-1.5 sm:p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </div>
          Business Contacts Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg text-center border border-slate-200">
            <div className="text-xl sm:text-2xl font-semibold text-emerald-600 mb-1">{filteredContacts.length}</div>
            <div className="text-[10px] sm:text-sm text-slate-600 font-medium">Total Contacts</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg text-center border border-slate-200">
            <div className="text-xl sm:text-2xl font-semibold text-emerald-600 mb-1">
              {filteredContacts.filter((c) => c.hasWebsite).length}
            </div>
            <div className="text-[10px] sm:text-sm text-slate-600 font-medium">With Website</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg text-center border border-slate-200">
            <div className="text-xl sm:text-2xl font-semibold text-emerald-600 mb-1">
              {filteredContacts.filter((c) => !c.hasWebsite).length}
            </div>
            <div className="text-[10px] sm:text-sm text-slate-600 font-medium">No Website</div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg text-center border border-slate-200">
            <div className="text-xl sm:text-2xl font-semibold text-emerald-600 mb-1">{selectedContacts.length}</div>
            <div className="text-[10px] sm:text-sm text-slate-600 font-medium">Selected</div>
          </div>
        </div>

        {/* Enhanced Bulk Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-4 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Checkbox
                checked={
                  paginatedContacts.contacts.length > 0 &&
                  paginatedContacts.contacts.every((contact) =>
                    selectedContacts.some((selected) => selected.id === contact.id),
                  )
                }
                onCheckedChange={onSelectAllVisible}
                className="h-4 w-4"
              />
              <span className="text-xs sm:text-sm text-slate-700 font-medium">
                Select All ({paginatedContacts.contacts.length})
              </span>
            </div>
            {selectedContacts.length > 0 && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{selectedContacts.length} selected</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-3 w-full lg:w-auto lg:justify-end">
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
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-none text-xs sm:text-sm h-9"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Export Selected</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-none text-xs sm:text-sm h-9"
                >
                  Clear Selection
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50 bg-white shadow-none text-xs sm:text-sm h-9"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Delete Selected</span>
                      <span className="sm:hidden">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-slate-600 gap-2 sm:gap-3 mb-4">
          <span>
            {"Showing "}
            {paginatedContacts.contacts.length}
            {" of "}
            {filteredContacts.length}
            {" contacts"}
          </span>
        </div>

        {/* Enhanced Batch Send Button */}
        {paginatedContacts.contacts.length > 0 && (
          <div className="text-center">
            {batchState.isBatchSending ? (
              <Button
                onClick={onStopBatchSend}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-none transition-colors h-11 px-4 sm:px-6 text-sm sm:text-base"
                size="lg"
              >
                <StopCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Stop Sending ({batchState.currentBatchIndex}/{paginatedContacts.contacts.length})
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={paginatedContacts.contacts.length === 0}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-none transition-colors h-11 px-4 sm:px-6 text-sm sm:text-base"
                    size="lg"
                  >
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    Send Current Page ({paginatedContacts.contacts.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white">
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
                      className="bg-emerald-600 hover:bg-emerald-700"
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
