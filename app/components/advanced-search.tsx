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
import { Search, Filter, Save, Trash2, X, Calendar, Building, Globe, Phone, User, Clock } from "lucide-react"
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
    <Card className="border-2 border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Search className="h-5 w-5" />
              Advanced Search
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {getActiveFiltersCount()} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-purple-600">
              Search contacts with multiple criteria and save your queries
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {savedSearches.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-purple-200 bg-transparent">
                    <Clock className="h-4 w-4 mr-2" />
                    Saved ({savedSearches.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {savedSearches.map((search) => (
                    <div key={search.id}>
                      <div className="flex items-center justify-between p-2">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => loadSavedSearch(search)}
                            className="text-left w-full hover:bg-gray-50 p-1 rounded"
                          >
                            <div className="font-medium text-sm truncate">{search.name}</div>
                            <div className="text-xs text-gray-500">Used {search.useCount} times</div>
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedSearch(search.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
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
                  className="border-purple-200 bg-transparent"
                  disabled={!hasActiveFilters}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveCurrentSearch} disabled={!saveSearchName.trim()}>
                    Save Search
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              General Search
            </Label>
            <Input
              value={criteria.searchTerm || ""}
              onChange={(e) => updateCriteria({ searchTerm: e.target.value })}
              placeholder="Search in all fields..."
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Pattern
            </Label>
            <Input
              value={criteria.phonePattern || ""}
              onChange={(e) => updateCriteria({ phonePattern: e.target.value })}
              placeholder="e.g., 055, +966, 1234"
            />
          </div>
        </div>

        <Separator />

        {/* Company Filters */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={criteria.companyName || ""}
                onChange={(e) => updateCriteria({ companyName: e.target.value })}
                placeholder="Search company names..."
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={criteria.companyCategory || "all"}
                onValueChange={(value) => updateCriteria({ companyCategory: value === "all" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Select
                value={criteria.hasWebsite === undefined ? "all" : criteria.hasWebsite.toString()}
                onValueChange={(value) =>
                  updateCriteria({ hasWebsite: value === "all" ? undefined : value === "true" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">With Website</SelectItem>
                  <SelectItem value="false">No Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Status and Source Filters */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Status & Source
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={criteria.status || "all"}
                onValueChange={(value) => updateCriteria({ status: value === "all" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="not_sent">Not Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={criteria.source || "all"}
                onValueChange={(value) => updateCriteria({ source: value === "all" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
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

        <Separator />

        {/* Date Range */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={criteria.dateFrom || ""}
                onChange={(e) => updateCriteria({ dateFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={criteria.dateTo || ""}
                onChange={(e) => updateCriteria({ dateTo: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Custom Fields
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.slice(0, 4).map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field.replace(/([A-Z])/g, " $1").trim()}</Label>
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
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(criteria).map(([key, value]) => {
                  if (!value || value === "all") return null
                  return (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key}: {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                      <button
                        onClick={() => updateCriteria({ [key]: undefined })}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClear} disabled={!hasActiveFilters}>
              Clear All
            </Button>
            <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
