import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Header } from "./components/header"
import { Footer } from "./components/footer"
import { APP_CONSTANTS } from "./constants/app-constants"

export const metadata: Metadata = {
  title: `${APP_CONSTANTS.APP_NAME} - Create WhatsApp Links Instantly`,
  description: APP_CONSTANTS.APP_DESCRIPTION,
  generator: "v0.dev",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    robots: "noindex, nofollow, nocache, noarchive, nosnippet, noimageindex",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow, nocache, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow, noimageindex, noarchive, nosnippet" />
        <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="slurp" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="duckduckbot" content="noindex, nofollow, noarchive, nosnippet" />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
