"use client"

import { MessageCircle, FileSpreadsheet, BookOpen } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="p-2 bg-green-600 rounded-lg">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              WhatsApp Generator
            </span>
            <span className="text-xs text-gray-500 hidden sm:block">Business Link Generator</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Generator</span>
          </Link>
          <Link
            href="/documentation"
            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
