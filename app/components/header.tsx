"use client"

import { MessageCircle } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">WhatsApp Link Generator</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-green-600 transition-colors duration-200">
              Generator
            </Link>
            <Link href="/documentation" className="text-gray-700 hover:text-green-600 transition-colors duration-200">
              Documentation
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
