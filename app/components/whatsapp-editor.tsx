"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Eye,
  EyeOff,
  Smile,
  Hash,
  MessageSquare,
  Sparkles,
  Clock,
  Users,
  Target,
  Save,
  Copy,
  RotateCcw,
  X,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
} from "lucide-react"

interface WhatsAppEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  variables?: string[]
  showVariables?: boolean
  onSave?: (template: { name: string; content: string; category: string }) => void
}

// Professional business emojis organized by category
const EMOJI_CATEGORIES = {
  greetings: {
    name: "Greetings",
    icon: "👋",
    emojis: ["👋", "🤝", "🙏", "👍", "👏", "🙌", "✋", "🤗", "😊", "😃", "🥳", "🎉"],
  },
  business: {
    name: "Business",
    icon: "💼",
    emojis: ["💼", "📈", "💰", "🎯", "⭐", "🚀", "💎", "🏆", "📊", "💡", "🔥", "⚡"],
  },
  communication: {
    name: "Communication",
    icon: "📞",
    emojis: ["📞", "📧", "💬", "📱", "📋", "📝", "✅", "❌", "🔔", "📢", "💭", "🗨️"],
  },
  time: {
    name: "Time & Urgency",
    icon: "⏰",
    emojis: ["⏰", "📅", "⏳", "🕐", "📆", "⌛", "🗓️", "⏱️", "🔜", "⚡", "🚨", "🎪"],
  },
  success: {
    name: "Success & Achievement",
    icon: "🏆",
    emojis: ["🏆", "🥇", "🎖️", "🏅", "⭐", "🌟", "✨", "💫", "🎊", "🎉", "🔝", "💯"],
  },
  offers: {
    name: "Offers & Deals",
    icon: "🎁",
    emojis: ["🎁", "💝", "🏷️", "💳", "💰", "💸", "🛍️", "🛒", "🎯", "🔥", "⚡", "💎"],
  },
}

// Professional message templates by category
const MESSAGE_TEMPLATES = {
  introduction: [
    {
      name: "Professional Introduction",
      content:
        "Hello {companyName}! 👋\n\nI hope this message finds you well. I'm reaching out because I believe our {companyCategory} solutions could benefit your business.\n\nWould you be open to a brief conversation about how we can help you achieve your goals?\n\nBest regards! 🤝",
      variables: ["companyName", "companyCategory"],
    },
    {
      name: "Warm Introduction",
      content:
        "Hi there! 😊\n\nI came across {companyName} and was impressed by your work in {companyCategory}.\n\nI'd love to explore potential collaboration opportunities that could benefit both our businesses.\n\nLooking forward to connecting! ⭐",
      variables: ["companyName", "companyCategory"],
    },
  ],
  followup: [
    {
      name: "Professional Follow-up",
      content:
        "Hi {companyName}! 👋\n\nFollowing up on our previous conversation about {companyCategory} solutions.\n\nI wanted to share some additional insights that might be valuable for your business growth.\n\nWhen would be a good time to continue our discussion? 📅",
      variables: ["companyName", "companyCategory"],
    },
    {
      name: "Value-Added Follow-up",
      content:
        "Hello again! 🤝\n\nI've been thinking about our conversation regarding {companyName}'s {companyCategory} needs.\n\nI have some specific ideas that could help you achieve better results. Would you like to hear them?\n\nBest regards! ⭐",
      variables: ["companyName", "companyCategory"],
    },
  ],
  offers: [
    {
      name: "Limited Time Offer",
      content:
        "*Special Offer for {companyName}!* 🎉\n\nWe're excited to offer you an exclusive opportunity to enhance your {companyCategory} operations.\n\n✨ *Limited time only* - This offer expires soon!\n\nInterested in learning more? Let's chat! 🚀",
      variables: ["companyName", "companyCategory"],
    },
    {
      name: "Value Proposition",
      content:
        "🎯 *Exclusive Opportunity for {companyName}*\n\nWe help {companyCategory} businesses like yours:\n• Increase efficiency by 40%\n• Reduce costs significantly\n• Scale operations smoothly\n\nReady to transform your business? 💼",
      variables: ["companyName", "companyCategory"],
    },
  ],
  closing: [
    {
      name: "Professional Closing",
      content:
        "Thank you for your time and consideration! 🙏\n\nI'm confident we can create significant value for {companyName} in the {companyCategory} space.\n\nLooking forward to our partnership! 🤝\n\nBest regards,\n[Your Name]",
      variables: ["companyName", "companyCategory"],
    },
    {
      name: "Call to Action",
      content:
        "Ready to take {companyName} to the next level? 🚀\n\nLet's schedule a quick 15-minute call to discuss how we can help your {companyCategory} business grow.\n\n📞 Click here to book: [Calendar Link]\n\nExcited to connect! ⭐",
      variables: ["companyName", "companyCategory"],
    },
  ],
}

// Smart suggestions based on message content
const SMART_SUGGESTIONS = {
  greeting: ["👋", "🤝", "😊"],
  offer: ["🎉", "🎁", "⭐", "🔥"],
  urgent: ["⚡", "🚨", "⏰"],
  success: ["🏆", "✅", "🎯"],
  question: ["❓", "🤔", "💭"],
  thanks: ["🙏", "❤️", "⭐"],
}

export default function WhatsAppEditor({
  value,
  onChange,
  placeholder = "Type your professional WhatsApp message...",
  variables = [],
  showVariables = true,
  onSave,
}: WhatsAppEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState("greetings")
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState("introduction")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateCategory, setTemplateCategory] = useState("custom")
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [estimatedReadTime, setEstimatedReadTime] = useState(0)
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Calculate statistics
  useEffect(() => {
    const chars = value.length
    const words = value.trim() ? value.trim().split(/\s+/).length : 0
    const readTime = Math.max(1, Math.ceil(words / 200)) // Average reading speed

    setCharCount(chars)
    setWordCount(words)
    setEstimatedReadTime(readTime)

    // Generate smart suggestions based on content
    const suggestions: string[] = []
    const lowerValue = value.toLowerCase()

    if (lowerValue.includes("hello") || lowerValue.includes("hi")) {
      suggestions.push(...SMART_SUGGESTIONS.greeting)
    }
    if (lowerValue.includes("offer") || lowerValue.includes("deal")) {
      suggestions.push(...SMART_SUGGESTIONS.offer)
    }
    if (lowerValue.includes("urgent") || lowerValue.includes("asap")) {
      suggestions.push(...SMART_SUGGESTIONS.urgent)
    }
    if (lowerValue.includes("success") || lowerValue.includes("achieve")) {
      suggestions.push(...SMART_SUGGESTIONS.success)
    }
    if (lowerValue.includes("?")) {
      suggestions.push(...SMART_SUGGESTIONS.question)
    }
    if (lowerValue.includes("thank")) {
      suggestions.push(...SMART_SUGGESTIONS.thanks)
    }

    setSmartSuggestions([...new Set(suggestions)].slice(0, 6))
  }, [value])

  const insertText = useCallback(
    (text: string) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.slice(0, start) + text + value.slice(end)

      onChange(newValue)

      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + text.length, start + text.length)
      }, 0)
    },
    [value, onChange],
  )

  const formatText = useCallback(
    (format: string) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.slice(start, end)

      let formattedText = ""
      let cursorOffset = 0

      switch (format) {
        case "bold":
          formattedText = `*${selectedText}*`
          cursorOffset = selectedText ? 0 : 1
          break
        case "italic":
          formattedText = `_${selectedText}_`
          cursorOffset = selectedText ? 0 : 1
          break
        case "strikethrough":
          formattedText = `~${selectedText}~`
          cursorOffset = selectedText ? 0 : 1
          break
        case "code":
          formattedText = `\`\`\`${selectedText}\`\`\``
          cursorOffset = selectedText ? 0 : 3
          break
        default:
          return
      }

      const newValue = value.slice(0, start) + formattedText + value.slice(end)
      onChange(newValue)

      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        const newPosition = selectedText ? end + formattedText.length - selectedText.length : start + cursorOffset
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    },
    [value, onChange],
  )

  const insertEmoji = useCallback(
    (emoji: string) => {
      insertText(emoji)
      setShowEmojiPicker(false)
    },
    [insertText],
  )

  const insertVariable = useCallback(
    (variable: string) => {
      insertText(`{${variable}}`)
    },
    [insertText],
  )

  const insertTemplate = useCallback(
    (template: { content: string }) => {
      onChange(template.content)
      setShowTemplates(false)
    },
    [onChange],
  )

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(value)
  }, [value])

  const clearEditor = useCallback(() => {
    onChange("")
  }, [onChange])

  const saveTemplate = useCallback(() => {
    if (templateName.trim() && onSave) {
      onSave({
        name: templateName.trim(),
        content: value,
        category: templateCategory,
      })
      setShowSaveDialog(false)
      setTemplateName("")
    }
  }, [templateName, value, templateCategory, onSave])

  const renderPreview = useCallback(() => {
    let preview = value

    // Apply WhatsApp formatting
    preview = preview
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/~([^~]+)~/g, "<del>$1</del>")
      .replace(/```([^`]+)```/g, '<code class="bg-gray-100 px-2 py-1 rounded font-mono text-sm">$1</code>')

    // Highlight variables
    variables.forEach((variable) => {
      const regex = new RegExp(`{${variable}}`, "g")
      preview = preview.replace(
        regex,
        `<span class="bg-emerald-100 text-emerald-800 px-1 rounded font-medium">{${variable}}</span>`,
      )
    })

    // Convert line breaks
    preview = preview.replace(/\n/g, "<br>")

    return preview
  }, [value, variables])

  const getMessageTone = () => {
    const lowerValue = value.toLowerCase()
    if (lowerValue.includes("urgent") || lowerValue.includes("asap")) return { tone: "Urgent", color: "text-red-600" }
    if (lowerValue.includes("offer") || lowerValue.includes("deal"))
      return { tone: "Promotional", color: "text-orange-600" }
    if (lowerValue.includes("thank") || lowerValue.includes("appreciate"))
      return { tone: "Grateful", color: "text-emerald-600" }
    if (lowerValue.includes("?")) return { tone: "Inquiry", color: "text-emerald-600" }
    return { tone: "Professional", color: "text-gray-600" }
  }

  const messageTone = getMessageTone()

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            Professional WhatsApp Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${messageTone.color} text-xs`}>
              {messageTone.tone}
            </Badge>
            <Button
              variant={showPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span className="hidden sm:inline">{showPreview ? "Edit" : "Preview"}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {/* Advanced Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-slate-50 rounded-lg border overflow-hidden">
          {/* Formatting Tools */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("bold")}
              title="Bold (*text*)"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("italic")}
              title="Italic (_text_)"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("strikethrough")}
              title="Strikethrough (~text~)"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <Strikethrough className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("code")}
              title="Code (```text```)"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-5 sm:h-6 hidden sm:block" />

          {/* Content Tools */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant={showEmojiPicker ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={showTemplates ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              title="Message Templates"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-5 sm:h-6 hidden sm:block" />

          {/* Action Tools */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button variant="ghost" size="sm" onClick={copyToClipboard} title="Copy Message" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={clearEditor} title="Clear Editor" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                title="Save as Template"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>

          <div className="hidden sm:block flex-1" />

          {/* Message Statistics */}
          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>{estimatedReadTime}s read</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>{charCount}/4096</span>
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            <span className="text-xs sm:text-sm font-medium text-emerald-800">Smart Suggestions:</span>
            <div className="flex gap-1 flex-wrap">
              {smartSuggestions.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => insertEmoji(emoji)}
                  className="h-6 w-6 p-0 text-sm hover:bg-emerald-100"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Professional Emoji Picker */}
        {showEmojiPicker && (
          <Card className="border border-emerald-200 bg-emerald-50 mx-0 sm:mx-auto shadow-none">
            <CardHeader className="pb-1.5 sm:pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                  <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Professional Emojis
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowEmojiPicker(false)} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={selectedEmojiCategory} onValueChange={setSelectedEmojiCategory}>
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 h-auto">
                  {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                    <TabsTrigger key={key} value={key} className="text-[10px] sm:text-xs flex items-center gap-1">
                      <span>{category.icon}</span>
                      <span className="hidden sm:inline">{category.name.split(" ")[0]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                  <TabsContent key={key} value={key} className="mt-3 sm:mt-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 sm:gap-2">
                      {category.emojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => insertEmoji(emoji)}
                          className="h-8 w-8 sm:h-10 sm:w-10 p-0 text-base sm:text-lg hover:bg-emerald-100 hover:scale-110 transition-all"
                          title={`Insert ${emoji}`}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Professional Templates */}
        {showTemplates && (
          <Card className="border border-emerald-200 bg-emerald-50 mx-0 sm:mx-auto shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Professional Templates
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={selectedTemplateCategory} onValueChange={setSelectedTemplateCategory}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                  {Object.entries(MESSAGE_TEMPLATES).map(([key, templates]) => (
                    <TabsTrigger key={key} value={key} className="text-[10px] sm:text-xs capitalize">
                      {key}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(MESSAGE_TEMPLATES).map(([key, templates]) => (
                  <TabsContent key={key} value={key} className="mt-3 sm:mt-4 space-y-2">
                    {templates.map((template, index) => (
                      <Card key={index} className="p-2 sm:p-3 hover:bg-white/50 cursor-pointer transition-colors">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs sm:text-sm mb-1">{template.name}</h4>
                            <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2">
                              {template.content.substring(0, 100)}...
                            </p>
                            <div className="flex gap-0.5 sm:gap-1 mt-1.5 sm:mt-2 flex-wrap">
                              {template.variables.map((variable) => (
                                <Badge key={variable} variant="secondary" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => insertTemplate(template)} className="text-xs h-8 sm:h-8 w-full sm:w-auto">
                            Use
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Save Template Dialog */}
        {showSaveDialog && (
          <Card className="border border-emerald-200 bg-emerald-50 mx-0 sm:mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Save as Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <Label htmlFor="template-name" className="text-[10px] sm:text-xs">
                    Template Name
                  </Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="h-7 sm:h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category" className="text-xs">
                    Category
                  </Label>
                  <Input
                    id="template-category"
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    placeholder="custom"
                    className="h-7 sm:h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <Button size="sm" onClick={saveTemplate} disabled={!templateName.trim()} className="text-xs h-7 sm:h-8">
                  <Save className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)} className="text-xs h-7 sm:h-8">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editor/Preview */}
        <div className="min-h-[250px] sm:min-h-[300px]">
          {showPreview ? (
            <Card className="bg-emerald-50 border-emerald-200 shadow-none">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-xs sm:text-sm text-emerald-800">WhatsApp Preview</div>
                    <div className="text-[10px] sm:text-xs text-emerald-600">How your message will appear</div>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-emerald-700">
                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span>Emoji-safe</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                  {value ? (
                    <div
                      className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderPreview() }}
                    />
                  ) : (
                    <div className="text-gray-400 text-xs sm:text-sm italic">Your message preview will appear here...</div>
                  )}
                </div>

                {/* Preview Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-3 sm:mt-4 text-center">
                  <div className="bg-white/50 rounded-lg p-1.5 sm:p-2">
                    <div className="text-sm sm:text-lg font-bold text-emerald-800">{charCount}</div>
                    <div className="text-[10px] sm:text-xs text-slate-600">Characters</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-1.5 sm:p-2">
                    <div className="text-lg font-bold text-emerald-800">{wordCount}</div>
                    <div className="text-xs text-slate-600">Words</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-1.5 sm:p-2">
                    <div className="text-lg font-bold text-emerald-800">{value.split("\n").length}</div>
                    <div className="text-xs text-slate-600">Lines</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-1.5 sm:p-2">
                    <div className="text-lg font-bold text-emerald-800">{estimatedReadTime}s</div>
                    <div className="text-xs text-slate-600">Read Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-h-[250px] sm:min-h-[300px] text-sm sm:text-base leading-relaxed resize-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Enhanced Status Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 p-2 bg-gray-50 rounded-lg border">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span>{charCount}/4096 chars</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span>{wordCount} words</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span>{estimatedReadTime}s read</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{value.split("\n").length} lines</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600">
                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span>Emoji-safe encoding</span>
                  </div>
                  {charCount > 3500 && (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Approaching limit</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Variables Section */}
        {showVariables && variables.length > 0 && (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                <span className="text-xs sm:text-sm font-medium text-emerald-800">Available Variables</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {variables.map((variable) => (
                  <Button
                    key={variable}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="text-[10px] sm:text-xs h-6 sm:h-7 border-emerald-300 hover:bg-emerald-100"
                  >
                    <Hash className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    {variable}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Professional Tips */}
        <Card className="bg-slate-50 border-slate-200 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Professional Tips</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                <span>Use *bold* for important points</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                <span>Keep messages under 160 words</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                <span>Include clear call-to-action</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                <span>Use emojis sparingly but effectively</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
