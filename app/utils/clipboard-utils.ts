export class ClipboardUtils {
  /**
   * Copies text to clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error("Failed to copy text: ", err)

      // Fallback method for older browsers
      try {
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const result = document.execCommand("copy")
        document.body.removeChild(textArea)
        return result
      } catch (fallbackErr) {
        console.error("Fallback copy method also failed: ", fallbackErr)
        return false
      }
    }
  }

  /**
   * Reads text from clipboard
   */
  static async readFromClipboard(): Promise<string | null> {
    try {
      const text = await navigator.clipboard.readText()
      return text
    } catch (err) {
      console.error("Failed to read from clipboard: ", err)
      return null
    }
  }

  /**
   * Checks if clipboard API is available
   */
  static isClipboardAvailable(): boolean {
    return !!(navigator.clipboard && navigator.clipboard.writeText)
  }
}
