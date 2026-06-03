"use client"

import { useState } from "react"
import { MessageCircle, Menu, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center min-w-0">
            <Link href="/" className="flex items-center space-x-2">
              <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 flex-shrink-0" />
              <span className="text-base sm:text-xl font-bold text-gray-900 truncate">
                <span className="sm:hidden">WhatsApp Links</span>
                <span className="hidden sm:inline">WhatsApp Link Generator</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-emerald-600 transition-colors duration-200">
              Generator
            </Link>
            <Link href="/documentation" className="text-gray-700 hover:text-emerald-600 transition-colors duration-200">
              Documentation
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden flex-shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Generator
              </Link>
              <Link
                href="/documentation"
                className="text-gray-700 hover:text-emerald-600 transition-colors duration-200 px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Documentation
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
