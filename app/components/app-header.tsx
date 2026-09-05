"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, Building } from "lucide-react"

interface AppHeaderProps {
  totalContacts: number
  onLoadSavedContacts: () => void
}

export function AppHeader({ totalContacts, onLoadSavedContacts }: AppHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <p className="text-slate-600 text-sm leading-relaxed">
        Upload contacts, personalize a template, and dispatch WhatsApp messages in bulk.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center shrink-0">
        <Button
          onClick={() => window.open("/documentation", "_blank")}
          variant="outline"
          className="w-full sm:w-auto h-9 bg-white border-slate-200 text-slate-700"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Documentation
        </Button>
        {totalContacts > 0 && (
          <Button onClick={onLoadSavedContacts} className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-700">
            <Building className="h-4 w-4 mr-2" />
            Load Saved ({totalContacts})
          </Button>
        )}
      </div>
    </div>
  )
}
