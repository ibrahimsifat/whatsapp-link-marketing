import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Header } from "./components/header"
import { Footer } from "./components/footer"

export const metadata: Metadata = {
  title: "WhatsApp Link Generator - Create WhatsApp Links Instantly",
  description:
    "Generate WhatsApp links quickly and easily with our simple tool. Perfect for businesses and personal use.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
