"use client"

import { useState, useCallback, useMemo } from "react"
import { DuplicateDetectionService } from "../services/duplicate-detection-service"
import type { Contact, DuplicateGroup, DuplicateDetectionSettings } from "../types/contact"

export function useDuplicateDetection() {
  const [isScanning, setIsScanning] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [settings, setSettings] = useState<DuplicateDetectionSettings>({
    phoneThreshold: 0.9,
    nameThreshold: 0.8,
    companyThreshold: 0.85,
    websiteThreshold: 0.95,
    autoMergeThreshold: 0.9,
    enableAutoMerge: true,
  })

  const detectionService = useMemo(() => new DuplicateDetectionService(settings), [settings])

  const scanForDuplicates = useCallback(
    async (contacts: Contact[]) => {
      setIsScanning(true)
      try {
        // Simulate progress for large datasets
        if (contacts.length > 100) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        const groups = detectionService.detectDuplicates(contacts)
        setDuplicateGroups(groups)

        return {
          success: true,
          message: `Found ${groups.length} duplicate groups`,
          stats: {
            totalGroups: groups.length,
            totalDuplicates: groups.reduce((sum, group) => sum + group.contacts.length - 1, 0),
            autoMergeRecommended: groups.filter((g) => g.autoMergeRecommended).length,
          },
        }
      } catch (error) {
        console.error("Error scanning for duplicates:", error)
        return {
          success: false,
          message: "Failed to scan for duplicates",
        }
      } finally {
        setIsScanning(false)
      }
    },
    [detectionService],
  )

  const autoMergeGroup = useCallback(
    (group: DuplicateGroup): Contact => {
      return detectionService.autoMergeContacts(group)
    },
    [detectionService],
  )

  const updateSettings = useCallback((newSettings: Partial<DuplicateDetectionSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }, [])

  const clearResults = useCallback(() => {
    setDuplicateGroups([])
  }, [])

  const getStats = useCallback(() => {
    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.contacts.length - 1, 0)
    const highConfidence = duplicateGroups.filter((g) => g.confidence >= 0.9).length
    const autoMergeReady = duplicateGroups.filter((g) => g.autoMergeRecommended).length

    return {
      totalGroups: duplicateGroups.length,
      totalDuplicates,
      highConfidence,
      autoMergeReady,
      averageConfidence:
        duplicateGroups.length > 0
          ? duplicateGroups.reduce((sum, g) => sum + g.confidence, 0) / duplicateGroups.length
          : 0,
    }
  }, [duplicateGroups])

  return {
    isScanning,
    duplicateGroups,
    settings,
    scanForDuplicates,
    autoMergeGroup,
    updateSettings,
    clearResults,
    getStats,
  }
}
