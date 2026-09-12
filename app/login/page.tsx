/**
 * Login page
 *
 * Wrapped in Suspense because `LoginForm` reads search params via
 * `useSearchParams`, which opts the subtree into client-side rendering.
 */

import { Suspense } from "react"
import type { Metadata } from "next"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-slate-50 px-4 py-12">
      <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-xl bg-white" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
