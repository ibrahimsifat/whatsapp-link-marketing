"use client"

/**
 * Message templates hook
 *
 * Templates used to live in React state seeded from a constant, which meant
 * every template the operator wrote vanished on refresh. They are now rows in
 * D1, and the starter set is seeded server-side on first load.
 *
 * All three mutations are optimistic: the UI updates immediately and rolls back
 * if the write fails, so editing a template feels instant despite the HTTP
 * round-trip to Cloudflare.
 */

import { useCallback, useEffect, useState } from "react"

import type { MessageTemplate } from "../types/contact"
import { ApiError, templatesApi, type StoredTemplate } from "@/lib/api/client"

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useTemplates() {
  const [templates, setTemplates] = useState<StoredTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setTemplates(await templatesApi.list())
    } catch (err) {
      const message = toMessage(err, "Failed to load templates")
      setError(message)
      console.error("[templates]", message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  const createTemplate = useCallback(async (template: MessageTemplate) => {
    const optimistic: StoredTemplate = { ...template, isDefault: false }
    setTemplates((prev) => [...prev, optimistic])

    try {
      const saved = await templatesApi.create(template)
      setTemplates((prev) => prev.map((t) => (t.id === optimistic.id ? saved : t)))
      return { success: true, message: "Template created successfully", template: saved }
    } catch (err) {
      setTemplates((prev) => prev.filter((t) => t.id !== optimistic.id))
      return { success: false, message: toMessage(err, "Failed to create template") }
    }
  }, [])

  const updateTemplate = useCallback(
    async (template: MessageTemplate) => {
      const previous = templates
      setTemplates((prev) => prev.map((t) => (t.id === template.id ? { ...t, ...template } : t)))

      try {
        const saved = await templatesApi.update(template.id, template)
        setTemplates((prev) => prev.map((t) => (t.id === template.id ? saved : t)))
        return { success: true, message: "Template updated successfully", template: saved }
      } catch (err) {
        setTemplates(previous)
        return { success: false, message: toMessage(err, "Failed to update template") }
      }
    },
    [templates],
  )

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      const previous = templates
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))

      try {
        await templatesApi.remove(templateId)
        return { success: true, message: "Template deleted successfully" }
      } catch (err) {
        setTemplates(previous)
        return { success: false, message: toMessage(err, "Failed to delete template") }
      }
    },
    [templates],
  )

  /**
   * Delete a template and every language version of it.
   *
   * Separate from `deleteTemplate`, which removes a single language version:
   * the two are different intents and the UI offers them in different places.
   */
  const deleteTemplateGroup = useCallback(
    async (templateId: string) => {
      const previous = templates
      const target = templates.find((template) => template.id === templateId)
      const groupId = target?.groupId ?? templateId

      setTemplates((prev) => prev.filter((template) => (template.groupId ?? template.id) !== groupId))

      try {
        const result = await templatesApi.removeGroup(templateId)
        return { success: true, message: `Template deleted (${result.removed} language versions)` }
      } catch (err) {
        setTemplates(previous)
        return { success: false, message: toMessage(err, "Failed to delete template") }
      }
    },
    [templates],
  )

  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    deleteTemplateGroup,
  }
}
