"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ImageLinkInserter } from "@/components/ui/image-link-inserter"
import { MessageSquare, Plus, Edit, Trash2, Globe, GlobeIcon as GlobeX, Users, Tag, Save, X, Eye } from "lucide-react"

interface MessageTemplate {
  id: string
  name: string
  category: string
  content: string
  variables: string[]
  targetAudience: "all" | "with_website" | "no_website" | "category_specific"
  specificCategory?: string
}

interface MessageTemplatesProps {
  templates: MessageTemplate[]
  onTemplateSelect: (template: MessageTemplate) => void
  selectedTemplate: MessageTemplate | null
  onTemplateCreate: (template: MessageTemplate) => void
  onTemplateUpdate: (template: MessageTemplate) => void
  onTemplateDelete: (templateId: string) => void
  availableCustomVariables: string[] // New prop for custom variables
}

export function MessageTemplates({
  templates,
  onTemplateSelect,
  selectedTemplate,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  availableCustomVariables,
}: MessageTemplatesProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState<Partial<MessageTemplate>>({
    name: "",
    category: "Welcome",
    content: "",
    targetAudience: "all",
  })

  const categories = ["Welcome", "Follow Up", "Sales", "Support", "Promotion", "Custom"]
  const audienceOptions = [
    { value: "all", label: "All Companies", icon: Users },
    { value: "with_website", label: "With Website", icon: Globe },
    { value: "no_website", label: "No Website", icon: GlobeX },
    { value: "category_specific", label: "Specific Category", icon: Tag },
  ]

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{[^}]+\}/g) || []
    return Array.from(new Set(matches))
  }

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return

    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      category: newTemplate.category || "Custom",
      content: newTemplate.content,
      variables: extractVariables(newTemplate.content),
      targetAudience: newTemplate.targetAudience || "all",
      specificCategory: newTemplate.specificCategory,
    }

    onTemplateCreate(template)
    setNewTemplate({ name: "", category: "Welcome", content: "", targetAudience: "all" })
    setIsCreating(false)
  }

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return

    const updatedTemplate: MessageTemplate = {
      ...editingTemplate,
      variables: extractVariables(editingTemplate.content),
    }

    onTemplateUpdate(updatedTemplate)
    setEditingTemplate(null)
  }

  const getAudienceIcon = (audience: string) => {
    const option = audienceOptions.find((opt) => opt.value === audience)
    return option ? option.icon : Users
  }

  const getAudienceLabel = (template: MessageTemplate) => {
    if (template.targetAudience === "category_specific" && template.specificCategory) {
      return `${template.specificCategory} Category`
    }
    const option = audienceOptions.find((opt) => opt.value === template.targetAudience)
    return option?.label || "All Companies"
  }

  const previewWithSampleData = (content: string) => {
    let previewText = content
      .replace(/\{companyName\}/g, "ABC Company")
      .replace(/\{companyCategory\}/g, "Technology")
      .replace(/\{website\}/g, "https://abccompany.com")

    // Replace custom variables with sample data
    availableCustomVariables.forEach((variable) => {
      const varName = variable.replace(/\{|\}/g, "") // Remove braces for matching
      previewText = previewText.replace(new RegExp(`\\{${varName}\\}`, "g"), `[Sample ${varName}]`)
    })

    return previewText
  }

  const allAvailableVariables = [
    "{companyName}",
    "{companyCategory}",
    "{website}",
    ...availableCustomVariables.map((v) => `{${v}}`),
  ]

  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader className="bg-white border-b border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-800 text-lg sm:text-xl">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
              Message Templates
            </CardTitle>
            <CardDescription className="text-slate-600 text-xs sm:text-sm">
              Pre-built templates with smart variables for different business scenarios
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10 sm:h-auto text-sm">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            New Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {/* Create New Template */}
        {isCreating && (
          <Card className="mb-4 border border-slate-200 shadow-none">
            <CardHeader className="bg-slate-50 p-4">
              <CardTitle className="text-base sm:text-lg text-slate-800">Create New Template</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Template Name</Label>
                  <Input
                    value={newTemplate.name || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Welcome New Clients"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Category</Label>
                  <select
                    value={newTemplate.category || "Welcome"}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-white text-xs sm:text-sm h-9 sm:h-10"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Target Audience</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {audienceOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={option.value}
                        variant={newTemplate.targetAudience === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewTemplate({ ...newTemplate, targetAudience: option.value as any })}
                        className="justify-start text-xs sm:text-sm px-2"
                      >
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        <span className="hidden sm:inline">{option.label}</span>
                        <span className="sm:hidden">{option.label.split(" ")[0]}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {newTemplate.targetAudience === "category_specific" && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Specific Category</Label>
                  <Input
                    value={newTemplate.specificCategory || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, specificCategory: e.target.value })}
                    placeholder="e.g., Technology, Healthcare, Retail"
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Message Content</Label>
                <Textarea
                  value={newTemplate.content || ""}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Use {companyName}, {companyCategory}, {website} for personalization"
                  rows={4}
                  className="font-mono text-xs sm:text-sm"
                />
                <div className="text-[10px] sm:text-xs text-gray-500 break-words">
                  Available variables: {allAvailableVariables.map((v) => `\`${v}\``).join(", ")}
                </div>
                <ImageLinkInserter
                  onInsert={(url) => setNewTemplate({ ...newTemplate, content: `${newTemplate.content || ""}\n${url}\n` })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleCreateTemplate} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10 sm:h-auto text-sm">
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Save Template
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)} className="w-full sm:w-auto h-10 sm:h-auto text-sm">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Template */}
        {editingTemplate && (
          <Card className="mb-4 border border-slate-200 shadow-none">
            <CardHeader className="bg-slate-50 p-4">
              <CardTitle className="text-base sm:text-lg text-slate-800">Edit Template</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Template Name</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm font-medium">Category</Label>
                  <select
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-white text-xs sm:text-sm h-9 sm:h-10"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Message Content</Label>
                <Textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  rows={4}
                  className="font-mono text-xs sm:text-sm"
                />
                <div className="text-[10px] sm:text-xs text-gray-500 break-words">
                  Available variables: {allAvailableVariables.map((v) => `\`${v}\``).join(", ")}
                </div>
                <ImageLinkInserter
                  onInsert={(url) => setEditingTemplate({ ...editingTemplate, content: `${editingTemplate.content}\n${url}\n` })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleUpdateTemplate} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10 sm:h-auto text-sm">
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Update Template
                </Button>
                <Button variant="outline" onClick={() => setEditingTemplate(null)} className="w-full sm:w-auto h-10 sm:h-auto text-sm">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Preview Modal */}
        {previewTemplate && (
          <Card className="mb-4 border border-slate-200 shadow-none">
            <CardHeader className="bg-slate-50 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-lg text-slate-800">Template Preview</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)} className="h-9 w-9 p-0">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white p-2 sm:p-4 rounded-lg border">
                  <h4 className="font-semibold mb-1.5 sm:mb-2 text-xs sm:text-base">Sample Message:</h4>
                  <div className="whitespace-pre-wrap text-[10px] sm:text-sm bg-gray-50 p-2 sm:p-3 rounded">
                    {previewWithSampleData(previewTemplate.content)}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => onTemplateSelect(previewTemplate)}
                    className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-9 sm:h-10 text-sm"
                  >
                    Use This Template
                  </Button>
                  <Button variant="outline" onClick={() => setPreviewTemplate(null)} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
                    Close Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((template) => {
            const AudienceIcon = getAudienceIcon(template.targetAudience)
            const isSelected = selectedTemplate?.id === template.id

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-colors shadow-none ${
                  isSelected ? "ring-2 ring-slate-900 bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-base break-words">{template.name}</h3>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewTemplate(template)
                          }}
                          className="h-9 w-9 p-0"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTemplate(template)
                          }}
                          className="h-9 w-9 p-0"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onTemplateDelete(template.id)
                          }}
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-gray-600">
                      <AudienceIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">{getAudienceLabel(template)}</span>
                    </div>

                    {/* Variables */}
                    {template.variables.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] sm:text-xs font-medium text-gray-500">Variables:</p>
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {template.variables.slice(0, 3).map((variable, index) => (
                            <Badge key={index} variant="outline" className="text-[10px] sm:text-xs max-w-full whitespace-normal break-words">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              +{template.variables.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="text-[10px] sm:text-sm text-gray-600 line-clamp-3">
                      {template.content.substring(0, 100)}...
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => onTemplateSelect(template)}
                      className={`w-full text-[10px] sm:text-sm h-9 ${
                        isSelected ? "bg-emerald-700 hover:bg-emerald-800" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                      size="sm"
                    >
                      {isSelected ? "Selected" : "Use Template"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">No templates created yet. Click "New Template" to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
