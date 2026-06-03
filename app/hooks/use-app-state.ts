"use client"

import { useState, useCallback } from "react"
import type { Contact, MessageTemplate } from "../types/contact"
import { DEFAULT_TEMPLATES, APP_CONSTANTS } from "../constants/app-constants"

export interface AppState {
  // Contact management
  contacts: Contact[]
  selectedContact: Contact | null

  // File upload
  isLoading: boolean
  dragActive: boolean
  fileError: string
  // Templates
  templates: MessageTemplate[]
  selectedTemplate: MessageTemplate | null
  customMessage: string

  // Filters
  filterCategory: string
  filterWebsite: string
  filterStatus: string
  searchTerm: string

  // Manual entry
  manualPhoneNumber: string
  manualLink: string
  manualLinkCopied: boolean
  manualPhoneError: string

  // Batch sending
  isBatchSending: boolean
  currentBatchIndex: number

  // UI state
  copiedIndex: number | null

  // Pagination
  currentPage: number
  itemsPerPage: number
}

const initialState: AppState = {
  // Contact management
  contacts: [],
  selectedContact: null,

  // File upload
  isLoading: false,
  dragActive: false,
  fileError: "",
  // Templates
  templates: DEFAULT_TEMPLATES,
  selectedTemplate: null,
  customMessage: "",

  // Filters
  filterCategory: "all",
  filterWebsite: "all",
  filterStatus: "all",
  searchTerm: "",

  // Manual entry
  manualPhoneNumber: "",
  manualLink: "",
  manualLinkCopied: false,
  manualPhoneError: "",

  // Batch sending
  isBatchSending: false,
  currentBatchIndex: 0,

  // UI state
  copiedIndex: null,

  // Pagination
  currentPage: 1,
  itemsPerPage: APP_CONSTANTS.DEFAULT_ITEMS_PER_PAGE,
}

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState)

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prevState) => ({ ...prevState, ...updates }))
  }, [])

  const resetState = useCallback(() => {
    setState(initialState)
  }, [])

  const resetFilters = useCallback(() => {
    updateState({
      filterCategory: "all",
      filterWebsite: "all",
      filterStatus: "all",
      searchTerm: "",
      currentPage: 1,
    })
  }, [updateState])

  const resetPagination = useCallback(() => {
    updateState({ currentPage: 1 })
  }, [updateState])

  return {
    state,
    updateState,
    resetState,
    resetFilters,
    resetPagination,
  }
}
