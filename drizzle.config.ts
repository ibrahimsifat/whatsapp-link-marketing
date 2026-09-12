import { config as loadEnv } from "dotenv"
import { defineConfig } from "drizzle-kit"

// Next.js reads .env.local; drizzle-kit runs outside Next, so load it here too.
// Later calls do not override already-set variables, so .env.local wins.
loadEnv({ path: ".env.local" })
loadEnv({ path: ".env" })

/**
 * Drizzle Kit configuration.
 *
 * `driver: "d1-http"` lets drizzle-kit talk to a remote D1 database over
 * Cloudflare's REST API, so migrations can be generated and applied from a
 * developer machine or CI without the Workers runtime or wrangler login.
 *
 *   pnpm db:generate   # diff schema.ts -> new SQL migration
 *   pnpm db:migrate    # apply pending migrations to D1
 *   pnpm db:studio     # browse the data
 */
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
  verbose: true,
  strict: true,
})
