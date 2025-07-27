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
        `<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">{${variable}}</span>`,
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
      return { tone: "Grateful", color: "text-green-600" }
    if (lowerValue.includes("?")) return { tone: "Inquiry", color: "text-blue-600" }
    return { tone: "Professional", color: "text-gray-600" }
  }

  const messageTone = getMessageTone()

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Professional WhatsApp Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={messageTone.color}>
              {messageTone.tone}
            </Badge>
            <Button
              variant={showPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Advanced Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
          {/* Formatting Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("bold")}
              title="Bold (*text*)"
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("italic")}
              title="Italic (_text_)"
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("strikethrough")}
              title="Strikethrough (~text~)"
              className="h-8 w-8 p-0"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText("code")}
              title="Code (```text```)"
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Content Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={showEmojiPicker ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
              className="h-8 w-8 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              variant={showTemplates ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              title="Message Templates"
              className="h-8 w-8 p-0"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Action Tools */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={copyToClipboard} title="Copy Message" className="h-8 w-8 p-0">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={clearEditor} title="Clear Editor" className="h-8 w-8 p-0">
              <RotateCcw className="h-4 w-4" />
            </Button>
            {onSave && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                title="Save as Template"
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1" />

          {/* Message Statistics */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{wordCount} words</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{estimatedReadTime}s read</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{charCount}/4096</span>
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Smart Suggestions:</span>
            <div className="flex gap-1">
              {smartSuggestions.map((emoji, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => insertEmoji(emoji)}
                  className="h-6 w-6 p-0 text-sm hover:bg-blue-100"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Professional Emoji Picker */}
        {showEmojiPicker && (
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smile className="h-4 w-4" />
                  Professional Emojis
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowEmojiPicker(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={selectedEmojiCategory} onValueChange={setSelectedEmojiCategory}>
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                  {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                    <TabsTrigger key={key} value={key} className="text-xs flex items-center gap-1">
                      <span>{category.icon}</span>
                      <span className="hidden sm:inline">{category.name.split(" ")[0]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                  <TabsContent key={key} value={key} className="mt-4">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                      {category.emojis.map((emoji, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => insertEmoji(emoji)}
                          className="h-10 w-10 p-0 text-lg hover:bg-green-100 hover:scale-110 transition-all"
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
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Professional Templates
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={selectedTemplateCategory} onValueChange={setSelectedTemplateCategory}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  {Object.entries(MESSAGE_TEMPLATES).map(([key, templates]) => (
                    <TabsTrigger key={key} value={key} className="text-xs capitalize">
                      {key}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(MESSAGE_TEMPLATES).map(([key, templates]) => (
                  <TabsContent key={key} value={key} className="mt-4 space-y-2">
                    {templates.map((template, index) => (
                      <Card key={index} className="p-3 hover:bg-white/50 cursor-pointer transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {template.content.substring(0, 100)}...
                            </p>
                            <div className="flex gap-1 mt-2">
                              {template.variables.map((variable) => (
                                <Badge key={variable} variant="secondary" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => insertTemplate(template)} className="ml-2">
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
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save as Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="template-name" className="text-xs">
                    Template Name
                  </Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="h-8"
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
                    className="h-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveTemplate} disabled={!templateName.trim()}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editor/Preview */}
        <div className="min-h-[300px]">
          {showPreview ? (
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-green-800">WhatsApp Preview</div>
                    <div className="text-xs text-green-600">How your message will appear</div>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    <span>Emoji-safe</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  {value ? (
                    <div
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderPreview() }}
                    />
                  ) : (
                    <div className="text-gray-400 text-sm italic">Your message preview will appear here...</div>
                  )}
                </div>

                {/* Preview Statistics */}
                <div className="grid grid-cols-4 gap-4 mt-4 text-center">
                  <div className="bg-white/50 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-800">{charCount}</div>
                    <div className="text-xs text-green-600">Characters</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-800">{wordCount}</div>
                    <div className="text-xs text-green-600">Words</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-800">{value.split("\n").length}</div>
                    <div className="text-xs text-green-600">Lines</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-800">{estimatedReadTime}s</div>
                    <div className="text-xs text-green-600">Read Time</div>
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
                className="min-h-[300px] text-base leading-relaxed resize-none focus:ring-2 focus:ring-green-500"
              />

              {/* Enhanced Status Bar */}
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{charCount}/4096 chars</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{wordCount} words</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{estimatedReadTime}s read</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{value.split("\n").length} lines</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Emoji-safe encoding</span>
                  </div>
                  {charCount > 3500 && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
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
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Available Variables</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <Button
                    key={variable}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="text-xs h-7 border-blue-300 hover:bg-blue-100"
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {variable}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Professional Tips */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Professional Tips</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-purple-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Use *bold* for important points</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Keep messages under 160 words</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Include clear call-to-action</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Use emojis sparingly but effectively</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
