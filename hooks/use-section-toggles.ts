"use client"

import { useState, useEffect } from "react"
import { STORAGE_KEYS, DEFAULT_SECTION_STATES } from "@/utils/constants"

export function useSectionToggles() {
  const [sectionStates, setSectionStates] = useState(DEFAULT_SECTION_STATES)

  // Load saved section states on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECTION_TOGGLES)
      if (saved) {
        const parsedStates = JSON.parse(saved)
        setSectionStates({ ...DEFAULT_SECTION_STATES, ...parsedStates })
      }
    } catch (error) {
      console.error("Failed to load section states:", error)
    }
  }, [])

  // Save section states when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SECTION_TOGGLES, JSON.stringify(sectionStates))
    } catch (error) {
      console.error("Failed to save section states:", error)
    }
  }, [sectionStates])

  const toggleSection = (section: keyof typeof DEFAULT_SECTION_STATES) => {
    setSectionStates((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return {
    ...sectionStates,
    toggleSection,
  }
}
