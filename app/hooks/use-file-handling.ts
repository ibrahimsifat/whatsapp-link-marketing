"use client"

import type React from "react"

import { useState } from "react"
import { FileService } from "../services/file-service"
import { APP_CONSTANTS } from "../constants/app-constants"
import { ToastUtils } from "../utils/toast-utils"
import type { Contact } from "../types/contact"

interface FileHandlingState {
  dragActive: boolean
  fileError: string
  isLoading: boolean
  uploadPassword: string
  passwordError: string
  showPassword: boolean
}

export function useFileHandling(customMessage: string, onContactsLoaded: (contacts: Contact[]) => void) {
  const [state, setState] = useState<FileHandlingState>({
    dragActive: false,
    fileError: "",
    isLoading: false,
    uploadPassword: "",
    passwordError: "",
    showPassword: false,
  })

  const updateState = (updates: Partial<FileHandlingState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      updateState({ dragActive: true })
    } else if (e.type === "dragleave") {
      updateState({ dragActive: false })
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateState({ dragActive: false })

    if (state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD) {
      updateState({ passwordError: "Incorrect password. Please enter the correct password to upload." })
      return
    }
    updateState({ passwordError: "" })

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (isValidFileType(file)) {
        await processFile(file)
      } else {
        updateState({ fileError: "Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)" })
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD) {
      updateState({ passwordError: "Incorrect password. Please enter the correct password to upload." })
      e.target.value = ""
      return
    }
    updateState({ passwordError: "" })

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isValidFileType(file)) {
        await processFile(file)
      } else {
        updateState({ fileError: "Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)" })
      }
    }
  }

  const isValidFileType = (file: File): boolean => {
    return (
      file.type.includes("sheet") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".csv") ||
      file.type === "text/csv"
    )
  }

  const processFile = async (file: File) => {
    const validation = FileService.validateFileSize(file)
    if (!validation.isValid) {
      updateState({ fileError: validation.error || "File size validation failed" })
      return
    }

    updateState({ isLoading: true, fileError: "" })

    try {
      const result = await FileService.processFile(file, customMessage)

      if (result.errors.length > 0) {
        updateState({ fileError: result.errors.join(", ") })
        ToastUtils.error("File processing completed with errors")
      } else {
        ToastUtils.success(`Successfully processed ${result.contacts.length} contacts from ${file.name}`)
      }

      onContactsLoaded(result.contacts)
    } catch (error) {
      console.error("Error processing file:", error)
      updateState({ fileError: "Unexpected error occurred while processing the file" })
      ToastUtils.error("Failed to process file")
    } finally {
      updateState({ isLoading: false })
    }
  }

  return {
    state,
    updateState,
    handleDrag,
    handleDrop,
    handleFileChange,
    isValidFileType,
    processFile,
  }
}
