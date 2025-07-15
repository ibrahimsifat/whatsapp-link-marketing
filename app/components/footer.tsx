"use client"

import { MessageCircle, Mail, Globe, Github } from "lucide-react"
import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  WhatsApp Generator
                </h3>
                <p className="text-sm text-gray-500">Business Link Generator</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm max-w-xs">
              Generate personalized WhatsApp business links with smart templates and contact management.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-gray-600 hover:text-green-600 transition-colors text-sm">
                Link Generator
              </Link>
              <Link
                href="/documentation"
                className="block text-gray-600 hover:text-green-600 transition-colors text-sm"
              >
                Documentation
              </Link>
              <Link href="#templates" className="block text-gray-600 hover:text-green-600 transition-colors text-sm">
                Message Templates
              </Link>
              <Link
                href="#contact-management"
                className="block text-gray-600 hover:text-green-600 transition-colors text-sm"
              >
                Contact Management
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-green-600" />
                <a href="mailto:ibrahimsifat.me@gmail.com" className="hover:text-green-600 transition-colors">
                  ibrahimsifat.me@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Globe className="h-4 w-4 text-green-600" />
                <span>Ibrahim Sifat</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Github className="h-4 w-4 text-green-600" />
                <a
                  href="https://github.com/ibrahimsifat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-600 transition-colors"
                >
                  @ibrahimsifat
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500">
            © {currentYear} Ibrahim Sifat. All rights reserved. |
            <a href="mailto:ibrahimsifat.me@gmail.com" className="hover:text-green-600 transition-colors ml-1">
              ibrahimsifat.me@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
