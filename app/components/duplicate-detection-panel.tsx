"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Switch } from "./ui/switch"
import { Slider } from "./ui/slider"
import { Label } from "./ui/label"
import { AlertTriangle, Users, Merge, Eye, Settings, Trash2 } from "lucide-react"
import type { DuplicateGroup, Contact } from "../app/types/contact"

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
              <Users className="h-5 w-5" />
              Duplicate Detection
            </CardTitle>
            <CardDescription>Automatically detect and merge duplicate contacts with confidence scoring</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={onScanDuplicates} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Scan for Duplicates"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showSettings && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Detection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Threshold: {Math.round(settings.phoneThreshold * 100)}%</Label>
                  <Slider
                    value={[settings.phoneThreshold * 100]}
                    onValueChange={([value]) => onUpdateSettings({ ...settings, phoneThreshold: value / 100 })}
                    max={100}
                    min={50}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Threshold: {Math.round(settings.companyThreshold * 100)}%</Label>
                  <Slider
                    value={[settings.companyThreshold * 100]}
                    onValueChange={([value]) => onUpdateSettings({ ...settings, companyThreshold: value / 100 })}
                    max={100}
                    min={50}
                    step={5}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.enableAutoMerge}
                  onCheckedChange={(checked) => onUpdateSettings({ ...settings, enableAutoMerge: checked })}
                />
                <Label>Enable automatic merging for high confidence matches</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.totalGroups > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-3">
              <div className="text-2xl font-bold text-orange-600">{stats.totalGroups}</div>
              <div className="text-xs text-muted-foreground">Duplicate Groups</div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold text-red-600">{stats.totalDuplicates}</div>
              <div className="text-xs text-muted-foreground">Total Duplicates</div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold text-green-600">{stats.highConfidence}</div>
              <div className="text-xs text-muted-foreground">High Confidence</div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold text-blue-600">{stats.autoMergeReady}</div>
              <div className="text-xs text-muted-foreground">Auto-Merge Ready</div>
            </Card>
          </div>
        )}

        {stats.autoMergeReady > 0 && (
          <div className="flex gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <AlertTriangle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                {stats.autoMergeReady} groups ready for automatic merging
              </p>
              <p className="text-xs text-green-600">
                These duplicates have high confidence scores and can be safely merged
              </p>
            </div>
            <Button size="sm" onClick={handleBulkAutoMerge} className="bg-green-600 hover:bg-green-700">
              <Merge className="h-4 w-4 mr-1" />
              Auto-Merge All
            </Button>
          </div>
        )}

        {duplicateGroups.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Detected Duplicates</h3>
            {duplicateGroups.map((group) => (
              <Card key={group.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={group.autoMergeRecommended ? "default" : "secondary"}>
                        {Math.round(group.confidence * 100)}% match
                      </Badge>
                      <span className="text-sm text-muted-foreground">{group.contacts.length} contacts</span>
                    </div>
                    <div className="flex gap-1">
                      {group.autoMergeRecommended && (
                        <Button size="sm" onClick={() => onAutoMerge(group)} className="h-7 px-2">
                          <Merge className="h-3 w-3 mr-1" />
                          Auto-Merge
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManualMerge(group.contacts)}
                        className="h-7 px-2"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onIgnoreGroup(group.id)} className="h-7 px-2">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Primary: {group.primaryContact.companyName || "No company"}
                    </div>
                    <div className="text-xs text-muted-foreground">{group.primaryContact.normalized}</div>

                    {group.matches.map((match, index) => (
                      <div key={index} className="pl-4 border-l-2 border-muted">
                        <div className="text-sm">{match.contact.companyName || "No company"}</div>
                        <div className="text-xs text-muted-foreground">{match.contact.normalized}</div>
                        <div className="text-xs text-blue-600">{match.reasons.join(", ")}</div>
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
