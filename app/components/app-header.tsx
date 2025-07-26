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
    <div className="text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative flex flex-col items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl shadow-lg">
            <MessageCircle className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              {APP_CONSTANTS.APP_NAME}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span className="text-lg font-medium text-slate-600">Professional Business Outreach</span>
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-slate-600 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
        Transform your business communication with intelligent WhatsApp messaging. Upload contacts, create personalized
        templates, and track your outreach with enterprise-grade tools.
      </p>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
        <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800">Secure & Private</div>
            <div className="text-sm text-slate-600">Your data stays safe</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800">Lightning Fast</div>
            <div className="text-sm text-slate-600">Bulk operations</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Target className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800">Smart Targeting</div>
            <div className="text-sm text-slate-600">Advanced filters</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
        <Button
          onClick={() => window.open("/documentation", "_blank")}
          variant="outline"
          size="lg"
          className="bg-white/80 backdrop-blur-sm hover:bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          View Documentation
        </Button>
        {totalContacts > 0 && (
          <Button
            onClick={onLoadSavedContacts}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Building className="h-5 w-5 mr-2" />
            Load Saved Contacts ({totalContacts})
          </Button>
        )}
      </div>
    </div>
  )
}
