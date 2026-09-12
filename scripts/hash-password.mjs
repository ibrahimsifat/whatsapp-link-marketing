#!/usr/bin/env node
/**
 * Generate the SHA-256 hash of a password for AUTH_PASSWORD_HASH.
 *
 *   node scripts/hash-password.mjs "my-secret-password"
 *
 * Storing the hash rather than the plaintext means the password is not sitting
 * in a .env file, a CI variable, or a hosting dashboard in readable form.
 */

import { createHash, randomBytes } from "node:crypto"

const password = process.argv[2]

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>"')
  process.exit(1)
}

if (password.length < 8) {
  console.error("Refusing to hash a password shorter than 8 characters.")
  process.exit(1)
}

const hash = createHash("sha256").update(password, "utf8").digest("hex")

console.log("\nAdd these to .env.local:\n")
console.log(`AUTH_PASSWORD_HASH=${hash}`)
console.log(`JWT_SECRET=${randomBytes(48).toString("base64url")}`)
console.log("\nRemove AUTH_PASSWORD if it is set - the hash takes precedence.\n")
