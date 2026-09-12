"use client"

/**
 * Custom message persistence
 *
 * The active message now lives in the `app_settings` table instead of the
 * operator's localStorage, so it follows them between browsers and machines.
 *
 * Writes are debounced: this hook is driven by an editor firing on every
 * keystroke, and one HTTP round-trip per character would be both slow and
 * pointless.
 */

import { useCallback, useEffect, useRef, useState } from "react"

import { settingsApi } from "@/lib/api/client"

const SETTING_KEY = "custom_message"
const SAVE_DEBOUNCE_MS = 800

/** Survives a reload if the network drops mid-edit. */
const DRAFT_CACHE_KEY = "whatsapp-custom-message-draft"

export function useMessagePersistence(initialMessage = "") {
  const [customMessage, setCustomMessage] = useState(initialMessage)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** The value last confirmed by the server; prevents redundant writes. */
  const lastSaved = useRef<string | null>(null)

  // --- Load ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false

    settingsApi
      .getAll()
      .then((settings) => {
        if (cancelled) return

        const stored = settings[SETTING_KEY]
        if (stored) {
          setCustomMessage(stored)
          lastSaved.current = stored
        } else {
          // Nothing saved server-side yet: fall back to an unsaved local draft.
          try {
            const draft = localStorage.getItem(DRAFT_CACHE_KEY)
            if (draft?.trim()) setCustomMessage(draft)
          } catch {
            // Private browsing and similar; not worth reporting.
          }
        }
      })
      .catch((error) => {
        console.error("[settings] Failed to load the saved message:", error)
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // --- Save (debounced) ------------------------------------------------------
  useEffect(() => {
    // Do not write back before the initial load resolves, or the empty default
    // would overwrite the stored message.
    if (!isLoaded) return
    if (customMessage === lastSaved.current) return

    try {
      localStorage.setItem(DRAFT_CACHE_KEY, customMessage)
    } catch {
      // Non-fatal: the draft cache is a convenience, not the source of truth.
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)

    saveTimer.current = setTimeout(async () => {
      setIsSaving(true)
      setSaveError(null)

      try {
        await settingsApi.save({ [SETTING_KEY]: customMessage })
        lastSaved.current = customMessage
      } catch (error) {
        console.error("[settings] Failed to save the custom message:", error)
        setSaveError("Could not save your message. It is kept locally and will retry on the next edit.")
      } finally {
        setIsSaving(false)
      }
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [customMessage, isLoaded])

  /** Force an immediate write, bypassing the debounce. */
  const flush = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (customMessage === lastSaved.current) return

    setIsSaving(true)
    try {
      await settingsApi.save({ [SETTING_KEY]: customMessage })
      lastSaved.current = customMessage
    } catch (error) {
      console.error("[settings] Failed to flush the custom message:", error)
    } finally {
      setIsSaving(false)
    }
  }, [customMessage])

  return { customMessage, setCustomMessage, isLoaded, isSaving, saveError, flush }
}
