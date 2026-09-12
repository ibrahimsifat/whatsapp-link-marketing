/**
 * Environment configuration
 *
 * Centralised, validated access to every environment variable the application
 * depends on. Importing this module is the ONLY supported way to read config:
 * it fails loudly and early with an actionable message instead of producing
 * confusing `undefined` errors deep inside a request handler.
 */

import { z } from "zod"

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Treat an empty variable as absent.
 *
 * A `.env` file copied from the template has keys present but blank
 * (`AUTH_PASSWORD_HASH=`). Without this, Zod sees an empty string rather than
 * `undefined` and reports a confusing format error instead of "not set".
 */
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), schema.optional())

/** A required variable, with blank treated as missing. */
const requiredString = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string({ required_error: message }).min(1, message),
  )

// ============================================================================
// SCHEMA
// ============================================================================

const serverEnvSchema = z.object({
  // --- Cloudflare D1 -------------------------------------------------------
  CLOUDFLARE_ACCOUNT_ID: requiredString("CLOUDFLARE_ACCOUNT_ID is required"),
  CLOUDFLARE_D1_DATABASE_ID: requiredString("CLOUDFLARE_D1_DATABASE_ID is required"),
  CLOUDFLARE_API_TOKEN: requiredString("CLOUDFLARE_API_TOKEN is required"),

  // --- Auth ----------------------------------------------------------------
  AUTH_EMAIL: z.string().email("AUTH_EMAIL must be a valid email address"),
  /** Plain password. Used only when AUTH_PASSWORD_HASH is not provided. */
  AUTH_PASSWORD: optionalString(z.string().min(1)),
  /** Preferred: lowercase hex SHA-256 of the password. */
  AUTH_PASSWORD_HASH: optionalString(
    z
      .string()
      .regex(
        /^[a-f0-9]{64}$/i,
        'AUTH_PASSWORD_HASH must be a 64-character hex SHA-256 digest, not a plain password. ' +
          'Generate one with: pnpm auth:hash "your-password" — or leave AUTH_PASSWORD_HASH blank and set AUTH_PASSWORD instead',
      ),
  ),
  JWT_SECRET: requiredString("JWT_SECRET is required").pipe(
    z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ),
  /** Session lifetime in seconds. Defaults to 7 days. */
  SESSION_MAX_AGE: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),

  // --- Runtime -------------------------------------------------------------
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Query timeout for a single D1 HTTP call, in milliseconds. */
  D1_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  /** How many times a failed (retryable) D1 call is retried. */
  D1_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  /** Set to "true" to log every SQL statement to the server console. */
  DB_LOGGING: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * The application is misconfigured.
 *
 * Distinct from a runtime failure so the API layer can return a message that
 * points at the fix rather than a generic "something went wrong".
 */
export class ConfigurationError extends Error {
  readonly details: string

  constructor(details: string) {
    super(`Invalid environment configuration:\n${details}`)
    this.name = "ConfigurationError"
    this.details = details
  }
}

// ============================================================================
// PARSING
// ============================================================================

let cached: ServerEnv | null = null

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n")
}

/**
 * Parse and cache the server environment.
 *
 * @throws {Error} when the environment is incomplete or malformed.
 */
export function getEnv(): ServerEnv {
  if (cached) return cached

  const parsed = serverEnvSchema.safeParse(process.env)

  if (!parsed.success) {
    throw new ConfigurationError(
      `${formatIssues(parsed.error)}\n\nCopy .env.example to .env.local and fill in the missing values.`,
    )
  }

  if (!parsed.data.AUTH_PASSWORD && !parsed.data.AUTH_PASSWORD_HASH) {
    throw new ConfigurationError(
      "  - Set either AUTH_PASSWORD_HASH (preferred) or AUTH_PASSWORD.\n\n" +
        'Generate a hash with: pnpm auth:hash "your-password"',
    )
  }

  cached = parsed.data
  return cached
}

/** Test-only escape hatch to force a re-read of process.env. */
export function resetEnvCache(): void {
  cached = null
}

export const isProduction = () => getEnv().NODE_ENV === "production"
