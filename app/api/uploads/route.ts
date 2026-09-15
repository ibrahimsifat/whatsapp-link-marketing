/**
 * POST /api/uploads
 *
 * Uploads a template image to Cloudflare R2 and returns its public URL, so an
 * operator can attach a real, always-online image instead of hunting for
 * third-party hosting that may require login or block hotlinking - both of
 * which stop WhatsApp from unfurling a preview for the recipient.
 */

import { randomUUID } from "node:crypto"
import type { NextRequest } from "next/server"

import { created, fail, handleRoute } from "@/lib/api/response"
import { requireSession } from "@/lib/auth/guard"
import { uploadImageToR2 } from "@/lib/r2"
import { IMAGE_UPLOAD_CONSTANTS } from "@/app/constants/app-constants"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export const POST = handleRoute(async (request: NextRequest) => {
  await requireSession()

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return fail("No image file was uploaded", 400)
  }

  if (!IMAGE_UPLOAD_CONSTANTS.ALLOWED_TYPES.includes(file.type as (typeof IMAGE_UPLOAD_CONSTANTS.ALLOWED_TYPES)[number])) {
    return fail("Unsupported image type. Use JPEG, PNG, WebP, or GIF.", 415)
  }

  if (file.size > IMAGE_UPLOAD_CONSTANTS.MAX_SIZE) {
    return fail(`Image is too large. Maximum size is ${IMAGE_UPLOAD_CONSTANTS.MAX_SIZE / (1024 * 1024)}MB.`, 413)
  }

  const extension = EXTENSION_BY_TYPE[file.type]
  const key = `template-images/${randomUUID()}.${extension}`
  const bytes = await file.arrayBuffer()

  const url = await uploadImageToR2(key, bytes, file.type)

  return created({ url }, "Image uploaded")
})
