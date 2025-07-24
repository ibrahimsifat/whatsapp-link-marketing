export class WhatsAppService {
  /**
   * Generates WhatsApp link with optional message
   */
  static generateWhatsAppLink(phone: string, message?: string): string {
    const baseUrl = "https://wa.me/"
    const cleanPhone = phone.replace("+", "")
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : ""
    return baseUrl + cleanPhone + encodedMessage
  }

  /**
   * Opens WhatsApp chat in new tab
   */
  static openWhatsAppChat(whatsappLink: string): void {
    window.open(whatsappLink, "_blank")
  }

  /**
   * Validates WhatsApp link format
   */
  static isValidWhatsAppLink(link: string): boolean {
    const whatsappRegex = /^https:\/\/wa\.me\/\d+(\?text=.*)?$/
    return whatsappRegex.test(link)
  }

  /**
   * Extracts phone number from WhatsApp link
   */
  static extractPhoneFromLink(link: string): string | null {
    const match = link.match(/https:\/\/wa\.me\/(\d+)/)
    return match ? `+${match[1]}` : null
  }

  /**
   * Extracts message from WhatsApp link
   */
  static extractMessageFromLink(link: string): string | null {
    const match = link.match(/text=([^&]+)/)
    return match ? decodeURIComponent(match[1]) : null
  }
}
