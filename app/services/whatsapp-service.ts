import { WHATSAPP_CONSTANTS } from "../constants/app-constants"

export class WhatsAppService {
  /**
   * Generates a WhatsApp link with proper emoji encoding
   */
  static generateWhatsAppLink(phoneNumber: string, message: string): string {
    // Clean and format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "")

    // Ensure proper encoding for emojis and special characters
    const encodedMessage = encodeURIComponent(message)

    return `${WHATSAPP_CONSTANTS.BASE_URL}?phone=${cleanPhone}&text=${encodedMessage}&type=phone_number&app_absent=0`
  }

  /**
   * Validates WhatsApp message content
   */
  static validateMessage(message: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!message.trim()) {
      errors.push("Message cannot be empty")
    }

    if (message.length > WHATSAPP_CONSTANTS.MAX_MESSAGE_LENGTH) {
      errors.push(`Message exceeds maximum length of ${WHATSAPP_CONSTANTS.MAX_MESSAGE_LENGTH} characters`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Formats phone number for WhatsApp
   */
  static formatPhoneNumber(phone: string, countryCode: string = WHATSAPP_CONSTANTS.SAUDI_COUNTRY_CODE): string {
    const cleanPhone = phone.replace(/\D/g, "")

    // Handle Saudi numbers
    if (cleanPhone.startsWith("05")) {
      return countryCode + cleanPhone.substring(1)
    }

    if (cleanPhone.startsWith("5") && cleanPhone.length === 9) {
      return countryCode + cleanPhone
    }

    // Already has country code
    if (cleanPhone.startsWith(countryCode)) {
      return cleanPhone
    }

    return countryCode + cleanPhone
  }

  /**
   * Estimates message delivery success rate based on content
   */
  static estimateDeliveryRate(message: string): { rate: number; factors: string[] } {
    let rate = 95 // Base rate
    const factors: string[] = []

    // Check message length
    if (message.length > 1000) {
      rate -= 10
      factors.push("Long message may reduce engagement")
    }

    // Check for spam indicators
    const spamWords = ["free", "urgent", "act now", "limited time", "click here"]
    const hasSpamWords = spamWords.some((word) => message.toLowerCase().includes(word))
    if (hasSpamWords) {
      rate -= 15
      factors.push("Contains promotional language")
    }

    // Check for personalization
    if (message.includes("{") && message.includes("}")) {
      rate += 5
      factors.push("Personalized content improves engagement")
    }

    // Check for emojis (moderate use is good)
    const emojiCount = (
      message.match(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ) || []
    ).length
    if (emojiCount > 0 && emojiCount <= 3) {
      rate += 3
      factors.push("Appropriate emoji usage")
    } else if (emojiCount > 5) {
      rate -= 5
      factors.push("Too many emojis may appear unprofessional")
    }

    return {
      rate: Math.max(0, Math.min(100, rate)),
      factors,
    }
  }

  /**
   * Analyzes message tone and sentiment
   */
  static analyzeMessageTone(message: string): { tone: string; sentiment: string; confidence: number } {
    const lowerMessage = message.toLowerCase()

    // Tone analysis
    let tone = "neutral"
    if (lowerMessage.includes("urgent") || lowerMessage.includes("asap") || lowerMessage.includes("immediately")) {
      tone = "urgent"
    } else if (lowerMessage.includes("offer") || lowerMessage.includes("deal") || lowerMessage.includes("discount")) {
      tone = "promotional"
    } else if (
      lowerMessage.includes("thank") ||
      lowerMessage.includes("appreciate") ||
      lowerMessage.includes("grateful")
    ) {
      tone = "grateful"
    } else if (lowerMessage.includes("?") || lowerMessage.includes("question") || lowerMessage.includes("inquiry")) {
      tone = "inquisitive"
    } else if (
      lowerMessage.includes("congratulations") ||
      lowerMessage.includes("success") ||
      lowerMessage.includes("achievement")
    ) {
      tone = "celebratory"
    }

    // Sentiment analysis
    const positiveWords = ["great", "excellent", "amazing", "wonderful", "fantastic", "love", "best", "perfect"]
    const negativeWords = ["sorry", "problem", "issue", "difficult", "unfortunately", "concern", "worry"]

    const positiveCount = positiveWords.filter((word) => lowerMessage.includes(word)).length
    const negativeCount = negativeWords.filter((word) => lowerMessage.includes(word)).length

    let sentiment = "neutral"
    if (positiveCount > negativeCount) {
      sentiment = "positive"
    } else if (negativeCount > positiveCount) {
      sentiment = "negative"
    }

    // Confidence calculation
    const totalWords = message.split(/\s+/).length
    const indicatorWords = positiveCount + negativeCount
    const confidence = Math.min(100, (indicatorWords / totalWords) * 100 + 50)

    return {
      tone,
      sentiment,
      confidence: Math.round(confidence),
    }
  }
}
