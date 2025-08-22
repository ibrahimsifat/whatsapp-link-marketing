"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, Plus, Search, MessageCircle, Users, ChevronDown, ChevronUp } from "lucide-react"
import { UploadSection } from "@/app/components/upload-section"
import { GoogleSheetsImport } from "@/app/components/google-sheets-import"
import { ManualEntrySection } from "@/app/components/manual-entry-section"
import { AdvancedSearch, type SearchCriteria } from "@/app/components/advanced-search"
import { MessageTemplates } from "@/app/components/message-templates"
import { ContactManagement } from "@/app/components/contact-management"
import type { Contact, MessageTemplate } from "@/app/types/contact"

interface UploadDataSectionProps {
  isExpanded: boolean
  onToggle: () => void
  contactsCount: number
  // File handling props
  fileState: any
  onFileStateUpdate: (state: any) => void
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  // Manual link props
  manualState: any
  onManualStateUpdate: (state: any) => void
  onGenerateLink: () => void
  onCopyLink: () => void
  // Search props
  contacts: Contact[]
  onSearch: (criteria: SearchCriteria) => void
  onClearSearch: () => void
  searchCriteria: SearchCriteria
  categories: string[]
  sources: string[]
  customFields: string[]
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
  onFileStateUpdate,
  onDrag,
  onDrop,
  onFileChange,
  manualState,
  onManualStateUpdate,
  onGenerateLink,
  onCopyLink,
  contacts,
  onSearch,
  onClearSearch,
  searchCriteria,
  categories,
  sources,
  customFields,
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
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader
        className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-lg border-b border-slate-100 cursor-pointer hover:bg-gradient-to-r hover:from-emerald-100 hover:to-blue-100 transition-all duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Upload className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-slate-800 text-xl">Upload Business Data</CardTitle>
              <CardDescription className="text-slate-600">
                {isExpanded
                  ? "Import contacts from Excel, CSV files or Google Sheets"
                  : `${contactsCount} contacts loaded • Click to expand upload options`}
              </CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-8">
          <Tabs defaultValue="upload" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-6 bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg rounded-xl p-1">
                <TabsTrigger
                  value="upload"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sheets"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Sheets</span>
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Manual</span>
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Templates</span>
                </TabsTrigger>
                <TabsTrigger
                  value="manage"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upload">
              <UploadSection
                state={fileState}
                onStateUpdate={onFileStateUpdate}
                onDrag={onDrag}
                onDrop={onDrop}
                onFileChange={onFileChange}
              />
            </TabsContent>

            <TabsContent value="sheets">
              <GoogleSheetsImport onImportContacts={onImportContacts} onShowToast={onShowToast} />
            </TabsContent>

            <TabsContent value="manual">
              <ManualEntrySection
                state={manualState}
                onStateUpdate={onManualStateUpdate}
                onGenerateLink={onGenerateLink}
                onCopyLink={onCopyLink}
              />
            </TabsContent>

            <TabsContent value="search">
              <AdvancedSearch
                contacts={contacts}
                onSearch={onSearch}
                onClearSearch={onClearSearch}
                currentCriteria={searchCriteria}
                categories={categories}
                sources={sources}
                customFields={customFields}
              />
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
