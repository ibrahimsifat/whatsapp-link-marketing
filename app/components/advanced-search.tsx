"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, Save, Trash2, X, Calendar, Building, Globe, Phone, User, Clock, Sparkles } from "lucide-react"
import type { Contact } from "../types/contact"

export interface SearchCriteria {
  id?: string
  name?: string
  searchTerm?: string
  companyName?: string
  companyCategory?: string
  hasWebsite?: boolean | "all"
  status?: string
  source?: string
  phonePattern?: string
  dateFrom?: string
  dateTo?: string
  customFields?: Record<string, string>
}

export interface SavedSearch {
  id: string
  name: string
  criteria: SearchCriteria
  createdAt: string
  lastUsed: string
  useCount: number
}

interface AdvancedSearchProps {
  contacts: Contact[]
  onSearch: (criteria: SearchCriteria) => void
  onClearSearch: () => void
  currentCriteria: SearchCriteria
  categories: string[]
  sources: string[]
  customFields: string[]
}

export function AdvancedSearch({
  contacts,
  onSearch,
  onClearSearch,
  currentCriteria,
  categories,
  sources,
  customFields,
}: AdvancedSearchProps) {
  const [criteria, setCriteria] = useState<SearchCriteria>(currentCriteria)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState("")

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("whatsapp-saved-searches")
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to load saved searches:", error)
      }
    }
  }, [])

  // Save searches to localStorage
  const saveSavedSearches = (searches: SavedSearch[]) => {
    setSavedSearches(searches)
    localStorage.setItem("whatsapp-saved-searches", JSON.stringify(searches))
  }

  const updateCriteria = (updates: Partial<SearchCriteria>) => {
    const newCriteria = { ...criteria, ...updates }
    setCriteria(newCriteria)
  }

  const handleSearch = () => {
    onSearch(criteria)
  }

  const handleClear = () => {
    const emptyCriteria: SearchCriteria = {}
    setCriteria(emptyCriteria)
    onClearSearch()
  }

  const saveCurrentSearch = () => {
    if (!saveSearchName.trim()) return

    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name: saveSearchName.trim(),
      criteria: { ...criteria },
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 1,
    }

    const updatedSearches = [newSearch, ...savedSearches].slice(0, 10) // Keep only 10 most recent
    saveSavedSearches(updatedSearches)
    setSaveSearchName("")
    setIsDialogOpen(false)
  }

  const loadSavedSearch = (search: SavedSearch) => {
    setCriteria(search.criteria)
    onSearch(search.criteria)

    // Update usage stats
    const updatedSearches = savedSearches.map((s) =>
      s.id === search.id ? { ...s, lastUsed: new Date().toISOString(), useCount: s.useCount + 1 } : s,
    )
    saveSavedSearches(updatedSearches)
  }

  const deleteSavedSearch = (searchId: string) => {
    const updatedSearches = savedSearches.filter((s) => s.id !== searchId)
    saveSavedSearches(updatedSearches)
  }

  const getActiveFiltersCount = () => {
    return Object.values(criteria).filter((value) => value !== undefined && value !== "" && value !== "all").length
  }

  const hasActiveFilters = getActiveFiltersCount() > 0

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-t-lg border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="h-5 w-5 text-purple-600" />
              </div>
              Advanced Search
              {hasActiveFilters && (
                <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200 shadow-sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {getActiveFiltersCount()} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-600">
              Search contacts with multiple criteria and save your queries
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {savedSearches.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Saved ({savedSearches.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-sm">
                  {savedSearches.map((search) => (
                    <div key={search.id}>
                      <div className="flex items-center justify-between p-2">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => loadSavedSearch(search)}
                            className="text-left w-full hover:bg-slate-50 p-2 rounded transition-colors"
                          >
                            <div className="font-medium text-sm truncate">{search.name}</div>
                            <div className="text-xs text-slate-500">Used {search.useCount} times</div>
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedSearch(search.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <DropdownMenuSeparator />
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                  disabled={!hasActiveFilters}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle>Save Search Query</DialogTitle>
                  <DialogDescription>Give your search query a name to save it for later use.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search-name">Search Name</Label>
                    <Input
                      id="search-name"
                      value={saveSearchName}
                      onChange={(e) => setSaveSearchName(e.target.value)}
                      placeholder="e.g., Companies with websites in Riyadh"
                      className="bg-white/80"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={saveCurrentSearch}
                    disabled={!saveSearchName.trim()}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  >
                    Save Search
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-slate-700 font-medium">
              <Search className="h-4 w-4" />
              General Search
            </Label>
            <Input
              value={criteria.searchTerm || ""}
              onChange={(e) => updateCriteria({ searchTerm: e.target.value })}
              placeholder="Search in all fields..."
              className="h-12 bg-white/80 border-slate-200"
            />
          </div>
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-slate-700 font-medium">
              <Phone className="h-4 w-4" />
              Phone Pattern
            </Label>
            <Input
              value={criteria.phonePattern || ""}
              onChange={(e) => updateCriteria({ phonePattern: e.target.value })}
              placeholder="e.g., 055, +966, 1234"
              className="h-12 bg-white/80 border-slate-200"
            />
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* Company Filters */}
        <div className="space-y-6">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-4 w-4 text-blue-600" />
            </div>
            Company Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">Company Name</Label>
              <Input
                value={criteria.companyName || ""}
                onChange={(e) => updateCriteria({ companyName: e.target.value })}
                placeholder="Search company names..."
                className="h-12 bg-white/80 border-slate-200"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">Category</Label>
              <Select
                value={criteria.companyCategory || "all"}
                onValueChange={(value) => updateCriteria({ companyCategory: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="h-12 bg-white/80 border-slate-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-slate-700 font-medium">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Select
                value={criteria.hasWebsite === undefined ? "all" : criteria.hasWebsite.toString()}
                onValueChange={(value) =>
                  updateCriteria({ hasWebsite: value === "all" ? undefined : value === "true" })
                }
              >
                <SelectTrigger className="h-12 bg-white/80 border-slate-200">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">With Website</SelectItem>
                  <SelectItem value="false">No Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* Status and Source Filters */}
        <div className="space-y-6">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Filter className="h-4 w-4 text-emerald-600" />
            </div>
            Status & Source
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">Status</Label>
              <Select
                value={criteria.status || "all"}
                onValueChange={(value) => updateCriteria({ status: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="h-12 bg-white/80 border-slate-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="not_sent">Not Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">Source</Label>
              <Select
                value={criteria.source || "all"}
                onValueChange={(value) => updateCriteria({ source: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="h-12 bg-white/80 border-slate-200">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm">
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* Date Range */}
        <div className="space-y-6">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
            Date Range
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">From Date</Label>
              <Input
                type="date"
                value={criteria.dateFrom || ""}
                onChange={(e) => updateCriteria({ dateFrom: e.target.value })}
                className="h-12 bg-white/80 border-slate-200"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">To Date</Label>
              <Input
                type="date"
                value={criteria.dateTo || ""}
                onChange={(e) => updateCriteria({ dateTo: e.target.value })}
                className="h-12 bg-white/80 border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <>
            <Separator className="bg-slate-200" />
            <div className="space-y-6">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                Custom Fields
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customFields.slice(0, 4).map((field) => (
                  <div key={field} className="space-y-3">
                    <Label className="capitalize text-slate-700 font-medium">
                      {field.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <Input
                      value={criteria.customFields?.[field] || ""}
                      onChange={(e) =>
                        updateCriteria({
                          customFields: {
                            ...criteria.customFields,
                            [field]: e.target.value,
                          },
                        })
                      }
                      placeholder={`Search ${field}...`}
                      className="h-12 bg-white/80 border-slate-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(criteria).map(([key, value]) => {
                  if (!value || value === "all") return null
                  return (
                    <Badge key={key} variant="outline" className="text-xs bg-slate-50 border-slate-300">
                      {key}: {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                      <button
                        onClick={() => updateCriteria({ [key]: undefined })}
                        className="ml-2 hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!hasActiveFilters}
              className="bg-white/80 border-slate-200 hover:bg-slate-50"
            >
              Clear All
            </Button>
            <Button
              onClick={handleSearch}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
