"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, MessageCircle, Users, ChevronDown, ChevronUp } from "lucide-react"
import { UploadSection } from "@/app/components/upload-section"
import { GoogleSheetsImport } from "@/app/components/google-sheets-import"
import { MessageTemplates } from "@/app/components/message-templates"
import { ContactManagement } from "@/app/components/contact-management"
import type { Contact, MessageTemplate } from "@/app/types/contact"

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
  selectedTemplate: MessageTemplate | null
  onTemplateSelect: (template: MessageTemplate) => void
  onTemplateCreate: (template: MessageTemplate) => void
  onTemplateUpdate: (template: MessageTemplate) => void
  onTemplateDelete: (templateId: string) => void
  availableCustomVariables: string[]
  // Contact management props
  database: any
  isLoading: boolean
  onSaveContacts: (contacts: Contact[]) => Promise<any>
  onMergeContacts: (contacts: Contact[]) => Promise<any>
  onUpdateContactStatus: (id: string, status: Contact["status"], notes?: string) => Promise<any>
  onDeleteContact: (id: string) => Promise<any>
  onExportContacts: (contacts: Contact[]) => void
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
  selectedTemplate,
  onTemplateSelect,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
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
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader
        className="bg-white rounded-t-lg border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors p-4 sm:p-5"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex-shrink-0">
              <Upload className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-slate-800 text-lg sm:text-xl">Upload Business Data</CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm break-words">
                {isExpanded
                  ? "Import contacts from Excel, CSV files or Google Sheets"
                  : `${contactsCount} contacts loaded • Click to expand upload options`}
              </CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-500 flex-shrink-0 mt-1" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0 mt-1" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-3 sm:p-4 lg:p-5">
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
                selectedTemplate={selectedTemplate}
                onTemplateCreate={onTemplateCreate}
                onTemplateUpdate={onTemplateUpdate}
                onTemplateDelete={onTemplateDelete}
                availableCustomVariables={availableCustomVariables}
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
        </CardContent>
      )}
    </Card>
  )
}
