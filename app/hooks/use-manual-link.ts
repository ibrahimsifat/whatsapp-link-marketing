"use client"

import { useState } from "react"
import { PhoneService } from "../services/phone-service"
import { WhatsAppService } from "../services/whatsapp-service"
import { ClipboardUtils } from "../utils/clipboard-utils"
import { ToastUtils } from "../utils/toast-utils"

interface ManualLinkState {
  manualPhoneNumber: string
  manualPhoneError: string
  manualLink: string
  manualLinkCopied: boolean
}

export function useManualLink(customMessage: string) {
  const [state, setState] = useState<ManualLinkState>({
    manualPhoneNumber: "",
    manualPhoneError: "",
    manualLink: "",
    manualLinkCopied: false,
  })

  const updateState = (updates: Partial<ManualLinkState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const handleGenerateManualLink = () => {
    updateState({ manualLinkCopied: false, manualPhoneError: "" })

    if (!state.manualPhoneNumber) {
      updateState({ manualPhoneError: "Please enter a phone number.", manualLink: "" })
      return
    }

    const normalizedPhone = PhoneService.normalizePhoneNumber(state.manualPhoneNumber)
    if (!normalizedPhone) {
      updateState({ manualPhoneError: "Invalid Saudi phone number format.", manualLink: "" })
      return
    }

    const link = WhatsAppService.generateWhatsAppLink(normalizedPhone, customMessage)
    updateState({ manualLink: link })
    ToastUtils.success("WhatsApp link generated!")
  }

  const handleCopyManualLink = async () => {
    if (state.manualLink) {
      const success = await ClipboardUtils.copyToClipboard(state.manualLink)
      if (success) {
        updateState({ manualLinkCopied: true })
        setTimeout(() => updateState({ manualLinkCopied: false }), 2000)
        ToastUtils.success("Link copied to clipboard!")
      } else {
        ToastUtils.error("Failed to copy link")
      }
    }
  }

  return {
    state,
    updateState,
    handleGenerateManualLink,
    handleCopyManualLink,
  }
}
