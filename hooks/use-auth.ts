"use client"

/**
 * Client-side auth state
 *
 * The token itself is never visible here — it is an HttpOnly cookie. This hook
 * only tracks *who* is signed in, by asking the server, and wires the global
 * 401 handler so any expired session anywhere in the app lands the user on the
 * login page instead of showing a wall of failed requests.
 */

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { authApi, setUnauthorizedHandler } from "@/lib/api/client"

export interface AuthUser {
  email: string
  role: string
  sessionId: string
  expiresAt: string | null
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Redirect on any 401 from any request in the app.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      router.replace("/login")
    })
    return () => setUnauthorizedHandler(null)
  }, [router])

  useEffect(() => {
    let cancelled = false

    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        // Middleware has already redirected unauthenticated page loads, so a
        // failure here just means "unknown user"; it is not worth surfacing.
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await authApi.logout()
    } catch {
      // Even if the request fails, send the user to /login: middleware will
      // re-evaluate the cookie and the worst case is a second sign-out click.
    } finally {
      setUser(null)
      router.replace("/login")
      router.refresh()
      setIsSigningOut(false)
    }
  }, [router])

  return { user, isLoading, isSigningOut, signOut, isAuthenticated: Boolean(user) }
}
