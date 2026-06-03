"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, Building, Sparkles, Shield, Zap, Target } from "lucide-react"
import { APP_CONSTANTS } from "../constants/app-constants"

interface AppHeaderProps {
  totalContacts: number
  onLoadSavedContacts: () => void
}

export function AppHeader({ totalContacts, onLoadSavedContacts }: AppHeaderProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg shrink-0">
            <MessageCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-950 leading-tight">
              {APP_CONSTANTS.APP_NAME}
            </h1>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-slate-600">Professional business outreach</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button
            onClick={() => window.open("/documentation", "_blank")}
            variant="outline"
            className="w-full sm:w-auto bg-white border-slate-200 text-slate-700"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Documentation
          </Button>
          {totalContacts > 0 && (
            <Button onClick={onLoadSavedContacts} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              <Building className="h-4 w-4 mr-2" />
              Load Saved ({totalContacts})
            </Button>
          )}
        </div>
      </div>

      <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed px-1">
        Transform your business communication with intelligent WhatsApp messaging. Upload contacts, create personalized
        templates, and track your outreach with enterprise-grade tools.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
          <div className="p-1.5 bg-emerald-50 rounded-md">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800 text-sm sm:text-base">Secure & Private</div>
            <div className="text-xs sm:text-sm text-slate-600">Your data stays safe</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
          <div className="p-1.5 bg-emerald-50 rounded-md">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800 text-sm sm:text-base">Lightning Fast</div>
            <div className="text-xs sm:text-sm text-slate-600">Bulk operations</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
          <div className="p-1.5 bg-emerald-50 rounded-md">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800 text-sm sm:text-base">Contact Tools</div>
            <div className="text-xs sm:text-sm text-slate-600">Organized outreach</div>
          </div>
        </div>
      </div>

    </div>
  )
}
