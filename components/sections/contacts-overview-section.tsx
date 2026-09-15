"use client"

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
import { Building } from "lucide-react"
import { ContactCard } from "@/app/components/contact-card"
import { Pagination } from "@/app/components/pagination"
import { SectionCard } from "@/components/ui/section-card"
import type { Contact } from "@/app/types/contact"

interface ContactsOverviewSectionProps {
  isExpanded: boolean
  onToggle: () => void
  filteredContacts: Contact[]
  paginatedContacts: {
    contacts: Contact[]
    currentPage: number
    totalPages: number
  }
  selectedContacts: Contact[]
  onToggleContactSelection: (contact: Contact) => void
  onContactUpdate: (updatedContact: Contact) => void
  onContactDelete: (contactId: string) => void
  onClearAll: () => void
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  onShowToast: (message: string, type?: string) => void
}

export function ContactsOverviewSection({
  isExpanded,
  onToggle,
  filteredContacts,
  paginatedContacts,
  selectedContacts,
  onToggleContactSelection,
  onContactUpdate,
  onContactDelete,
  onClearAll,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onShowToast,
}: ContactsOverviewSectionProps) {
  if (filteredContacts.length === 0) return null

  const clearAllButton = (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 bg-white rounded-md transition-colors"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear All
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Confirm Clear All Contacts
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete all {filteredContacts.length} contacts from your storage and
            cannot be undone. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onClearAll} className="bg-red-600 hover:bg-red-700">
            Yes, Clear All Contacts
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <SectionCard
      icon={Building}
      title={
        <span className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span>Business Contacts Overview</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            {filteredContacts.length} contacts
          </span>
        </span>
      }
      description={
        isExpanded
          ? "Professional contact cards with horizontal layout for better readability"
          : `${selectedContacts.length} selected • Page ${paginatedContacts.currentPage} of ${paginatedContacts.totalPages} • Click to expand contacts`
      }
      isExpanded={isExpanded}
      onToggle={onToggle}
      headerExtra={clearAllButton}
    >
          {/* Pagination Controls - Top */}
          <div className="mb-4">
            <Pagination
              currentPage={paginatedContacts.currentPage}
              totalPages={paginatedContacts.totalPages}
              totalItems={filteredContacts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
            />
          </div>

          {/* Contact Cards */}
          <div className="space-y-3">
            {paginatedContacts.contacts.map((contact, index) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                index={(paginatedContacts.currentPage - 1) * itemsPerPage + index}
                isSelected={selectedContacts.some((c) => c.id === contact.id)}
                onToggleSelect={() => onToggleContactSelection(contact)}
                onUpdate={onContactUpdate}
                onDelete={() => onContactDelete(contact.id)}
                onShowToast={onShowToast}
              />
            ))}
          </div>

          {/* Pagination Controls - Bottom */}
          {paginatedContacts.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={paginatedContacts.currentPage}
                totalPages={paginatedContacts.totalPages}
                totalItems={filteredContacts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
              />
            </div>
          )}
    </SectionCard>
  )
}
