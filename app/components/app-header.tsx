"use client"

import { Button } from "@/components/ui/button"
import { Building, Cloud, LogOut, RefreshCw } from "lucide-react"

interface AppHeaderProps {
  totalContacts: number
  onLoadSavedContacts: () => void
  userEmail?: string
  onSignOut?: () => void
  isSigningOut?: boolean
  /** True while a database read or write is in flight. */
  isSyncing?: boolean
}

export function AppHeader({
  totalContacts,
  onLoadSavedContacts,
  userEmail,
  onSignOut,
  isSigningOut,
  isSyncing,
}: AppHeaderProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm leading-relaxed text-slate-600">
          Upload contacts, personalize a template, and dispatch WhatsApp messages in bulk.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Cloud className={`h-3.5 w-3.5 ${isSyncing ? "animate-pulse text-emerald-500" : ""}`} />
            {isSyncing ? "Syncing..." : "Saved to Cloudflare D1"}
          </span>
          {userEmail && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{userEmail}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          onClick={onLoadSavedContacts}
          variant="outline"
          className="h-9 w-full border-slate-200 bg-white text-slate-700 sm:w-auto"
          disabled={isSyncing}
        >
          {totalContacts > 0 ? (
            <>
              <Building className="mr-2 h-4 w-4" />
              Reload ({totalContacts})
            </>
          ) : (
            <>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              Refresh
            </>
          )}
        </Button>

        {onSignOut && (
          <Button
            onClick={onSignOut}
            variant="ghost"
            className="h-9 w-full text-slate-500 hover:text-slate-900 sm:w-auto"
            disabled={isSigningOut}
            aria-label="Sign out"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        )}
      </div>
    </div>
  )
}
