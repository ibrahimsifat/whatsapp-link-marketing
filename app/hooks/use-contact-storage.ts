"use client"

/**
 * Contact storage hook (Cloudflare D1)
 *
 * Replaces the previous localStorage implementation. The public surface is
 * deliberately unchanged so the components that consume it did not need to be
 * rewritten, but the semantics are now very different:
 *
 *  - the database, not the browser, is the source of truth
 *  - deduplication is enforced by a unique index rather than by comparing
 *    against a possibly-stale in-memory snapshot
 *  - there is no 10MB ceiling, no QuotaExceededError, and no divergence between
 *    two browsers used by the same operator
 *
 * The full filtered contact set is still held in memory, because the bulk
 * sender genuinely needs every matching contact at once. It is hydrated by
 * paging through the API rather than by reading one giant JSON blob, and it is
 * bounded so a runaway list cannot lock up the tab.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { Contact, ContactDatabase } from "../types/contact"
import { ApiError, contactsApi, type ContactQuery, type ContactStatsPayload } from "@/lib/api/client"

const DB_VERSION = "2.0.0"

/** Rows fetched per request while hydrating. Matches the API's page cap. */
const HYDRATE_PAGE_SIZE = 500

/** Hard ceiling on contacts held in memory, to protect the browser tab. */
const MAX_IN_MEMORY = 20_000

export interface StorageOperationResult {
  success: boolean
  message: string
  stats?: Record<string, number>
}

const EMPTY_DATABASE: ContactDatabase = {
  contacts: [],
  lastUpdated: new Date().toISOString(),
  version: DB_VERSION,
  totalContacts: 0,
  sentCount: 0,
  pendingCount: 0,
  notSentCount: 0,
}

/** Turn any thrown value into a message safe to show the operator. */
function toMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function useContactStorage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactStatsPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialising, setIsInitialising] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ContactQuery>({})

  /**
   * Guards against a slow response from an abandoned request overwriting the
   * results of a newer one — the classic out-of-order fetch bug when a user
   * types quickly in a search box.
   */
  const requestSeq = useRef(0)

  // --------------------------------------------------------------------------
  // READS
  // --------------------------------------------------------------------------

  /** Fetch every contact matching `query`, one page at a time. */
  const fetchAllContacts = useCallback(async (query: ContactQuery): Promise<Contact[]> => {
    const collected: Contact[] = []
    let page = 1
    let totalPages = 1

    do {
      const { contacts: pageContacts, meta } = await contactsApi.list({
        ...query,
        page,
        perPage: HYDRATE_PAGE_SIZE,
      })

      collected.push(...pageContacts)
      totalPages = meta.totalPages
      page++
    } while (page <= totalPages && collected.length < MAX_IN_MEMORY)

    return collected
  }, [])

  /** Reload contacts and statistics from the database. */
  const loadContacts = useCallback(
    async (query?: ContactQuery): Promise<StorageOperationResult> => {
      const seq = ++requestSeq.current
      const effectiveQuery = query ?? filters

      setIsLoading(true)
      setError(null)

      try {
        const [loaded, loadedStats] = await Promise.all([fetchAllContacts(effectiveQuery), contactsApi.stats()])

        // A newer request has started; discard this stale result.
        if (seq !== requestSeq.current) {
          return { success: true, message: "Superseded by a newer request" }
        }

        setContacts(loaded)
        setStats(loadedStats)

        return {
          success: true,
          message: `Loaded ${loaded.length} contact${loaded.length === 1 ? "" : "s"}`,
          stats: { loaded: loaded.length, total: loadedStats.total },
        }
      } catch (err) {
        if (seq !== requestSeq.current) {
          return { success: false, message: "Superseded by a newer request" }
        }
        const message = toMessage(err, "Failed to load contacts")
        setError(message)
        return { success: false, message }
      } finally {
        if (seq === requestSeq.current) {
          setIsLoading(false)
          setIsInitialising(false)
        }
      }
    },
    [fetchAllContacts, filters],
  )

  /** Refresh only the aggregate counters; cheaper than a full reload. */
  const refreshStats = useCallback(async () => {
    try {
      setStats(await contactsApi.stats())
    } catch (err) {
      console.error("[contacts] Failed to refresh statistics:", err)
    }
  }, [])

  // Initial hydration.
  useEffect(() => {
    void loadContacts({})
    // Intentionally runs once: `loadContacts` changes identity with `filters`,
    // and refetching on every filter change is handled explicitly by `applyFilters`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --------------------------------------------------------------------------
  // FILTERS
  // --------------------------------------------------------------------------

  /** Apply server-side filters and reload. */
  const applyFilters = useCallback(
    async (next: ContactQuery) => {
      setFilters(next)
      return loadContacts(next)
    },
    [loadContacts],
  )

  // --------------------------------------------------------------------------
  // WRITES
  // --------------------------------------------------------------------------

  /**
   * Persist a set of contacts.
   *
   * Named `saveContacts` for continuity with the old API, but it is an upsert:
   * existing numbers are merged rather than duplicated, and the database
   * decides what is new.
   */
  const saveContacts = useCallback(
    async (incoming: Contact[], source = "manual"): Promise<StorageOperationResult> => {
      if (incoming.length === 0) {
        return { success: false, message: "There are no contacts to save" }
      }

      setIsLoading(true)
      try {
        const result = await contactsApi.import(incoming, source)
        await loadContacts()

        const parts: string[] = []
        if (result.inserted > 0) parts.push(`${result.inserted} new`)
        if (result.updated > 0) parts.push(`${result.updated} updated`)
        if (result.duplicatesInPayload > 0) parts.push(`${result.duplicatesInPayload} duplicates skipped`)

        return {
          success: true,
          message: parts.length > 0 ? `Saved: ${parts.join(", ")}` : "No changes were needed",
          stats: {
            total: result.received,
            saved: result.inserted,
            updated: result.updated,
            duplicates: result.duplicatesInPayload,
          },
        }
      } catch (err) {
        return { success: false, message: toMessage(err, "Failed to save contacts") }
      } finally {
        setIsLoading(false)
      }
    },
    [loadContacts],
  )

  /** Import from a named source, recording an import batch for provenance. */
  const mergeContacts = useCallback(
    async (incoming: Contact[], source: string): Promise<StorageOperationResult> => {
      if (incoming.length === 0) {
        return { success: false, message: "There are no contacts to merge" }
      }

      setIsLoading(true)
      try {
        const result = await contactsApi.import(incoming, source, source)
        await loadContacts()

        return {
          success: true,
          message: `Merged successfully: ${result.inserted} new, ${result.updated} updated, ${result.duplicatesInPayload} duplicates handled`,
          stats: {
            newContacts: result.inserted,
            updated: result.updated,
            duplicates: result.duplicatesInPayload,
            total: result.received,
          },
        }
      } catch (err) {
        return { success: false, message: toMessage(err, "Failed to merge contacts") }
      } finally {
        setIsLoading(false)
      }
    },
    [loadContacts],
  )

  /**
   * Change one contact's status.
   *
   * Updates local state from the server's response rather than reloading the
   * whole list: marking contacts sent happens once per message during a bulk
   * run, and a full refetch each time would be unusable.
   */
  const updateContactStatus = useCallback(
    async (contactId: string, status: Contact["status"], notes?: string): Promise<StorageOperationResult> => {
      try {
        const updated = await contactsApi.updateStatus(contactId, status, notes)

        setContacts((prev) => prev.map((contact) => (contact.id === contactId ? updated : contact)))
        void refreshStats()

        return { success: true, message: "Contact status updated successfully" }
      } catch (err) {
        return { success: false, message: toMessage(err, "Failed to update contact status") }
      }
    },
    [refreshStats],
  )

  /** Update arbitrary fields on a contact. */
  const updateContact = useCallback(
    async (contactId: string, patch: Partial<Contact>): Promise<StorageOperationResult> => {
      try {
        const updated = await contactsApi.update(contactId, patch)

        setContacts((prev) => prev.map((contact) => (contact.id === contactId ? updated : contact)))
        void refreshStats()

        return { success: true, message: "Contact updated successfully" }
      } catch (err) {
        return { success: false, message: toMessage(err, "Failed to update contact") }
      }
    },
    [refreshStats],
  )

  const deleteContact = useCallback(
    async (contactId: string): Promise<StorageOperationResult> => {
      try {
        await contactsApi.remove(contactId)

        setContacts((prev) => prev.filter((contact) => contact.id !== contactId))
        void refreshStats()

        return { success: true, message: "Contact deleted successfully" }
      } catch (err) {
        return { success: false, message: toMessage(err, "Failed to delete contact") }
      }
    },
    [refreshStats],
  )

  /** Delete many contacts in a single request. */
  const bulkDeleteContacts = useCallback(
    async (ids: string[]): Promise<StorageOperationResult> => {
      if (ids.length === 0) return { success: false, message: "No contacts selected" }

      setIsLoading(true)
      try {
        const { deleted } = await contactsApi.bulkRemove(ids)
        const removed = new Set(ids)

        setContacts((prev) => prev.filter((contact) => !removed.has(contact.id)))
        void refreshStats()

        return {
          success: true,
          message: `Deleted ${deleted} contact${deleted === 1 ? "" : "s"}`,
          stats: { deleted },
        }
      } catch (err) {
        return { success: false, message: toMessage(err, "Failed to delete contacts") }
      } finally {
        setIsLoading(false)
      }
    },
    [refreshStats],
  )

  /** Set the same status on many contacts in a single request. */
  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: Contact["status"], notes?: string): Promise<StorageOperationResult> => {
      if (ids.length === 0) return { success: false, message: "No contacts selected" }

      setIsLoading(true)
      try {
        const { updated } = await contactsApi.bulkUpdateStatus(ids, status, notes)
        const now = new Date().toISOString()
        const target = new Set(ids)

        setContacts((prev) =>
          prev.map((contact) =>
            target.has(contact.id)
              ? {
                  ...contact,
                  status,
                  notes: notes ?? contact.notes,
                  lastUpdated: now,
                  sentAt: status === "sent" ? now : undefined,
                }
              : contact,
          ),
        )
        void refreshStats()

        return {
          success: true,
          message: `Updated ${updated} contact${updated === 1 ? "" : "s"}`,
          stats: { updated },
        }
      } catch (err) {
        return { success: false, message: toMessage(err, "Failed to update contacts") }
      } finally {
        setIsLoading(false)
      }
    },
    [refreshStats],
  )

  /**
   * Download every contact as JSON.
   *
   * The file is generated by the server from the live database, so the export
   * is complete even when the browser is only holding a subset.
   */
  /**
   * Export every lead as an .xlsx workbook.
   *
   * Deliberately unfiltered, unlike `exportContacts`: this is the "give me
   * everything" button, so the current screen filters are not applied. The
   * whole set is fetched from the server rather than exported from the page,
   * which only ever holds the current page of results.
   */
  const exportAllToExcel = useCallback(async (): Promise<StorageOperationResult> => {
    try {
      const response = await fetch(contactsApi.exportUrl("json"), {
        credentials: "same-origin",
        cache: "no-store",
      })

      if (!response.ok) throw new Error(`Export failed with status ${response.status}`)

      const payload = (await response.json()) as { contacts?: Contact[] }
      const allContacts = payload.contacts ?? []

      if (allContacts.length === 0) {
        return { success: false, message: "There are no leads to export" }
      }

      const { downloadContactsWorkbook } = await import("../services/excel-exporter")
      downloadContactsWorkbook(allContacts, `leads_${new Date().toISOString().split("T")[0]}.xlsx`)

      return { success: true, message: `Exported ${allContacts.length} leads to Excel` }
    } catch (err) {
      return { success: false, message: toMessage(err, "Failed to export leads") }
    }
  }, [])

  const exportContacts = useCallback(async (): Promise<StorageOperationResult> => {
    try {
      const response = await fetch(contactsApi.exportUrl("json", filters), {
        credentials: "same-origin",
        cache: "no-store",
      })

      if (!response.ok) throw new Error(`Export failed with status ${response.status}`)

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = `whatsapp_contacts_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true, message: "Contacts exported successfully" }
    } catch (err) {
      return { success: false, message: toMessage(err, "Failed to export contacts") }
    }
  }, [filters])

  const clearAllContacts = useCallback(async (): Promise<StorageOperationResult> => {
    setIsLoading(true)
    try {
      const { deleted } = await contactsApi.clearAll()

      setContacts([])
      await refreshStats()

      return {
        success: true,
        message: `Cleared ${deleted} contact${deleted === 1 ? "" : "s"}`,
        stats: { deleted },
      }
    } catch (err) {
      return { success: false, message: toMessage(err, "Failed to clear contacts") }
    } finally {
      setIsLoading(false)
    }
  }, [refreshStats])

  // --------------------------------------------------------------------------
  // DERIVED
  // --------------------------------------------------------------------------

  /**
   * The legacy `ContactDatabase` shape, rebuilt from server data.
   *
   * Counts come from SQL aggregates over the whole table, not from the array in
   * memory, so they stay correct even when a filter is applied.
   */
  const database = useMemo<ContactDatabase>(() => {
    if (!stats) return { ...EMPTY_DATABASE, contacts }

    return {
      contacts,
      lastUpdated: new Date().toISOString(),
      version: DB_VERSION,
      totalContacts: stats.total,
      sentCount: stats.sent,
      pendingCount: stats.pending,
      notSentCount: stats.notSent,
    }
  }, [contacts, stats])

  return {
    // State
    database,
    contacts,
    stats,
    categories: stats?.categories ?? [],
    filters,
    isLoading,
    isInitialising,
    error,

    // Reads
    loadContacts,
    refreshStats,
    applyFilters,

    // Writes
    saveContacts,
    mergeContacts,
    updateContact,
    updateContactStatus,
    deleteContact,
    bulkDeleteContacts,
    bulkUpdateStatus,
    exportContacts,
    exportAllToExcel,
    clearAllContacts,
  }
}
