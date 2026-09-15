import { WHATSAPP_CONSTANTS } from "../constants/app-constants"

/**
 * Where a generated link should open WhatsApp.
 *
 *  - `auto`  decide per device: the installed app on a phone, WhatsApp Web on
 *            a desktop. The right default for almost everyone.
 *  - `app`   force the installed app via the `whatsapp://` scheme. Opens the
 *            desktop app too, and does nothing if WhatsApp is not installed.
 *  - `web`   always web.whatsapp.com.
 *  - `wa_me` the universal wa.me link: opens the app on mobile and falls back
 *            to a web page anywhere else. Best form for links you export or
 *            share, because it works on whatever device opens it.
 */
export type WhatsAppLinkTarget = "auto" | "app" | "web" | "wa_me"

/** Concrete surface, once `auto` has been resolved for this device. */
export type ResolvedLinkTarget = Exclude<WhatsAppLinkTarget, "auto">

const LINK_TARGET_STORAGE_KEY = "whatsapp_link_target"

export const LINK_TARGET_OPTIONS: Array<{ value: WhatsAppLinkTarget; label: string; hint: string }> = [
  { value: "auto", label: "Automatic", hint: "Phone app on mobile, WhatsApp Web on desktop" },
  { value: "app", label: "WhatsApp app", hint: "Always open the installed app on this device" },
  { value: "wa_me", label: "wa.me link", hint: "Universal link — opens the app on phones" },
  { value: "web", label: "WhatsApp Web", hint: "Always open web.whatsapp.com in the browser" },
]

export class WhatsAppService {
  /**
   * Is this a phone or tablet?
   *
   * Prefers the `userAgentData.mobile` hint where the browser provides it, and
   * falls back to user-agent matching. iPadOS deliberately reports itself as a
   * Mac, so a touch-capable "Macintosh" is treated as mobile.
   */
  static isMobileDevice(): boolean {
    if (typeof navigator === "undefined") return false

    const hint = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
    if (hint && typeof hint.mobile === "boolean") return hint.mobile

    const ua = navigator.userAgent || ""
    if (/Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return true

    return /Macintosh/.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1
  }

  /**
   * The operator's chosen target for this device.
   *
   * Stored per browser rather than per account on purpose: the same account
   * used from a phone and from a desktop wants different behaviour, and the
   * preference is about the device in front of you.
   */
  static getLinkTarget(): WhatsAppLinkTarget {
    if (typeof window === "undefined") return "auto"

    try {
      const stored = window.localStorage.getItem(LINK_TARGET_STORAGE_KEY)
      if (stored === "auto" || stored === "app" || stored === "web" || stored === "wa_me") return stored
    } catch {
      // Private mode or blocked storage: fall through to the default.
    }

    return "auto"
  }

  /**
   * Components watching the stored preference.
   *
   * The target lives in localStorage, which React cannot observe on its own,
   * so changing it notifies subscribers explicitly. This pairs with
   * `useSyncExternalStore`, which is how a component reads an external store
   * without a state-setting effect.
   */
  private static linkTargetListeners = new Set<() => void>()

  static subscribeLinkTarget(listener: () => void): () => void {
    WhatsAppService.linkTargetListeners.add(listener)
    return () => {
      WhatsAppService.linkTargetListeners.delete(listener)
    }
  }

  static setLinkTarget(target: WhatsAppLinkTarget): void {
    if (typeof window === "undefined") return

    try {
      window.localStorage.setItem(LINK_TARGET_STORAGE_KEY, target)
    } catch {
      // Non-fatal: links still work, the choice just will not persist.
    }

    WhatsAppService.linkTargetListeners.forEach((listener) => listener())
  }

  /** Server snapshot for `useSyncExternalStore`: no device to detect yet. */
  static getServerLinkTarget(): WhatsAppLinkTarget {
    return "auto"
  }

  /** Turn `auto` into the surface this device should actually use. */
  static resolveLinkTarget(target: WhatsAppLinkTarget = this.getLinkTarget()): ResolvedLinkTarget {
    if (target !== "auto") return target
    // wa.me rather than the whatsapp:// scheme: it opens the app just the same
    // but degrades to a web page if WhatsApp is not installed.
    return this.isMobileDevice() ? "wa_me" : "web"
  }

  /**
   * Generates a WhatsApp link with proper emoji encoding
   *
   * Pass `target` to override the device preference — used by the exporter,
   * which always writes universal links because the spreadsheet may be opened
   * on any device.
   */
  static generateWhatsAppLink(phoneNumber: string, message: string, target?: WhatsAppLinkTarget): string {
    // Clean and format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "")

    // Ensure proper encoding for emojis and special characters
    const encodedMessage = encodeURIComponent(message)

    switch (this.resolveLinkTarget(target)) {
      case "app":
        return `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
      case "wa_me":
        return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      case "web":
      default:
        return `${WHATSAPP_CONSTANTS.BASE_URL}?phone=${cleanPhone}&text=${encodedMessage}&type=phone_number&app_absent=0`
    }
  }

  /**
   * Pull the number and message back out of any WhatsApp link.
   *
   * Handles every form the app has ever produced or might be handed: the
   * web.whatsapp.com and api.whatsapp.com query forms, wa.me paths, and the
   * whatsapp:// scheme.
   */
  static parseWhatsAppLink(link: string): { phone: string; text: string } | null {
    if (!link) return null

    try {
      // The URL parser does not accept custom schemes consistently across
      // runtimes, so whatsapp:// is normalised to https:// before parsing.
      const parsed = new URL(link.replace(/^whatsapp:\/\//i, "https://"))
      const text = parsed.searchParams.get("text") ?? ""

      const queryPhone = parsed.searchParams.get("phone")
      if (queryPhone) return { phone: queryPhone.replace(/\D/g, ""), text }

      // wa.me/966XXXXXXXXX — the number is the path.
      const pathPhone = parsed.pathname.replace(/\D/g, "")
      if (pathPhone) return { phone: pathPhone, text }

      return null
    } catch {
      return null
    }
  }

  /**
   * Rewrite an existing link to open on the chosen surface.
   *
   * Links are stored against contacts when they are imported, so a list built
   * on a desktop holds web.whatsapp.com URLs. Rewriting at click time means the
   * same stored data opens the phone app on a phone, without rewriting the
   * database. Anything unrecognisable is returned untouched.
   */
  static retargetLink(link: string, target?: WhatsAppLinkTarget): string {
    const parsed = this.parseWhatsAppLink(link)
    if (!parsed) return link

    return this.generateWhatsAppLink(parsed.phone, parsed.text, target)
  }

  /**
   * Open a chat, using whichever mechanism the link needs.
   *
   * `whatsapp://` hands off to the operating system, where a popup is not
   * involved at all and `window.open` can report a blocked popup that never
   * happened; an anchor click is the reliable way to trigger it while keeping
   * this page alive. http(s) links keep the popup check, since there a null
   * window really does mean the browser blocked it.
   */
  static openChat(link: string): void {
    if (typeof window === "undefined") return

    if (link.startsWith("whatsapp://")) {
      const anchor = document.createElement("a")
      anchor.href = link
      anchor.rel = "noopener noreferrer"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      return
    }

    // Sizing hints are meaningless on a phone, where the tab opens full screen.
    const features = this.isMobileDevice() ? "noopener,noreferrer" : "noopener,noreferrer,width=800,height=600"
    const opened = window.open(link, "_blank", features)

    if (!opened) {
      throw new Error("Pop-up blocked. Please allow pop-ups for this site.")
    }
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

}
