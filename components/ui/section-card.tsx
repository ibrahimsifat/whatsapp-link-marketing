"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SectionCardProps {
  icon: LucideIcon
  title: ReactNode
  description: ReactNode
  isExpanded: boolean
  onToggle: () => void
  headerExtra?: ReactNode
  children?: ReactNode
}

export function SectionCard({ icon: Icon, title, description, isExpanded, onToggle, headerExtra, children }: SectionCardProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader
        className="bg-white rounded-t-lg border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors p-4 sm:p-5"
        onClick={onToggle}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex-shrink-0">
              <Icon className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-slate-800 text-lg sm:text-xl">{title}</CardTitle>
              <CardDescription className="text-slate-600 text-xs sm:text-sm break-words">{description}</CardDescription>
            </div>
          </div>
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3">
            {headerExtra}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-500 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && <CardContent className="p-3 sm:p-4 lg:p-5">{children}</CardContent>}
    </Card>
  )
}
