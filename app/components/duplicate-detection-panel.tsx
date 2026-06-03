"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Users, Merge, Eye, Settings, Trash2 } from "lucide-react"
import type { DuplicateGroup, Contact } from "../types/contact"

interface DuplicateDetectionPanelProps {
  duplicateGroups: DuplicateGroup[]
  isScanning: boolean
  onScanDuplicates: () => void
  onAutoMerge: (group: DuplicateGroup) => Contact
  onManualMerge: (contacts: Contact[]) => void
  onIgnoreGroup: (groupId: string) => void
  settings: any
  onUpdateSettings: (settings: any) => void
}

export function DuplicateDetectionPanel({
  duplicateGroups,
  isScanning,
  onScanDuplicates,
  onAutoMerge,
  onManualMerge,
  onIgnoreGroup,
  settings,
  onUpdateSettings,
}: DuplicateDetectionPanelProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())

  const stats = {
    totalGroups: duplicateGroups.length,
    totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.contacts.length - 1, 0),
    highConfidence: duplicateGroups.filter((g) => g.confidence >= 0.9).length,
    autoMergeReady: duplicateGroups.filter((g) => g.autoMergeRecommended).length,
  }

  const handleBulkAutoMerge = () => {
    const autoMergeGroups = duplicateGroups.filter((g) => g.autoMergeRecommended)
    autoMergeGroups.forEach((group) => onAutoMerge(group))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Duplicate Detection
            </CardTitle>
            <CardDescription>Automatically detect and merge duplicate contacts with confidence scoring</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button onClick={onScanDuplicates} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Scan for Duplicates"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
        {showSettings && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Detection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Phone Threshold: {Math.round(settings.phoneThreshold * 100)}%</Label>
                  <input
                    type="range"
                    value={settings.phoneThreshold * 100}
                    onChange={(event) =>
                      onUpdateSettings({ ...settings, phoneThreshold: event.currentTarget.valueAsNumber / 100 })
                    }
                    max={100}
                    min={50}
                    step={5}
                    className="h-2 w-full cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Company Threshold: {Math.round(settings.companyThreshold * 100)}%</Label>
                  <input
                    type="range"
                    value={settings.companyThreshold * 100}
                    onChange={(event) =>
                      onUpdateSettings({ ...settings, companyThreshold: event.currentTarget.valueAsNumber / 100 })
                    }
                    max={100}
                    min={50}
                    step={5}
                    className="h-2 w-full cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Switch
                  checked={settings.enableAutoMerge}
                  onCheckedChange={(checked: boolean) => onUpdateSettings({ ...settings, enableAutoMerge: checked })}
                />
                <Label className="text-xs sm:text-sm">Enable automatic merging for high confidence matches</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.totalGroups > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <Card className="p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-slate-700">{stats.totalGroups}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Duplicate Groups</div>
            </Card>
            <Card className="p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.totalDuplicates}</div>
              <div className="text-xs text-muted-foreground">Total Duplicates</div>
            </Card>
            <Card className="p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.highConfidence}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">High Confidence</div>
            </Card>
            <Card className="p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.autoMergeReady}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Auto-Merge Ready</div>
            </Card>
          </div>
        )}

        {stats.autoMergeReady > 0 && (
          <div className="flex gap-2 p-2 sm:p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-emerald-800">
                {stats.autoMergeReady} groups ready for automatic merging
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-600">
                These duplicates have high confidence scores and can be safely merged
              </p>
            </div>
            <Button size="sm" onClick={handleBulkAutoMerge} className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm h-8 sm:h-9">
              <Merge className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Auto-Merge All
            </Button>
          </div>
        )}

        {duplicateGroups.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-medium text-sm sm:text-base">Detected Duplicates</h3>
            {duplicateGroups.map((group) => (
              <Card key={group.id} className="border-l-4 border-l-emerald-500">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Badge variant={group.autoMergeRecommended ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                        {Math.round(group.confidence * 100)}% match
                      </Badge>
                      <span className="text-xs sm:text-sm text-muted-foreground">{group.contacts.length} contacts</span>
                    </div>
                    <div className="flex gap-1">
                      {group.autoMergeRecommended && (
                        <Button size="sm" onClick={() => onAutoMerge(group)} className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs">
                          <Merge className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          Auto-Merge
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManualMerge(group.contacts)}
                        className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs"
                      >
                        <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        Review
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onIgnoreGroup(group.id)} className="h-7 sm:h-8 px-2">
                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="text-xs sm:text-sm font-medium">
                      Primary: {group.primaryContact.companyName || "No company"}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">{group.primaryContact.normalized}</div>

                    {group.matches.map((match, index) => (
                      <div key={index} className="pl-3 sm:pl-4 border-l-2 border-muted">
                        <div className="text-xs sm:text-sm">{match.contact.companyName || "No company"}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">{match.contact.normalized}</div>
                        <div className="text-[10px] sm:text-xs text-emerald-600">{match.reasons.join(", ")}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isScanning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Scanning for duplicates...</span>
              <span>Processing contacts</span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
