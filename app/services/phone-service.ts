export class PhoneService {
  /**
   * Normalizes Saudi phone numbers to international format
   *
   * Accepts every shape the source spreadsheets actually contain:
   *   5XXXXXXXX, 05XXXXXXXX, 9665XXXXXXXX, +9665XXXXXXXX,
   *   009665XXXXXXXX and the country code followed by the local trunk "0"
   *   (9660 5XXXXXXXX / +96605XXXXXXXX / 0096605XXXXXXXX), which is how
   *   Google Sheets renders numbers pasted as "966" + "05...".
   */
  static normalizePhoneNumber(phone: string): string | null {
    let cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "")

    // "00" is the international access prefix; treat it exactly like "+".
    cleaned = cleaned.replace(/^\+?00/, "+")
    if (!cleaned.startsWith("+")) {
      cleaned = cleaned.replace(/^\+/, "")
    }

    let digits = cleaned.startsWith("+") ? cleaned.substring(1) : cleaned

    // Strip the country code when present, then the local trunk "0" that is
    // sometimes left in place after it (966 + 05XXXXXXXX).
    if (digits.startsWith("966")) {
      digits = digits.substring(3)
    }
    if (digits.startsWith("0")) {
      digits = digits.substring(1)
    }

    // What remains must be a Saudi mobile subscriber number.
    if (!/^5\d{8}$/.test(digits)) {
      return null
    }

    return "+966" + digits
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
