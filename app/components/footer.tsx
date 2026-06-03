"use client"

import { MessageCircle, Mail, Globe } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-6 py-5 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Brand Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              <span className="text-base sm:text-lg font-semibold text-gray-900">WhatsApp Link Generator</span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">
              Create WhatsApp links instantly with our simple and powerful generator tool.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider">Quick Links</h3>
            <div className="space-y-1.5 sm:space-y-2">
              <Link
                href="/"
                className="block text-gray-600 hover:text-emerald-600 transition-colors duration-200 text-xs sm:text-sm"
              >
                Generator
              </Link>
              <Link
                href="/documentation"
                className="block text-gray-600 hover:text-emerald-600 transition-colors duration-200 text-xs sm:text-sm"
              >
                Documentation
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact</h3>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <a
                  href="mailto:ibrahimsifat.me@gmail.com"
                  className="hover:text-emerald-600 transition-colors duration-200"
                >
                  ibrahimsifat.me@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Ibrahim Sifat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} Ibrahim Sifat. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
