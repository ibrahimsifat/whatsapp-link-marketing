"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, AlertTriangle } from "lucide-react"

interface UploadSectionProps {
  state: {
    dragActive: boolean
    fileError: string
  }
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function UploadSection({ state, onDrag, onDrop, onFileChange }: UploadSectionProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader className="bg-white rounded-t-lg border-b border-slate-200 p-4">
        <CardTitle className="flex items-center gap-3 text-slate-800 text-lg sm:text-xl">
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex-shrink-0">
            <Upload className="h-5 w-5 text-emerald-600" />
          </div>
          Upload Business Data
        </CardTitle>
        <CardDescription className="text-slate-600 text-xs sm:text-sm">
          Excel/CSV columns: Phone Number, Company Name, Company Category, Website (optional) • Max file size: 10MB
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-5">
        {/* File Error */}
        {state.fileError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800">Upload Error</h4>
                <p className="text-sm text-red-700 mt-1">{state.fileError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            state.dragActive
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
          }`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-100 rounded-xl w-fit mx-auto">
                <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
              </div>
              {state.dragActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-emerald-400/20 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-base sm:text-lg font-semibold text-slate-700">
                <span className="hidden sm:inline">Drag and drop your Excel/CSV file here</span>
                <span className="sm:hidden">Upload your Excel/CSV file</span>
              </p>
              <p className="text-slate-500">or</p>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-none transition-colors h-10 px-5"
                onClick={() => {
                  const fileInput = document.getElementById("file-upload") as HTMLInputElement
                  if (fileInput) {
                    fileInput.click()
                  }
                }}
              >
                <Upload className="h-5 w-5 mr-2" />
                Choose File
              </Button>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
            <div className="text-xs sm:text-sm text-slate-500 space-y-1.5 bg-slate-50 rounded-lg p-3">
              <p className="font-medium">
                Expected columns: Phone, Company Name, Category, Website, and any custom columns
              </p>
              <p>Supports: .xlsx, .xls, .csv files • Maximum size: 10MB</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
