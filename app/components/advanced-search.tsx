"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X, Calendar, Building, Globe, Tag, Users, Save, Trash2, Eye } from "lucide-react"
import type { Contact } from "../types/contact"

export interface SearchCriteria {
  searchTerm?: string
  category?: string
  hasWebsite?: boolean
  status?: Contact["status"]
  source?: string
  dateRange?: {
    start: string
    end: string
  }
  customFields?: Record<string, string>
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
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; criteria: SearchCriteria }>>([])

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
  const saveCriteriaToStorage = (searches: Array<{ name: string; criteria: SearchCriteria }>) => {
    localStorage.setItem("whatsapp-saved-searches", JSON.stringify(searches))
    setSavedSearches(searches)
  }

  const handleSearch = () => {
    onSearch(criteria)
  }

  const handleClear = () => {
    setCriteria({})
    onClearSearch()
  }

  const handleSaveSearch = () => {
    const name = prompt("Enter a name for this search:")
    if (name && name.trim()) {
      const newSearches = [...savedSearches, { name: name.trim(), criteria }]
      saveCriteriaToStorage(newSearches)
    }
  }

  const handleLoadSearch = (savedCriteria: SearchCriteria) => {
    setCriteria(savedCriteria)
    onSearch(savedCriteria)
  }

  const handleDeleteSavedSearch = (index: number) => {
    const newSearches = savedSearches.filter((_, i) => i !== index)
    saveCriteriaToStorage(newSearches)
  }

  const updateCustomField = (field: string, value: string) => {
    setCriteria({
      ...criteria,
      customFields: {
        ...criteria.customFields,
        [field]: value,
      },
    })
  }

  const removeCustomField = (field: string) => {
    const newCustomFields = { ...criteria.customFields }
    delete newCustomFields[field]
    setCriteria({
      ...criteria,
      customFields: Object.keys(newCustomFields).length > 0 ? newCustomFields : undefined,
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (criteria.searchTerm) count++
    if (criteria.category) count++
    if (criteria.hasWebsite !== undefined) count++
    if (criteria.status) count++
    if (criteria.source) count++
    if (criteria.dateRange) count++
    if (criteria.customFields) count += Object.keys(criteria.customFields).length
    return count
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg border-b border-slate-100">
        <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Search className="h-5 w-5 text-indigo-600" />
          </div>
          Advanced Search & Filters
          {getActiveFiltersCount() > 0 && (
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">{getActiveFiltersCount()} active</Badge>
          )}
        </CardTitle>
        <CardDescription className="text-slate-600">
          Use multiple criteria to find specific contacts in your database
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {/* Basic Search */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-slate-600" />
            <Label className="text-sm font-medium text-slate-700">Text Search</Label>
          </div>
          <Input
            placeholder="Search by company name, phone number, or website..."
            value={criteria.searchTerm || ""}
            onChange={(e) => setCriteria({ ...criteria, searchTerm: e.target.value })}
            className="h-12 text-base bg-white/80"
          />
        </div>

        <Separator />

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Category Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-600" />
              <Label className="text-sm font-medium text-slate-700">Category</Label>
            </div>
            <Select
              value={criteria.category || "all"}
              onValueChange={(value) => setCriteria({ ...criteria, category: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="bg-white/80">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Website Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-600" />
              <Label className="text-sm font-medium text-slate-700">Website</Label>
            </div>
            <Select
              value={criteria.hasWebsite === undefined ? "any" : criteria.hasWebsite.toString()}
              onValueChange={(value) =>
                setCriteria({
                  ...criteria,
                  hasWebsite: value === "any" ? undefined : value === "true",
                })
              }
            >
              <SelectTrigger className="bg-white/80">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="true">Has Website</SelectItem>
                <SelectItem value="false">No Website</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-600" />
              <Label className="text-sm font-medium text-slate-700">Status</Label>
            </div>
            <Select
              value={criteria.status || "any"}
              onValueChange={(value) => setCriteria({ ...criteria, status: (value as Contact["status"]) || undefined })}
            >
              <SelectTrigger className="bg-white/80">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="not_sent">Not Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600" />
              <Label className="text-sm font-medium text-slate-700">Source</Label>
            </div>
            <Select
              value={criteria.source || "any"}
              onValueChange={(value) => setCriteria({ ...criteria, source: value === "any" ? undefined : value })}
            >
              <SelectTrigger className="bg-white/80">
                <SelectValue placeholder="Any source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any source</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-600" />
              <Label className="text-sm font-medium text-slate-700">Date Range</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={criteria.dateRange?.start || ""}
                onChange={(e) =>
                  setCriteria({
                    ...criteria,
                    dateRange: {
                      start: e.target.value,
                      end: criteria.dateRange?.end || "",
                    },
                  })
                }
                className="bg-white/80 text-sm"
              />
              <Input
                type="date"
                value={criteria.dateRange?.end || ""}
                onChange={(e) =>
                  setCriteria({
                    ...criteria,
                    dateRange: {
                      start: criteria.dateRange?.start || "",
                      end: e.target.value,
                    },
                  })
                }
                className="bg-white/80 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-600" />
                <Label className="text-sm font-medium text-slate-700">Custom Fields</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field) => (
                  <div key={field} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-slate-600">{field}</Label>
                      {criteria.customFields?.[field] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomField(field)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder={`Filter by ${field}...`}
                      value={criteria.customFields?.[field] || ""}
                      onChange={(e) => updateCustomField(field, e.target.value)}
                      className="bg-white/80 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleSearch}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none"
          >
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>

          <Button
            onClick={handleClear}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 flex-1 sm:flex-none bg-transparent"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>

          <Button
            onClick={handleSaveSearch}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50 flex-1 sm:flex-none bg-transparent"
            disabled={getActiveFiltersCount() === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Search
          </Button>
        </div>

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <Label className="text-sm font-medium text-slate-700">Saved Searches</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedSearches.map((saved, index) => (
                  <Card key={index} className="border border-slate-200 hover:border-indigo-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-slate-800 truncate">{saved.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSavedSearch(index)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleLoadSearch(saved.criteria)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-xs flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Load
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Search Results Summary */}
        {getActiveFiltersCount() > 0 && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2 text-indigo-800">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {criteria.searchTerm && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                  Text: "{criteria.searchTerm}"
                </Badge>
              )}
              {criteria.category && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                  Category: {criteria.category}
                </Badge>
              )}
              {criteria.hasWebsite !== undefined && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                  Website: {criteria.hasWebsite ? "Yes" : "No"}
                </Badge>
              )}
              {criteria.status && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                  Status: {criteria.status}
                </Badge>
              )}
              {criteria.source && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                  Source: {criteria.source}
                </Badge>
              )}
              {criteria.customFields &&
                Object.entries(criteria.customFields).map(([field, value]) => (
                  <Badge key={field} variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {field}: {value}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
