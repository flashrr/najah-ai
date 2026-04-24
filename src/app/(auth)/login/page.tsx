'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// useSearchParams must be inside a Suspense boundary — extract to a wrapper.
// We read the ?error param via window.location.search in a useEffect instead,
// which avoids the Suspense requirement entirely and works identically.

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Show errors forwarded from /auth/callback (expired confirmation link, etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cbError = params.get('error')
    if (cbError) setError(cbError)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // createClient() inside the handler — NOT module scope.
    // createBrowserClient at module scope runs during SSR before cookies exist,
    // producing a broken instance that carries into hydration.
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const session = data.session
    if (!session) {
      setError('Sign-in succeeded but no session was returned. Please try again.')
      setLoading(false)
      return
    }

    // Primary: read role from JWT metadata — no DB query, no RLS risk.
    const metaRole = session.user.user_metadata?.role as string | undefined
    const KNOWN_ROLES = new Set(['student', 'parent', 'admin'])

    if (metaRole && KNOWN_ROLES.has(metaRole)) {
      const target =
        metaRole === 'admin'  ? '/admin/dashboard'  :
        metaRole === 'parent' ? '/parent/dashboard' :
                                '/student/dashboard'

      // Full page navigation — ensures all cookies are sent with the server
      // request so middleware and layouts see the authenticated session.
      window.location.href = target
      return
    }

    // Fallback: JWT metadata missing — query profiles table.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (!profile) {
      const hint = profileError
        ? `Database error: ${profileError.message}`
        : 'Profile row is missing. Please contact support.'
      setError(hint)
      setLoading(false)
      return
    }

    if (!KNOWN_ROLES.has(profile.role)) {
      setError(`Unrecognised role "${profile.role}". Please contact support.`)
      setLoading(false)
      return
    }

    const target =
      profile.role === 'admin'  ? '/admin/dashboard'  :
      profile.role === 'parent' ? '/parent/dashboard' :
                                  '/student/dashboard'

    window.location.href = target
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-700 font-bold text-xl">
            <span>🎓</span> Najah AI
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue learning</p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          No account?{' '}
          <Link href="/register" className="text-brand-600 hover:underline font-medium">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
