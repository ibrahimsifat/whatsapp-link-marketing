/**
 * Cloudflare R2 HTTP client
 *
 * Uploads template images. Like `lib/db/d1-http.ts`, this speaks to Cloudflare's
 * REST API with a bearer token rather than the S3-compatible endpoint, so it
 * needs no separate access-key/secret pair - just the same account ID and API
 * token already used for D1 (the token additionally needs the "Workers R2
 * Storage: Edit" permission).
 *
 * The bucket must have public access turned on (an r2.dev subdomain or a
 * custom domain) so the uploaded URL can be pasted straight into a WhatsApp
 * message: the recipient's client fetches it directly, with no auth header to
 * attach.
 */

import { getEnv } from "@/lib/env"

const CF_API_BASE = "https://api.cloudflare.com/client/v4"

export class R2ConfigurationError extends Error {
  constructor() {
    super(
      "Image upload is not configured. Set CLOUDFLARE_R2_BUCKET_NAME and CLOUDFLARE_R2_PUBLIC_BASE_URL " +
        "(see .env.example) to enable it.",
    )
    this.name = "R2ConfigurationError"
  }
}

export class R2Error extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "R2Error"
    this.status = status
  }
}

/** Uploads one object to the configured bucket and returns its public URL. */
export async function uploadImageToR2(key: string, bytes: ArrayBuffer, contentType: string): Promise<string> {
  const env = getEnv()
  const bucket = env.CLOUDFLARE_R2_BUCKET_NAME
  const publicBaseUrl = env.CLOUDFLARE_R2_PUBLIC_BASE_URL
  if (!bucket || !publicBaseUrl) throw new R2ConfigurationError()

  const response = await fetch(
    `${CF_API_BASE}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${bucket}/objects/${key}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": contentType,
      },
      body: bytes,
    },
  )

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new R2Error(`Failed to upload image to R2 (HTTP ${response.status}): ${body.slice(0, 300)}`, response.status)
  }

  return `${publicBaseUrl.replace(/\/$/, "")}/${key}`
}
