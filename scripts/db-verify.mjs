#!/usr/bin/env node
/**
 * Verify the D1 connection and report what is in the database.
 *
 *   node scripts/db-verify.mjs
 *
 * Run this after configuring .env.local to confirm credentials, network access
 * and the migration state before starting the app.
 */

import { config as loadEnv } from "dotenv"

// Match Next.js: .env.local takes precedence over .env.
loadEnv({ path: ".env.local" })
loadEnv({ path: ".env" })

const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN } = process.env

const missing = [
  ["CLOUDFLARE_ACCOUNT_ID", CLOUDFLARE_ACCOUNT_ID],
  ["CLOUDFLARE_D1_DATABASE_ID", CLOUDFLARE_D1_DATABASE_ID],
  ["CLOUDFLARE_API_TOKEN", CLOUDFLARE_API_TOKEN],
].filter(([, value]) => !value)

if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.map(([key]) => key).join(", ")}`)
  console.error("Copy .env.example to .env.local and fill it in.")
  process.exit(1)
}

const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`

async function query(sql) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  })

  const payload = await response.json()

  if (!response.ok || !payload.success) {
    const message = (payload.errors ?? []).map((e) => e.message).join("; ")
    throw new Error(message || `HTTP ${response.status}`)
  }

  return payload.result?.[0]?.results ?? []
}

const started = Date.now()

try {
  await query("SELECT 1")
  console.log(`Connection OK (${Date.now() - started}ms)\n`)
} catch (error) {
  console.error(`Connection FAILED: ${error.message}\n`)
  console.error("Check that the API token has Account -> D1 -> Edit permission,")
  console.error("and that the account and database IDs are correct.")
  process.exitCode = 1
  process.exit = () => {}
}

const EXPECTED_TABLES = [
  "app_settings",
  "auth_attempts",
  "contacts",
  "import_batches",
  "message_templates",
  "send_history",
]

const tables = await query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
const present = tables.map((table) => table.name)

console.log("Tables:")
for (const name of EXPECTED_TABLES) {
  console.log(`  ${present.includes(name) ? "[ok]     " : "[MISSING]"} ${name}`)
}

const absent = EXPECTED_TABLES.filter((name) => !present.includes(name))
if (absent.length > 0) {
  console.error("\nSome tables are missing. Run: pnpm db:migrate")
  process.exit(1)
}

const [counts] = await query(`
  SELECT
    (SELECT COUNT(*) FROM contacts)          AS contacts,
    (SELECT COUNT(*) FROM message_templates) AS templates,
    (SELECT COUNT(*) FROM send_history)      AS sends,
    (SELECT COUNT(*) FROM import_batches)    AS imports
`)

console.log("\nRow counts:")
console.log(`  contacts:  ${counts.contacts}`)
console.log(`  templates: ${counts.templates}`)
console.log(`  sends:     ${counts.sends}`)
console.log(`  imports:   ${counts.imports}`)
console.log("\nDatabase is ready.")
