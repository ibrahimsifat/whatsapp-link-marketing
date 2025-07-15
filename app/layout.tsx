import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "./components/header"
import { Footer } from "./components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WhatsApp Business Link Generator | Ibrahim Sifat",
  description:
    "Generate personalized WhatsApp business links with smart templates, contact management, and Excel/CSV import. Perfect for business outreach and marketing campaigns.",
  keywords: "WhatsApp, business links, marketing, contact management, Excel import, CSV import, message templates",
  authors: [{ name: "Ibrahim Sifat", email: "ibrahimsifat.me@gmail.com" }],
  creator: "Ibrahim Sifat",
  openGraph: {
    title: "WhatsApp Business Link Generator",
    description: "Generate personalized WhatsApp business links with smart templates and contact management",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
