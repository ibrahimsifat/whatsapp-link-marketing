"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react"
import { APP_CONSTANTS } from "../constants/app-constants"

interface UploadSectionProps {
  state: {
    dragActive: boolean
    fileError: string
    uploadPassword: string
    passwordError: string
    showPassword: boolean
  }
  onStateUpdate: (updates: any) => void
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function UploadSection({ state, onStateUpdate, onDrag, onDrop, onFileChange }: UploadSectionProps) {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-lg border-b border-slate-100">
        <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Upload className="h-5 w-5 text-emerald-600" />
          </div>
          Upload Business Data
        </CardTitle>
        <CardDescription className="text-slate-600">
          Excel/CSV columns: Phone Number, Company Name, Company Category, Website (optional) • Max file size: 10MB
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        {/* Enhanced Password Input */}
        <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-amber-800">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              Security Authentication
            </CardTitle>
            <CardDescription className="text-amber-700">
              Enter the upload password to access file upload functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="upload-password" className="text-sm font-medium text-amber-800">
                Upload Password
              </Label>
              <div className="relative">
                <Input
                  id="upload-password"
                  type={state.showPassword ? "text" : "password"}
                  value={state.uploadPassword}
                  onChange={(e) => {
                    onStateUpdate({ uploadPassword: e.target.value, passwordError: "" })
                  }}
                  placeholder="Enter your upload password"
                  className={`pr-12 h-12 text-base ${
                    state.passwordError
                      ? "border-red-300 focus:border-red-500"
                      : "border-amber-200 focus:border-amber-400"
                  } bg-white/80`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-amber-100"
                  onClick={() => onStateUpdate({ showPassword: !state.showPassword })}
                >
                  {state.showPassword ? (
                    <EyeOff className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-amber-600" />
                  )}
                </Button>
              </div>
              {state.passwordError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{state.passwordError}</p>
                </div>
              )}
              {state.uploadPassword === APP_CONSTANTS.UPLOAD_PASSWORD && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700">Password verified. You can now upload files.</p>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Default Password:</strong> {APP_CONSTANTS.UPLOAD_PASSWORD}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This security measure protects against unauthorized file uploads.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Error */}
        {state.fileError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
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
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            state.dragActive
              ? "border-emerald-400 bg-emerald-50 scale-[1.02] shadow-lg"
              : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
          } ${state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD ? "opacity-50 cursor-not-allowed" : ""}`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <div className="space-y-6">
            <div className="relative">
              <div className="p-6 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl w-fit mx-auto">
                <Upload className="h-12 w-12 text-emerald-600" />
              </div>
              {state.dragActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-emerald-400/20 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <p className="text-xl font-semibold text-slate-700">
                <span className="hidden sm:inline">Drag and drop your Excel/CSV file here</span>
                <span className="sm:hidden">Upload your Excel/CSV file</span>
              </p>
              <p className="text-slate-500">or</p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8"
                disabled={state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD}
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
                disabled={state.uploadPassword !== APP_CONSTANTS.UPLOAD_PASSWORD}
              />
            </div>
            <div className="text-sm text-slate-500 space-y-2 bg-slate-50 rounded-lg p-4">
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
