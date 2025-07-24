export class PhoneService {
  /**
   * Normalizes Saudi phone numbers to international format
   */
  static normalizePhoneNumber(phone: string): string | null {
    const cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "")

    // Saudi mobile number patterns
    if (cleaned.match(/^05\d{8}$/)) {
      return "+966" + cleaned.substring(1)
    }
    if (cleaned.match(/^5\d{8}$/)) {
      return "+966" + cleaned
    }
    if (cleaned.match(/^\+9665\d{8}$/)) {
      return cleaned
    }
    if (cleaned.match(/^9665\d{8}$/)) {
      return "+" + cleaned
    }

    return null
  }

  /**
   * Formats phone number for display
   */
  static formatPhoneDisplay(phone: string): string {
    if (phone.startsWith("+966")) {
      const number = phone.substring(4)
      return `+966 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`
    }
    return phone
  }

  /**
   * Validates if a phone number is a valid Saudi mobile number
   */
  static isValidSaudiMobile(phone: string): boolean {
    const normalized = this.normalizePhoneNumber(phone)
    return normalized !== null
  }

  /**
   * Extracts phone numbers from text using regex
   */
  static extractPhoneNumbers(text: string): string[] {
    const phoneRegex = /(\+?966\s*|0)?[5]\s*\d[\s\d]{7,}/g
    const matches = text.match(phoneRegex)
    return matches ? matches.filter((match) => this.isValidSaudiMobile(match)) : []
  }
}
