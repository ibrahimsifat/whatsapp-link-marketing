/**
 * Typed API client
 *
 * One place where the browser talks to the server. Components never call
 * `fetch` directly, which means retries, error shape, credential handling and
 * the 401 redirect are implemented once instead of in every hook.
 *
 * Authentication needs no code here at all: the session is an HttpOnly cookie,
 * so the browser attaches it automatically.
 */

import type { Contact, MessageTemplate } from "@/app/types/contact"
import type { ContactStatus } from "@/app/types"

// ============================================================================
// TYPES
// ============================================================================

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message: string
  errors?: string[]
  meta?: Record<string, unknown>
}

export interface PageMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface ContactStatsPayload {
  total: number
  sent: number
  pending: number
  notSent: number
  withWebsite: number
  sendRate: number
  categories: string[]
  sends: { total: number; sent: number; failed: number; last24h: number }
}

export interface ImportResultPayload {
  batchId: string
  received: number
  inserted: number
  updated: number
  duplicatesInPayload: number
}

export type StoredTemplate = MessageTemplate & { isDefault: boolean }

/** A failed request, carrying the status so callers can branch on it. */
export class ApiError extends Error {
  readonly status: number
  readonly errors: string[]

  constructor(message: string, status: number, errors: string[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }

  get isUnauthorized() {
    return this.status === 401
  }

  /** Transient: a retry has a real chance of succeeding. */
  get isRetryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500
  }
}

// ============================================================================
// CORE REQUEST
// ============================================================================

const RETRYABLE_METHODS = new Set(["GET", "HEAD"])
const MAX_RETRIES = 2
const DEFAULT_TIMEOUT_MS = 30_000

let onUnauthorized: (() => void) | null = null

/**
 * Register what should happen when the server rejects the session.
 *
 * Set once by the auth provider so any request, from any hook, can trigger the
 * redirect to /login without importing router internals.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  timeoutMs?: number
  /** Skip the automatic redirect, e.g. for the session probe on page load. */
  skipAuthRedirect?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS, skipAuthRedirect, headers, ...rest } = options
  const method = (rest.method ?? "GET").toUpperCase()
  // FormData sets its own multipart boundary in the Content-Type header, so it
  // must be left for the browser to add and never JSON-encoded.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData

  let lastError: ApiError | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.round(Math.random() * 300 * 2 ** attempt)))
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(path, {
        ...rest,
        method,
        headers: {
          ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
        // Send the session cookie, and never serve a stale cached response.
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      })

      const text = await response.text()
      let payload: ApiEnvelope<T>

      try {
        payload = text ? JSON.parse(text) : { success: response.ok, message: response.statusText }
      } catch {
        throw new ApiError(`Unexpected response from the server (HTTP ${response.status})`, response.status)
      }

      if (!response.ok || !payload.success) {
        const error = new ApiError(payload.message || "Request failed", response.status, payload.errors)

        if (error.isUnauthorized && !skipAuthRedirect) {
          onUnauthorized?.()
        }

        // Only idempotent requests are retried. Replaying a POST could create
        // duplicate rows when the first attempt actually succeeded.
        if (error.isRetryable && RETRYABLE_METHODS.has(method) && attempt < MAX_RETRIES) {
          lastError = error
          continue
        }

        throw error
      }

      return payload
    } catch (error) {
      if (error instanceof ApiError) throw error

      const isAbort = error instanceof Error && error.name === "AbortError"
      const networkError = new ApiError(
        isAbort ? "The request timed out" : "Network error — check your connection",
        0,
      )

      if (RETRYABLE_METHODS.has(method) && attempt < MAX_RETRIES) {
        lastError = networkError
        continue
      }

      throw networkError
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new ApiError("Request failed", 0)
}

/** Unwrap the envelope when the caller only cares about the payload. */
async function data<T>(path: string, options?: RequestOptions): Promise<T> {
  const envelope = await request<T>(path, options)
  return envelope.data as T
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

// ============================================================================
// AUTH
// ============================================================================

export const authApi = {
  login: (email: string, password: string) =>
    data<{ email: string; role: "admin" }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuthRedirect: true,
    }),

  logout: () => data<{ signedOut: boolean }>("/api/auth/logout", { method: "POST", skipAuthRedirect: true }),

  me: () =>
    data<{ email: string; role: string; sessionId: string; expiresAt: string | null }>("/api/auth/me", {
      skipAuthRedirect: true,
    }),
}

// ============================================================================
// CONTACTS
// ============================================================================

export interface ContactQuery {
  page?: number
  perPage?: number
  status?: ContactStatus | "all"
  category?: string
  website?: "all" | "with" | "without"
  search?: string
  sortBy?: "createdAt" | "updatedAt" | "companyName" | "status"
  sortDir?: "asc" | "desc"
}

export const contactsApi = {
  async list(query: ContactQuery = {}): Promise<{ contacts: Contact[]; meta: PageMeta }> {
    const envelope = await request<Contact[]>(`/api/contacts${buildQuery(query as Record<string, unknown>)}`)
    return {
      contacts: envelope.data ?? [],
      meta: (envelope.meta as unknown as PageMeta) ?? { page: 1, perPage: 20, total: 0, totalPages: 1 },
    }
  },

  get: (id: string) => data<Contact>(`/api/contacts/${encodeURIComponent(id)}`),

  create: (contact: Partial<Contact>) => data<Contact>("/api/contacts", { method: "POST", body: contact }),

  update: (id: string, patch: Partial<Contact>) =>
    data<Contact>(`/api/contacts/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),

  updateStatus: (id: string, status: ContactStatus, notes?: string) =>
    data<Contact>(`/api/contacts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status, ...(notes !== undefined ? { notes } : {}) },
    }),

  remove: (id: string) => data<{ id: string }>(`/api/contacts/${encodeURIComponent(id)}`, { method: "DELETE" }),

  bulkUpdateStatus: (ids: string[], status: ContactStatus, notes?: string) =>
    data<{ updated: number }>("/api/contacts/bulk", {
      method: "PATCH",
      body: { ids, status, notes: notes ?? null },
      timeoutMs: 60_000,
    }),

  bulkRemove: (ids: string[]) =>
    data<{ deleted: number }>("/api/contacts/bulk", { method: "DELETE", body: { ids }, timeoutMs: 60_000 }),

  clearAll: () =>
    data<{ deleted: number }>("/api/contacts/bulk?all=true", { method: "DELETE", timeoutMs: 60_000 }),

  import: (contacts: Contact[], source: string, filename?: string) =>
    data<ImportResultPayload>("/api/contacts/import", {
      method: "POST",
      body: { contacts, source, filename: filename ?? null },
      timeoutMs: 120_000,
    }),

  stats: () => data<ContactStatsPayload>("/api/contacts/stats"),

  /** Absolute URL for the export download, used as an anchor href. */
  exportUrl: (format: "csv" | "json" = "csv", query: ContactQuery = {}) =>
    `/api/contacts/export${buildQuery({ ...(query as Record<string, unknown>), format })}`,
}

// ============================================================================
// TEMPLATES
// ============================================================================

export const templatesApi = {
  list: () => data<StoredTemplate[]>("/api/templates"),
  create: (template: Partial<MessageTemplate>) =>
    data<StoredTemplate>("/api/templates", { method: "POST", body: template }),
  update: (id: string, patch: Partial<MessageTemplate>) =>
    data<StoredTemplate>(`/api/templates/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),
  /** Delete one language variant. */
  remove: (id: string) =>
    data<{ id: string; groupDeleted: boolean }>(`/api/templates/${encodeURIComponent(id)}`, { method: "DELETE" }),
  /** Delete a template and every language version of it. */
  removeGroup: (id: string) =>
    data<{ id: string; groupId: string; removed: number }>(
      `/api/templates/${encodeURIComponent(id)}?group=1`,
      { method: "DELETE" },
    ),
}

// ============================================================================
// UPLOADS
// ============================================================================

export const uploadsApi = {
  /** Uploads an image for use in a template and returns its public URL. */
  image: (file: File) => {
    const form = new FormData()
    form.set("file", file)
    return data<{ url: string }>("/api/uploads", { method: "POST", body: form, timeoutMs: 60_000 })
  },
}

// ============================================================================
// SETTINGS
// ============================================================================

export const settingsApi = {
  getAll: () => data<Record<string, string | null>>("/api/settings"),
  save: (patch: Record<string, string | null>) =>
    data<Record<string, string | null>>("/api/settings", { method: "PUT", body: patch }),
}

// ============================================================================
// SEND HISTORY
// ============================================================================

export interface SendHistoryEntryInput {
  contactId?: string | null
  contactNormalized: string
  companyName?: string | null
  templateId?: string | null
  message?: string | null
  status?: "sent" | "failed" | "skipped"
  error?: string | null
}

export const sendHistoryApi = {
  record: (entries: SendHistoryEntryInput[], markContactsSent = true) =>
    data<{ recorded: number; contactsUpdated: number }>("/api/send-history", {
      method: "POST",
      body: { entries, markContactsSent },
      timeoutMs: 60_000,
    }),

  list: (query: { page?: number; perPage?: number; contactId?: string; status?: string } = {}) =>
    request<unknown[]>(`/api/send-history${buildQuery(query)}`),
}
