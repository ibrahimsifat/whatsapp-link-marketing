import { WhatsAppService } from "./whatsapp-service"
import type { Contact } from "../types/contact"

export interface BatchSendOptions {
  contacts: Contact[]
  delayMs: number
  onProgress: (index: number) => void
  onComplete: () => void
  onContactSent: (contactId: string) => void
}

export class BatchSendService {
  private static timeoutRef: NodeJS.Timeout | null = null
  private static isRunning = false

  /**
   * Starts batch sending process
   */
  static startBatchSend(options: BatchSendOptions): void {
    if (this.isRunning) {
      this.stopBatchSend()
    }

    this.isRunning = true
    this.processBatch(options, 0)
  }

  /**
   * Stops batch sending process
   */
  static stopBatchSend(): void {
    this.isRunning = false
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef)
      this.timeoutRef = null
    }
  }

  /**
   * Processes individual batch item
   */
  private static processBatch(options: BatchSendOptions, index: number): void {
    if (index >= options.contacts.length || !this.isRunning) {
      this.isRunning = false
      if (this.timeoutRef) {
        clearTimeout(this.timeoutRef)
        this.timeoutRef = null
      }
      options.onComplete()
      return
    }

    const contact = options.contacts[index]

    // Open WhatsApp chat
    WhatsAppService.openWhatsAppChat(contact.whatsappLink)

    // Update contact status
    options.onContactSent(contact.id)

    // Update progress
    options.onProgress(index + 1)

    // Schedule next contact
    this.timeoutRef = setTimeout(() => {
      this.processBatch(options, index + 1)
    }, options.delayMs)
  }

  /**
   * Gets current batch sending status
   */
  static isCurrentlyRunning(): boolean {
    return this.isRunning
  }

  /**
   * Estimates total time for batch sending
   */
  static estimateTotalTime(contactCount: number, delayMs: number): number {
    return contactCount * delayMs
  }

  /**
   * Formats estimated time for display
   */
  static formatEstimatedTime(totalMs: number): string {
    const minutes = Math.floor(totalMs / 60000)
    const seconds = Math.floor((totalMs % 60000) / 1000)

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }
}
