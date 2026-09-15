import type { Contact } from "../types/contact"

export interface ContactValidationResult {
  valid: Contact[]
  invalid: Contact[]
}

/**
 * Splits contacts into who can actually be sent to.
 *
 * A contact is skipped when its number is missing/too short to be a real
 * phone number, or it duplicates a number already accepted earlier in the
 * list (sending the same chat twice in one run is never intended).
 */
export function validateContacts(contacts: Contact[]): ContactValidationResult {
  const valid: Contact[] = []
  const invalid: Contact[] = []
  const seenNumbers = new Set<string>()

  for (const contact of contacts) {
    if (!contact.normalized || contact.normalized.length < 10) {
      invalid.push(contact)
      continue
    }

    if (seenNumbers.has(contact.normalized)) {
      invalid.push(contact)
      continue
    }

    seenNumbers.add(contact.normalized)
    valid.push(contact)
  }

  return { valid, invalid }
}
