import { WhatsAppService } from "./whatsapp-service"
import { TemplateService } from "./template-service"
import type { Contact, MessageTemplate } from "../types/contact"

export interface BulkMessageOptions {
  contacts: Contact[]
  message: string
  template?: MessageTemplate
  delayMs: number
  onProgress: (current: number, total: number, contact: Contact) => void
  onComplete: (result: BulkMessageResult) => void
  onContactProcessed: (contact: Contact, success: boolean, error?: string) => void
  onError: (error: string) => void
}

export interface BulkMessageResult {
  successful: number
  failed: number
  total: number
  duration: number
  errors: Array<{ contact: Contact; error: string }>
}

export interface BulkMessageProgress {
  current: number
  total: number
  percentage: number
  isRunning: boolean
  isPaused: boolean
  currentContact: Contact | null
  estimatedTimeRemaining: number
  startTime: number
}

export interface ContactValidationResult {
  valid: Contact[]
  invalid: Contact[]
  errors: string[]
}

class BulkMessageServiceClass {
  private isRunning = false
  private isPaused = false
  private currentTimeout: NodeJS.Timeout | null = null
  private progress: BulkMessageProgress | null = null
  private options: BulkMessageOptions | null = null
  private currentIndex = 0
  private results: BulkMessageResult = {
    successful: 0,
    failed: 0,
    total: 0,
    duration: 0,
    errors: [],
  }

  validateContacts(contacts: Contact[]): ContactValidationResult {
    const valid: Contact[] = []
    const invalid: Contact[] = []
    const errors: string[] = []

    contacts.forEach((contact) => {
      if (!contact.normalized || contact.normalized.length < 10) {
        invalid.push(contact)
        errors.push(`Invalid phone number: ${contact.original}`)
        return
      }

      if (!contact.companyName || contact.companyName.trim() === "") {
        // Still valid but warn
        valid.push(contact)
      } else {
        valid.push(contact)
      }
    })

    return { valid, invalid, errors }
  }

  generatePreview(
    contacts: Contact[],
    message: string,
    template?: MessageTemplate,
  ): Array<{ contact: Contact; preview: string }> {
    return contacts.slice(0, 5).map((contact) => ({
      contact,
      preview: TemplateService.replaceVariables(message, contact),
    }))
  }

  estimateTotalTime(contactCount: number, delayMs: number): number {
    return contactCount * delayMs
  }

  formatEstimatedTime(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  startBulkSend(options: BulkMessageOptions) {
    if (this.isRunning) {
      options.onError("Bulk send is already running")
      return
    }

    this.options = options
    this.isRunning = true
    this.isPaused = false
    this.currentIndex = 0
    this.results = {
      successful: 0,
      failed: 0,
      total: options.contacts.length,
      duration: 0,
      errors: [],
    }

    this.progress = {
      current: 0,
      total: options.contacts.length,
      percentage: 0,
      isRunning: true,
      isPaused: false,
      currentContact: null,
      estimatedTimeRemaining: this.estimateTotalTime(options.contacts.length, options.delayMs),
      startTime: Date.now(),
    }

    this.processNextContact()
  }

  private processNextContact() {
    if (!this.options || !this.progress) return

    if (this.currentIndex >= this.options.contacts.length) {
      this.completeBulkSend()
      return
    }

    if (this.isPaused) return

    const contact = this.options.contacts[this.currentIndex]
    this.progress.currentContact = contact
    this.progress.current = this.currentIndex + 1
    this.progress.percentage = Math.round((this.progress.current / this.progress.total) * 100)

    const elapsed = Date.now() - this.progress.startTime
    const avgTimePerContact = elapsed / this.progress.current
    this.progress.estimatedTimeRemaining = avgTimePerContact * (this.progress.total - this.progress.current)

    this.options.onProgress(this.progress.current, this.progress.total, contact)

    try {
      const personalizedMessage = TemplateService.replaceVariables(this.options.message, contact)
      const whatsappLink = WhatsAppService.generateWhatsAppLink(contact.normalized, personalizedMessage)

      // Open WhatsApp link
      window.open(whatsappLink, "_blank")

      this.results.successful++
      this.options.onContactProcessed(contact, true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      this.results.failed++
      this.results.errors.push({ contact, error: errorMessage })
      this.options.onContactProcessed(contact, false, errorMessage)
    }

    this.currentIndex++

    // Schedule next contact
    this.currentTimeout = setTimeout(() => {
      this.processNextContact()
    }, this.options.delayMs)
  }

  private completeBulkSend() {
    if (!this.options || !this.progress) return

    this.results.duration = Date.now() - this.progress.startTime
    this.isRunning = false
    this.isPaused = false
    this.progress.isRunning = false
    this.progress.currentContact = null

    this.options.onComplete(this.results)
    this.cleanup()
  }

  pauseBulkSend() {
    if (!this.isRunning || this.isPaused) return

    this.isPaused = true
    if (this.progress) {
      this.progress.isPaused = true
    }

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout)
      this.currentTimeout = null
    }
  }

  resumeBulkSend() {
    if (!this.isRunning || !this.isPaused) return

    this.isPaused = false
    if (this.progress) {
      this.progress.isPaused = false
    }

    this.processNextContact()
  }

  stopBulkSend() {
    this.isRunning = false
    this.isPaused = false

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout)
      this.currentTimeout = null
    }

    if (this.progress) {
      this.progress.isRunning = false
      this.progress.isPaused = false
    }

    this.cleanup()
  }

  getProgress(): BulkMessageProgress | null {
    return this.progress
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning
  }

  private cleanup() {
    this.options = null
    this.progress = null
    this.currentIndex = 0
    this.results = {
      successful: 0,
      failed: 0,
      total: 0,
      duration: 0,
      errors: [],
    }
  }
}

export const BulkMessageService = new BulkMessageServiceClass()
