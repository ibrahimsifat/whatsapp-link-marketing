import { WhatsAppService } from "./whatsapp-service"
import { TemplateService } from "./template-service"
import type { Contact } from "../types/contact"

export interface BulkMessageSettings {
  delayBetweenMessages: number
  randomDelayRange: number
  maxMessagesPerHour: number
  maxMessagesPerDay: number
  batchSize: number
  batchDelayMinutes: number
  respectBusinessHours: boolean
  businessHoursStart: number
  businessHoursEnd: number
  enableAntiSpamMode: boolean
  maxConsecutiveMessages: number
  cooldownPeriod: number
  humanLikeBehavior: boolean
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
  sent: number
  failed: number
  remaining: number
  currentBatch: number
  totalBatches: number
  nextBatchIn: number
  messagesPerMinute: number
  errors: Array<{ contact: Contact; error: string }>
}

export interface BulkMessageResult {
  successful: number
  failed: number
  total: number
  duration: number
  averageDelayUsed: number
  batchesProcessed: number
  errors: Array<{ contact: Contact; error: string }>
}

export interface ContactValidationResult {
  valid: Contact[]
  invalid: Contact[]
  errors: string[]
}

class EnhancedBulkMessageServiceClass {
  private isRunning = false
  private isPaused = false
  private currentTimeout: NodeJS.Timeout | null = null
  private batchTimeout: NodeJS.Timeout | null = null
  private progress: BulkMessageProgress | null = null
  private settings: BulkMessageSettings
  private currentIndex = 0
  private currentBatch = 0
  private totalDelayUsed = 0
  private messagesThisHour = 0
  private messagesThisDay = 0
  private lastMessageTime = 0
  private consecutiveMessages = 0
  private lastCooldownTime = 0

  // Default professional settings optimized for WhatsApp safety
  private defaultSettings: BulkMessageSettings = {
    delayBetweenMessages: 5000, // 5 seconds base delay
    randomDelayRange: 3000, // ±3 seconds randomization
    maxMessagesPerHour: 60, // Conservative limit
    maxMessagesPerDay: 300, // Daily limit
    batchSize: 15, // Smaller batches
    batchDelayMinutes: 10, // 10 minutes between batches
    respectBusinessHours: true,
    businessHoursStart: 9,
    businessHoursEnd: 18,
    enableAntiSpamMode: true,
    maxConsecutiveMessages: 20,
    cooldownPeriod: 15, // 15 minutes cooldown
    humanLikeBehavior: true,
  }

  constructor() {
    this.settings = { ...this.defaultSettings }
    this.loadRateLimitData()
  }

  private loadRateLimitData() {
    if (typeof window === "undefined") return

    try {
      const data = localStorage.getItem("whatsapp_rate_limit_data")
      if (data) {
        const parsed = JSON.parse(data)
        const now = Date.now()
        const oneHour = 60 * 60 * 1000
        const oneDay = 24 * 60 * 60 * 1000

        // Reset counters if time has passed
        if (now - parsed.lastHourReset > oneHour) {
          this.messagesThisHour = 0
        } else {
          this.messagesThisHour = parsed.messagesThisHour || 0
        }

        if (now - parsed.lastDayReset > oneDay) {
          this.messagesThisDay = 0
        } else {
          this.messagesThisDay = parsed.messagesThisDay || 0
        }

        this.lastMessageTime = parsed.lastMessageTime || 0
        this.consecutiveMessages = parsed.consecutiveMessages || 0
        this.lastCooldownTime = parsed.lastCooldownTime || 0
      }
    } catch (error) {
      console.warn("Failed to load rate limit data:", error)
    }
  }

  private saveRateLimitData() {
    if (typeof window === "undefined") return

    try {
      const data = {
        messagesThisHour: this.messagesThisHour,
        messagesThisDay: this.messagesThisDay,
        lastMessageTime: this.lastMessageTime,
        consecutiveMessages: this.consecutiveMessages,
        lastCooldownTime: this.lastCooldownTime,
        lastHourReset: Date.now(),
        lastDayReset: Date.now(),
      }
      localStorage.setItem("whatsapp_rate_limit_data", JSON.stringify(data))
    } catch (error) {
      console.warn("Failed to save rate limit data:", error)
    }
  }

  updateSettings(newSettings: Partial<BulkMessageSettings>) {
    this.settings = { ...this.settings, ...newSettings }
  }

  getSettings(): BulkMessageSettings {
    return { ...this.settings }
  }

  validateContacts(contacts: Contact[]): ContactValidationResult {
    const valid: Contact[] = []
    const invalid: Contact[] = []
    const errors: string[] = []

    contacts.forEach((contact) => {
      // Check phone number format
      if (!contact.normalized || contact.normalized.length < 10) {
        invalid.push(contact)
        errors.push(`Invalid phone number: ${contact.original}`)
        return
      }

      // Check for duplicate numbers
      const isDuplicate = valid.some((c) => c.normalized === contact.normalized)
      if (isDuplicate) {
        invalid.push(contact)
        errors.push(`Duplicate phone number: ${contact.normalized}`)
        return
      }

      // Check if contact has minimum required data
      if (!contact.companyName && !contact.normalized) {
        invalid.push(contact)
        errors.push(`Missing contact information: ${contact.original}`)
        return
      }

      valid.push(contact)
    })

    return { valid, invalid, errors }
  }

  private isWithinBusinessHours(): boolean {
    if (!this.settings.respectBusinessHours) return true

    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay() // 0 = Sunday, 6 = Saturday

    // Skip weekends if business hours are enabled
    if (day === 0 || day === 6) return false

    return hour >= this.settings.businessHoursStart && hour < this.settings.businessHoursEnd
  }

  private shouldTakeCooldown(): boolean {
    if (!this.settings.enableAntiSpamMode) return false

    return this.consecutiveMessages >= this.settings.maxConsecutiveMessages
  }

  private hasReachedRateLimit(): boolean {
    return (
      this.messagesThisHour >= this.settings.maxMessagesPerHour ||
      this.messagesThisDay >= this.settings.maxMessagesPerDay
    )
  }

  private getRandomDelay(): number {
    const baseDelay = this.settings.delayBetweenMessages
    const randomRange = this.settings.randomDelayRange
    const randomFactor = (Math.random() - 0.5) * 2 * randomRange
    return Math.max(2000, baseDelay + randomFactor) // Minimum 2 seconds
  }

  private simulateHumanBehavior(): Promise<void> {
    if (!this.settings.humanLikeBehavior) return Promise.resolve()

    return new Promise((resolve) => {
      // Random micro-delays to simulate human behavior
      const humanDelay = Math.random() * 800 + 200 // 200-1000ms
      setTimeout(resolve, humanDelay)
    })
  }

  async sendBulkMessages(
    contacts: Contact[],
    message: string,
    settings: Partial<BulkMessageSettings>,
    onProgress: (progress: BulkMessageProgress) => void,
    onContactUpdate: (contact: Contact) => Promise<void>,
  ): Promise<BulkMessageResult> {
    if (this.isRunning) {
      throw new Error("Bulk messaging is already running")
    }

    // Update settings
    this.updateSettings(settings)

    // Validate contacts
    const validation = this.validateContacts(contacts)
    if (validation.valid.length === 0) {
      throw new Error("No valid contacts to send messages to")
    }

    // Check rate limits
    if (this.hasReachedRateLimit()) {
      throw new Error("Rate limit reached. Please wait before sending more messages.")
    }

    // Check business hours - but allow override
    if (!this.isWithinBusinessHours()) {
      // Don't throw error, just warn and continue if user confirms
      console.warn("Outside business hours, but proceeding as requested by user")
    }

    // Initialize state
    this.isRunning = true
    this.isPaused = false
    this.currentIndex = 0
    this.currentBatch = 0
    this.totalDelayUsed = 0

    const totalBatches = Math.ceil(validation.valid.length / this.settings.batchSize)

    this.progress = {
      current: 0,
      total: validation.valid.length,
      percentage: 0,
      isRunning: true,
      isPaused: false,
      currentContact: null,
      estimatedTimeRemaining: this.estimateTotalTime(validation.valid.length),
      startTime: Date.now(),
      sent: 0,
      failed: 0,
      remaining: validation.valid.length,
      currentBatch: 1,
      totalBatches,
      nextBatchIn: 0,
      messagesPerMinute: 0,
      errors: [],
    }

    try {
      await this.processContacts(validation.valid, message, onProgress, onContactUpdate)

      const result: BulkMessageResult = {
        successful: this.progress.sent,
        failed: this.progress.failed,
        total: validation.valid.length,
        duration: Date.now() - this.progress.startTime,
        averageDelayUsed: this.totalDelayUsed / validation.valid.length,
        batchesProcessed: this.currentBatch,
        errors: this.progress.errors,
      }

      this.cleanup()
      return result
    } catch (error) {
      this.cleanup()
      throw error
    }
  }

  private async processContacts(
    contacts: Contact[],
    message: string,
    onProgress: (progress: BulkMessageProgress) => void,
    onContactUpdate: (contact: Contact) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < contacts.length; i++) {
      if (!this.isRunning) break
      if (this.isPaused) {
        await this.waitForResume()
      }

      // Check if we need a cooldown
      if (this.shouldTakeCooldown()) {
        await this.takeCooldown(onProgress)
      }

      // Check rate limits
      if (this.hasReachedRateLimit()) {
        throw new Error("Rate limit reached during processing")
      }

      // Check business hours
      if (!this.isWithinBusinessHours()) {
        await this.waitForBusinessHours(onProgress)
      }

      // Process batch delay
      if (i > 0 && i % this.settings.batchSize === 0) {
        await this.processBatchDelay(onProgress)
      }

      const contact = contacts[i]
      this.currentIndex = i
      this.progress!.currentContact = contact
      this.progress!.current = i + 1
      this.progress!.percentage = Math.round(((i + 1) / contacts.length) * 100)
      this.progress!.remaining = contacts.length - (i + 1)

      // Update progress metrics
      const elapsed = Date.now() - this.progress!.startTime
      this.progress!.messagesPerMinute = this.progress!.current > 0 ? (this.progress!.current / elapsed) * 60000 : 0

      const remainingContacts = this.progress!.remaining
      const avgTimePerContact = elapsed / this.progress!.current
      this.progress!.estimatedTimeRemaining = remainingContacts * avgTimePerContact

      onProgress(this.progress!)

      try {
        await this.sendSingleMessage(contact, message, onContactUpdate)
        this.progress!.sent++
        this.messagesThisHour++
        this.messagesThisDay++
        this.consecutiveMessages++
        this.lastMessageTime = Date.now()
      } catch (error) {
        this.progress!.failed++
        this.progress!.errors.push({
          contact,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Save rate limit data periodically
      if (i % 10 === 0) {
        this.saveRateLimitData()
      }

      // Apply delay before next message
      const delay = this.getRandomDelay()
      this.totalDelayUsed += delay
      await this.delay(delay)
    }
  }

  private async sendSingleMessage(
    contact: Contact,
    message: string,
    onContactUpdate: (contact: Contact) => Promise<void>,
  ): Promise<void> {
    // Simulate human behavior
    await this.simulateHumanBehavior()

    // Generate personalized message
    const personalizedMessage = TemplateService.replaceVariables(message, contact)

    // Validate message length
    if (personalizedMessage.length > 4000) {
      throw new Error("Message too long (max 4000 characters)")
    }

    // Generate WhatsApp link
    const whatsappLink = WhatsAppService.generateWhatsAppLink(contact.normalized, personalizedMessage)

    // Open WhatsApp link with safety checks
    const newWindow = window.open(whatsappLink, "_blank", "noopener,noreferrer,width=800,height=600")

    if (!newWindow) {
      throw new Error("Pop-up blocked. Please allow pop-ups for this site.")
    }

    // Update contact status
    const updatedContact = { ...contact, status: "sent" as const, lastSent: new Date().toISOString() }
    await onContactUpdate(updatedContact)
  }

  private async takeCooldown(onProgress: (progress: BulkMessageProgress) => void): Promise<void> {
    const cooldownMs = this.settings.cooldownPeriod * 60 * 1000
    this.lastCooldownTime = Date.now()
    this.consecutiveMessages = 0

    // Countdown cooldown period
    for (let remaining = cooldownMs; remaining > 0; remaining -= 1000) {
      if (!this.isRunning) break

      this.progress!.nextBatchIn = remaining
      onProgress(this.progress!)
      await this.delay(1000)
    }

    this.progress!.nextBatchIn = 0
  }

  private async processBatchDelay(onProgress: (progress: BulkMessageProgress) => void): Promise<void> {
    const batchDelayMs = this.settings.batchDelayMinutes * 60 * 1000
    this.currentBatch++

    // Countdown batch delay
    for (let remaining = batchDelayMs; remaining > 0; remaining -= 1000) {
      if (!this.isRunning) break
      if (this.isPaused) {
        await this.waitForResume()
      }

      this.progress!.nextBatchIn = remaining
      this.progress!.currentBatch = this.currentBatch
      onProgress(this.progress!)
      await this.delay(1000)
    }

    this.progress!.nextBatchIn = 0
  }

  private async waitForBusinessHours(onProgress: (progress: BulkMessageProgress) => void): Promise<void> {
    while (!this.isWithinBusinessHours() && this.isRunning) {
      onProgress(this.progress!)
      await this.delay(60000) // Check every minute
    }
  }

  private async waitForResume(): Promise<void> {
    while (this.isPaused && this.isRunning) {
      await this.delay(100)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.currentTimeout = setTimeout(resolve, ms)
    })
  }

  private estimateTotalTime(contactCount: number): number {
    const avgDelay = this.settings.delayBetweenMessages + this.settings.randomDelayRange / 2
    const batches = Math.ceil(contactCount / this.settings.batchSize)
    const messageTime = contactCount * avgDelay
    const batchDelayTime = (batches - 1) * this.settings.batchDelayMinutes * 60 * 1000
    const cooldownTime =
      Math.floor(contactCount / this.settings.maxConsecutiveMessages) * this.settings.cooldownPeriod * 60 * 1000

    return messageTime + batchDelayTime + cooldownTime
  }

  formatEstimatedTime(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  pause() {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true
      if (this.progress) {
        this.progress.isPaused = true
      }
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout)
        this.currentTimeout = null
      }
    }
  }

  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false
      if (this.progress) {
        this.progress.isPaused = false
      }
    }
  }

  stop() {
    this.isRunning = false
    this.isPaused = false

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout)
      this.currentTimeout = null
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    this.saveRateLimitData()
    this.cleanup()
  }

  getProgress(): BulkMessageProgress | null {
    return this.progress
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning
  }

  getRateLimitStatus() {
    return {
      messagesThisHour: this.messagesThisHour,
      maxMessagesPerHour: this.settings.maxMessagesPerHour,
      messagesThisDay: this.messagesThisDay,
      maxMessagesPerDay: this.settings.maxMessagesPerDay,
      consecutiveMessages: this.consecutiveMessages,
      maxConsecutiveMessages: this.settings.maxConsecutiveMessages,
      needsCooldown: this.shouldTakeCooldown(),
      withinBusinessHours: this.isWithinBusinessHours(),
    }
  }

  getAntiSpamRecommendations(contactCount: number): string[] {
    const recommendations = []

    if (contactCount > 100) {
      recommendations.push("🚨 Large contact list detected. Consider splitting into smaller campaigns.")
    }

    if (contactCount > 50) {
      recommendations.push("⏱️ Use longer delays between messages (5-10 seconds recommended).")
    }

    if (this.messagesThisHour > this.settings.maxMessagesPerHour * 0.8) {
      recommendations.push("⚠️ Approaching hourly rate limit. Consider taking a break.")
    }

    recommendations.push("✅ Ensure your messages are personalized and relevant.")
    recommendations.push("📱 Don't send identical messages to multiple contacts.")
    recommendations.push("⏰ Respect business hours to avoid being marked as spam.")
    recommendations.push("🔄 Take regular breaks between large batches.")
    recommendations.push("👤 Use human-like behavior patterns to avoid detection.")

    return recommendations
  }

  private cleanup() {
    this.progress = null
    this.currentIndex = 0
    this.currentBatch = 0
    this.totalDelayUsed = 0
    this.saveRateLimitData()
  }

  getBusinessHoursStatus(): {
    isWithinHours: boolean
    currentHour: number
    businessStart: number
    businessEnd: number
    isWeekend: boolean
    nextBusinessHour: string
  } {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    const isWeekend = day === 0 || day === 6

    let nextBusinessHour = "Now"

    if (!this.isWithinBusinessHours()) {
      if (isWeekend) {
        const daysUntilMonday = day === 0 ? 1 : 7 - day + 1
        const monday = new Date(now)
        monday.setDate(monday.getDate() + daysUntilMonday)
        monday.setHours(this.settings.businessHoursStart, 0, 0, 0)
        nextBusinessHour = monday.toLocaleString()
      } else if (hour < this.settings.businessHoursStart) {
        const today = new Date(now)
        today.setHours(this.settings.businessHoursStart, 0, 0, 0)
        nextBusinessHour = today.toLocaleTimeString()
      } else {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(this.settings.businessHoursStart, 0, 0, 0)
        nextBusinessHour = tomorrow.toLocaleString()
      }
    }

    return {
      isWithinHours: this.isWithinBusinessHours(),
      currentHour: hour,
      businessStart: this.settings.businessHoursStart,
      businessEnd: this.settings.businessHoursEnd,
      isWeekend,
      nextBusinessHour,
    }
  }
}

// Singleton instance
export const EnhancedBulkMessageService = new EnhancedBulkMessageServiceClass()
