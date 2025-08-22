"use client"

import { useState, useEffect } from "react"
import { STORAGE_KEYS } from "@/utils/constants"

export function useMessagePersistence(initialMessage = "") {
  const [customMessage, setCustomMessage] = useState(initialMessage)

  // Load saved message on mount
  useEffect(() => {
    try {
      const savedMessage = localStorage.getItem(STORAGE_KEYS.CUSTOM_MESSAGE)
      if (savedMessage && savedMessage.trim() !== "") {
        setCustomMessage(savedMessage)
      }
    } catch (error) {
      console.error("Failed to load saved custom message:", error)
    }
  }, [])

  // Save message when it changes
  useEffect(() => {
    try {
      if (customMessage.trim() !== "") {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_MESSAGE, customMessage)
      }
    } catch (error) {
      console.error("Failed to save custom message:", error)
    }
  }, [customMessage])

  return {
    customMessage,
    setCustomMessage,
  }
}
