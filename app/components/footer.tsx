"use client"

import { MessageCircle, Mail, Globe } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">WhatsApp Link Generator</span>
            </div>
            <p className="text-gray-600 text-sm">
              Create WhatsApp links instantly with our simple and powerful generator tool.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Quick Links</h3>
            <div className="space-y-2">
              <Link
                href="/"
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                Generator
              </Link>
              <Link
                href="/documentation"
                className="block text-gray-600 hover:text-green-600 transition-colors duration-200 text-sm"
              >
                Documentation
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:ibrahimsifat.me@gmail.com"
                  className="hover:text-green-600 transition-colors duration-200"
                >
                  ibrahimsifat.me@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe className="h-4 w-4" />
                <span>Ibrahim Sifat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Ibrahim Sifat. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
