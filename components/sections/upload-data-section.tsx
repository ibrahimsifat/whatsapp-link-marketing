"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, MessageCircle, Users } from "lucide-react"
import { SectionCard } from "@/components/ui/section-card"
import { UploadSection } from "@/app/components/upload-section"
import { GoogleSheetsImport } from "@/app/components/google-sheets-import"
import { MessageTemplates } from "@/app/components/message-templates"
import { ContactManagement } from "@/app/components/contact-management"
import type { Contact, MessageTemplate } from "@/app/types/contact"
import type { TemplateGroup } from "@/app/types/template-group"

interface UploadDataSectionProps {
  isExpanded: boolean
  onToggle: () => void
  contactsCount: number
  // File handling props
  fileState: any
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  // Template props
  templates: MessageTemplate[]
  /** Group id of the selected template, or null when none is selected. */
  selectedGroupId: string | null
  onTemplateSelect: (group: TemplateGroup) => void
  onTemplateCreate: (template: MessageTemplate) => void
  onTemplateUpdate: (template: MessageTemplate) => void
  onTemplateDelete: (templateId: string) => void
  onTemplateDeleteGroup: (templateId: string) => void
  availableCustomVariables: string[]
  // Contact management props
  database: any
  isLoading: boolean
  onSaveContacts: (contacts: Contact[]) => Promise<any>
  onMergeContacts: (contacts: Contact[], source: string) => Promise<any>
  onUpdateContactStatus: (id: string, status: Contact["status"], notes?: string) => Promise<any>
  onDeleteContact: (id: string) => Promise<any>
  onExportContacts: () => Promise<{ success: boolean; message: string }>
  onClearAllContacts: () => Promise<any>
  currentContacts: Contact[]
  onUpdateCurrentContacts: (contacts: Contact[]) => void
  onImportContacts: (contacts: Contact[]) => void
  onShowToast: (message: string) => void
}

export function UploadDataSection({
  isExpanded,
  onToggle,
  contactsCount,
  fileState,
  onDrag,
  onDrop,
  onFileChange,
  templates,
  selectedGroupId,
  onTemplateSelect,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateDeleteGroup,
  availableCustomVariables,
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
  onImportContacts,
  onShowToast,
}: UploadDataSectionProps) {
  return (
    <SectionCard
      icon={Upload}
      title="Upload Business Data"
      description={
        isExpanded
          ? "Import contacts from Excel, CSV files or Google Sheets"
          : `${contactsCount} contacts loaded • Click to expand upload options`
      }
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <Tabs defaultValue="upload" className="space-y-3 sm:space-y-4">
            <div className="-mx-1 overflow-x-auto pb-1">
              <TabsList className="grid min-w-max grid-cols-4 bg-slate-100 border border-slate-200 shadow-none rounded-lg p-1 sm:w-full">
                <TabsTrigger
                  value="upload"
                  className="flex min-w-12 sm:min-w-0 items-center gap-2 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-950 rounded-md transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sheets"
                  className="flex min-w-12 sm:min-w-0 items-center gap-2 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-950 rounded-md transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Sheets</span>
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="flex min-w-12 sm:min-w-0 items-center gap-2 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-950 rounded-md transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Templates</span>
                </TabsTrigger>
                <TabsTrigger
                  value="manage"
                  className="flex min-w-12 sm:min-w-0 items-center gap-2 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-950 rounded-md transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upload">
              <UploadSection
                state={fileState}
                onDrag={onDrag}
                onDrop={onDrop}
                onFileChange={onFileChange}
              />
            </TabsContent>

            <TabsContent value="sheets">
              <GoogleSheetsImport onImportContacts={onImportContacts} onShowToast={onShowToast} />
            </TabsContent>

            <TabsContent value="templates">
              <MessageTemplates
                templates={templates}
                onTemplateSelect={onTemplateSelect}
                selectedGroupId={selectedGroupId}
                onTemplateCreate={onTemplateCreate}
                onTemplateUpdate={onTemplateUpdate}
                onTemplateDelete={onTemplateDelete}
                onTemplateDeleteGroup={onTemplateDeleteGroup}
                availableCustomVariables={availableCustomVariables}
                contacts={currentContacts}
              />
            </TabsContent>

            <TabsContent value="manage">
              <ContactManagement
                database={database}
                isLoading={isLoading}
                onSaveContacts={onSaveContacts}
                onMergeContacts={onMergeContacts}
                onUpdateContactStatus={onUpdateContactStatus}
                onDeleteContact={onDeleteContact}
                onExportContacts={onExportContacts}
                onClearAllContacts={onClearAllContacts}
                currentContacts={currentContacts}
                onUpdateCurrentContacts={onUpdateCurrentContacts}
              />
            </TabsContent>
      </Tabs>
    </SectionCard>
  )
}
