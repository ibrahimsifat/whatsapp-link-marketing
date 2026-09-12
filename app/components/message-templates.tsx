"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ImageLinkInserter } from "@/components/ui/image-link-inserter"
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Globe,
  GlobeIcon as GlobeX,
  Users,
  Tag,
  Save,
  X,
  Eye,
  Languages,
  Star,
  ImageIcon,
  AlertTriangle,
} from "lucide-react"
import type { Contact, MessageTemplate } from "../types/contact"
import { groupTemplates, summariseLanguageCoverage, type TemplateGroup } from "../types/template-group"
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  languageDir,
  languageLabel,
  languageNativeLabel,
} from "@/lib/i18n/languages"

interface MessageTemplatesProps {
  /** Flat language variants as stored; grouped into templates here. */
  templates: MessageTemplate[]
  onTemplateSelect: (group: TemplateGroup) => void
  selectedGroupId: string | null
  onTemplateCreate: (template: MessageTemplate) => void
  onTemplateUpdate: (template: MessageTemplate) => void
  /** Delete one language version. */
  onTemplateDelete: (templateId: string) => void
  /** Delete a template and every language version of it. */
  onTemplateDeleteGroup: (templateId: string) => void
  availableCustomVariables: string[]
  /** Drives the coverage hints: which languages your contacts actually need. */
  contacts?: Contact[]
}

/** What the editor panel is currently doing, if anything. */
type EditorState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "add-language"; group: TemplateGroup }
  | { mode: "edit"; variant: MessageTemplate; group: TemplateGroup }

interface Draft {
  name: string
  category: string
  content: string
  targetAudience: MessageTemplate["targetAudience"]
  specificCategory: string
  language: string
  imageUrl: string
}

const CATEGORIES = ["Welcome", "Follow Up", "Sales", "Support", "Promotion", "Custom"]

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Companies", icon: Users },
  { value: "with_website", label: "With Website", icon: Globe },
  { value: "no_website", label: "No Website", icon: GlobeX },
  { value: "category_specific", label: "Specific Category", icon: Tag },
] as const

const EMPTY_DRAFT: Draft = {
  name: "",
  category: "Welcome",
  content: "",
  targetAudience: "all",
  specificCategory: "",
  language: DEFAULT_LANGUAGE,
  imageUrl: "",
}

function extractVariables(content: string): string[] {
  return Array.from(new Set(content.match(/\{[^}]+\}/g) || []))
}

export function MessageTemplates({
  templates,
  onTemplateSelect,
  selectedGroupId,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateDeleteGroup,
  availableCustomVariables,
  contacts = [],
}: MessageTemplatesProps) {
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" })
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [formError, setFormError] = useState("")
  const [previewGroupId, setPreviewGroupId] = useState<string | null>(null)
  const [previewLanguage, setPreviewLanguage] = useState<string | null>(null)

  const groups = useMemo(() => groupTemplates(templates), [templates])
  const previewGroup = groups.find((group) => group.groupId === previewGroupId) ?? null

  const allAvailableVariables = [
    "{companyName}",
    "{companyCategory}",
    "{website}",
    "{city}",
    "{language}",
    ...availableCustomVariables.map((variable) => `{${variable}}`),
  ]

  // --- Editor plumbing --------------------------------------------------------

  const openCreate = () => {
    setDraft(EMPTY_DRAFT)
    setFormError("")
    setEditor({ mode: "create" })
  }

  const openAddLanguage = (group: TemplateGroup) => {
    const firstMissing = SUPPORTED_LANGUAGES.find((language) => !group.languages.includes(language.code))

    setDraft({
      // Name, category and audience belong to the template, so a new language
      // version inherits them rather than asking the operator to retype them.
      name: group.name,
      category: group.category,
      content: "",
      targetAudience: group.targetAudience,
      specificCategory: group.specificCategory ?? "",
      language: firstMissing?.code ?? DEFAULT_LANGUAGE,
      imageUrl: "",
    })
    setFormError("")
    setEditor({ mode: "add-language", group })
  }

  const openEdit = (group: TemplateGroup, variant: MessageTemplate) => {
    setDraft({
      name: variant.name,
      category: variant.category,
      content: variant.content,
      targetAudience: variant.targetAudience,
      specificCategory: variant.specificCategory ?? "",
      language: variant.language,
      imageUrl: variant.imageUrl ?? "",
    })
    setFormError("")
    setEditor({ mode: "edit", group, variant })
  }

  const closeEditor = () => {
    setEditor({ mode: "closed" })
    setDraft(EMPTY_DRAFT)
    setFormError("")
  }

  const handleSave = () => {
    if (!draft.name.trim()) {
      setFormError("Give the template a name")
      return
    }
    if (!draft.content.trim()) {
      setFormError("Write the message content")
      return
    }

    const targetGroup = editor.mode === "add-language" || editor.mode === "edit" ? editor.group : null

    // One version per language, otherwise resolution would be ambiguous.
    if (targetGroup) {
      const clash = targetGroup.variants.find(
        (variant) => variant.language === draft.language && (editor.mode !== "edit" || variant.id !== editor.variant.id),
      )
      if (clash) {
        setFormError(`This template already has a ${languageLabel(draft.language)} version`)
        return
      }
    }

    const shared = {
      name: draft.name.trim(),
      category: draft.category || "Custom",
      content: draft.content,
      variables: extractVariables(draft.content),
      targetAudience: draft.targetAudience,
      specificCategory: draft.specificCategory.trim() || undefined,
      language: draft.language,
      imageUrl: draft.imageUrl.trim() || undefined,
    }

    if (editor.mode === "edit") {
      onTemplateUpdate({ ...editor.variant, ...shared })
    } else {
      const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      onTemplateCreate({
        ...shared,
        id,
        groupId: editor.mode === "add-language" ? editor.group.groupId : id,
        // The first version of a new template is necessarily its default; the
        // server enforces this too.
        isFallback: editor.mode !== "add-language",
      })
    }

    closeEditor()
  }

  // --- Previews ---------------------------------------------------------------

  const previewWithSampleData = (content: string) => {
    let text = content
      .replace(/\{companyName\}/g, "ABC Company")
      .replace(/\{companyCategory\}/g, "Technology")
      .replace(/\{website\}/g, "https://abccompany.com")
      .replace(/\{city\}/g, "Khobar")
      .replace(/\{language\}/g, "Arabic")

    availableCustomVariables.forEach((variable) => {
      const name = variable.replace(/[{}]/g, "")
      text = text.replace(new RegExp(`\\{${name}\\}`, "g"), `[Sample ${name}]`)
    })

    return text
  }

  const getAudienceLabel = (group: TemplateGroup) => {
    if (group.targetAudience === "category_specific" && group.specificCategory) {
      return `${group.specificCategory} Category`
    }
    return AUDIENCE_OPTIONS.find((option) => option.value === group.targetAudience)?.label ?? "All Companies"
  }

  const getAudienceIcon = (group: TemplateGroup) =>
    AUDIENCE_OPTIONS.find((option) => option.value === group.targetAudience)?.icon ?? Users

  /**
   * Which languages this template still needs.
   *
   * Comparing the contact list against the template's versions turns a silent
   * fallback at send time into a visible gap at edit time, which is the only
   * point it is cheap to fix.
   */
  const coverageFor = (group: TemplateGroup) => {
    if (contacts.length === 0) return []
    return summariseLanguageCoverage(group, contacts).filter((entry) => !entry.covered && entry.language !== null)
  }

  const renderEditorForm = () => {
    if (editor.mode === "closed") return null

    const title =
      editor.mode === "create"
        ? "Create New Template"
        : editor.mode === "add-language"
          ? `Add a language version to "${editor.group.name}"`
          : `Edit ${languageLabel(draft.language)} version`

    // Name, category and audience describe the whole template. Offering them on
    // a translation would let one language silently rename the template.
    const showSharedFields = editor.mode === "create" || (editor.mode === "edit" && editor.variant.isFallback)

    const takenLanguages =
      editor.mode === "add-language"
        ? editor.group.languages
        : editor.mode === "edit"
          ? editor.group.languages.filter((code) => code !== editor.variant.language)
          : []

    return (
      <Card className="mb-4 border border-slate-200 shadow-none">
        <CardHeader className="bg-slate-50 p-4">
          <CardTitle className="text-base sm:text-lg text-slate-800">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 sm:space-y-4">
          {showSharedFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Template Name</Label>
                <Input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="e.g., Welcome New Clients"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Category</Label>
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-white text-xs sm:text-sm h-9 sm:h-10"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
              <Languages className="h-3.5 w-3.5" />
              Language
            </Label>
            <select
              value={draft.language}
              onChange={(event) => setDraft({ ...draft, language: event.target.value })}
              className="w-full px-3 py-2 border rounded-md bg-white text-xs sm:text-sm h-9 sm:h-10"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code} disabled={takenLanguages.includes(language.code)}>
                  {language.label} ({language.nativeLabel})
                  {takenLanguages.includes(language.code) ? " - already added" : ""}
                </option>
              ))}
            </select>
            <p className="text-[10px] sm:text-xs text-slate-500">
              Contacts whose language matches this get this version. Anyone else gets the default version.
            </p>
          </div>

          {showSharedFields && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Target Audience</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {AUDIENCE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <Button
                      key={option.value}
                      variant={draft.targetAudience === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDraft({ ...draft, targetAudience: option.value })}
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
          )}

          {showSharedFields && draft.targetAudience === "category_specific" && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Specific Category</Label>
              <Input
                value={draft.specificCategory}
                onChange={(event) => setDraft({ ...draft, specificCategory: event.target.value })}
                placeholder="e.g., Technology, Healthcare, Retail"
                className="text-xs sm:text-sm h-9 sm:h-10"
              />
            </div>
          )}

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium">Message Content</Label>
            <Textarea
              value={draft.content}
              onChange={(event) => setDraft({ ...draft, content: event.target.value })}
              placeholder="Use {companyName}, {companyCategory}, {website}, {city} for personalization"
              rows={5}
              dir={languageDir(draft.language)}
              className="font-mono text-xs sm:text-sm"
            />
            <div className="text-[10px] sm:text-xs text-gray-500 break-words">
              Available variables: {allAvailableVariables.map((variable) => `\`${variable}\``).join(", ")}
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
              <ImageIcon className="h-3.5 w-3.5" />
              Image for this language <span className="font-normal text-slate-500">(optional)</span>
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={draft.imageUrl}
                onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
                placeholder="https://example.com/offer-arabic.jpg"
                className="text-xs sm:text-sm h-9 sm:h-10 flex-1"
              />
              <ImageLinkInserter onInsert={(url) => setDraft({ ...draft, imageUrl: url })} />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500">
              Sent with this language version only, so an Arabic creative can differ from the English one. WhatsApp
              links cannot attach a file, so the URL is added to the end of the message and WhatsApp shows its preview.
            </p>
            {draft.imageUrl.trim() && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.imageUrl.trim()}
                alt=""
                className="h-20 w-20 rounded-md border border-slate-200 bg-white object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none"
                }}
              />
            )}
          </div>

          {formError && (
            <p className="flex items-center gap-1.5 text-xs sm:text-sm text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {formError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10 text-sm">
              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {editor.mode === "edit" ? "Update Version" : "Save"}
            </Button>
            <Button variant="outline" onClick={closeEditor} className="w-full sm:w-auto h-10 text-sm">
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const previewVariant =
    previewGroup &&
    (previewGroup.variants.find(
      (variant) => variant.language === (previewLanguage ?? previewGroup.fallback.language),
    ) ?? previewGroup.fallback)

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
              Each template holds one version per language. Contacts receive the version matching their language, with
              that version&apos;s image.
            </CardDescription>
          </div>
          <Button
            onClick={openCreate}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10 sm:h-auto text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            New Template
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {renderEditorForm()}

        {previewGroup && previewVariant && (
          <Card className="mb-4 border border-slate-200 shadow-none">
            <CardHeader className="bg-slate-50 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm sm:text-lg text-slate-800">Preview - {previewGroup.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewGroupId(null)
                    setPreviewLanguage(null)
                  }}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {previewGroup.variants.map((variant) => (
                  <Button
                    key={variant.id}
                    size="sm"
                    variant={previewVariant.id === variant.id ? "default" : "outline"}
                    onClick={() => setPreviewLanguage(variant.language)}
                    className="h-8 text-xs"
                  >
                    {languageLabel(variant.language)}
                    {variant.isFallback && <Star className="ml-1.5 h-3 w-3" />}
                  </Button>
                ))}
              </div>

              <div className="bg-white p-2 sm:p-4 rounded-lg border">
                <h4 className="font-semibold mb-1.5 sm:mb-2 text-xs sm:text-base">
                  What a {languageLabel(previewVariant.language)}-speaking contact receives:
                </h4>
                <div
                  dir={languageDir(previewVariant.language)}
                  className="whitespace-pre-wrap text-[10px] sm:text-sm bg-gray-50 p-2 sm:p-3 rounded"
                >
                  {previewWithSampleData(previewVariant.content)}
                </div>
                {previewVariant.imageUrl && (
                  <div className="mt-3 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewVariant.imageUrl}
                      alt=""
                      className="h-16 w-16 rounded-md border border-slate-200 object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none"
                      }}
                    />
                    <span className="text-[10px] sm:text-xs text-slate-500 break-all">{previewVariant.imageUrl}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => onTemplateSelect(previewGroup)}
                  className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-9 sm:h-10 text-sm"
                >
                  Use This Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewGroupId(null)
                    setPreviewLanguage(null)
                  }}
                  className="w-full sm:w-auto h-9 sm:h-10 text-sm"
                >
                  Close Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {groups.map((group) => {
            const AudienceIcon = getAudienceIcon(group)
            const isSelected = selectedGroupId === group.groupId
            const missing = coverageFor(group)

            return (
              <Card
                key={group.groupId}
                className={`transition-colors shadow-none ${
                  isSelected ? "ring-2 ring-slate-900 bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{group.name}</h3>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {group.category}
                        </Badge>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewGroupId(group.groupId)
                            setPreviewLanguage(group.fallback.language)
                          }}
                          title="Preview"
                          className="h-9 w-9 p-0"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTemplateDeleteGroup(group.fallback.id)}
                          title="Delete template and all its language versions"
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-gray-600">
                      <AudienceIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">{getAudienceLabel(group)}</span>
                    </div>

                    <div className="space-y-1.5 rounded-md border border-slate-200 bg-white p-2">
                      <p className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-slate-500">
                        <Languages className="h-3 w-3" />
                        Language versions
                      </p>
                      {group.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-slate-50"
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Badge
                              variant={variant.isFallback ? "default" : "outline"}
                              className="text-[10px] shrink-0 sm:text-xs"
                            >
                              {languageLabel(variant.language)}
                            </Badge>
                            <span className="hidden text-[10px] text-slate-400 sm:inline">
                              {languageNativeLabel(variant.language)}
                            </span>
                            {variant.isFallback && (
                              <span title="Default version - used when a contact's language has no version">
                                <Star className="h-3 w-3 shrink-0 text-amber-500" />
                              </span>
                            )}
                            {variant.imageUrl && (
                              <span title="Has an image">
                                <ImageIcon className="h-3 w-3 shrink-0 text-slate-400" />
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(group, variant)}
                              title={`Edit ${languageLabel(variant.language)} version`}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={group.variants.length === 1}
                              onClick={() => onTemplateDelete(variant.id)}
                              title={
                                group.variants.length === 1
                                  ? "The only version - delete the whole template instead"
                                  : `Delete ${languageLabel(variant.language)} version`
                              }
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 disabled:text-slate-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddLanguage(group)}
                        className="h-8 w-full text-[10px] sm:text-xs"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add language version
                      </Button>
                    </div>

                    {missing.length > 0 && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[10px] sm:text-xs text-amber-800">
                        <p className="flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Missing versions for your contacts
                        </p>
                        <p className="mt-1">
                          {missing.map((entry) => `${entry.contactCount} ${languageLabel(entry.language)}`).join(", ")}{" "}
                          - these get the {languageLabel(group.fallback.language)} version instead.
                        </p>
                      </div>
                    )}

                    <div className="text-[10px] sm:text-sm text-gray-600 line-clamp-2">
                      {group.fallback.content.substring(0, 100)}...
                    </div>

                    <Button
                      onClick={() => onTemplateSelect(group)}
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

        {groups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">
              No templates created yet. Click &quot;New Template&quot; to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
