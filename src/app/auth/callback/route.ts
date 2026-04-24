/**
 * /auth/callback — Supabase PKCE email confirmation handler.
 *
 * Supabase sends a `code` query param to this URL after the user clicks the
 * email confirmation link. We exchange that code for a session, then redirect
 * the user to their dashboard based on their role.
 *
 * Without this route, PKCE-based email confirmation silently fails:
 * the user clicks the link, lands on the app, but has no session.
 *
 * Configured in Supabase Dashboard → Authentication → URL Configuration:
 *   Redirect URL: http://localhost:3001/auth/callback  (dev)
 *                 https://your-domain.com/auth/callback  (prod)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  // Supabase can send an error param if the link is expired or already used
  if (error) {
    const desc = searchParams.get('error_description') ?? error
    const url  = new URL('/login', origin)
    url.searchParams.set('error', desc)
    return NextResponse.redirect(url)
  }

  if (!code) {
    // No code and no error — unexpected state, send to login
    return NextResponse.redirect(new URL('/login', origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.session) {
    // Code exchange failed (expired, already used, etc.)
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'Confirmation link is expired or already used. Please sign in.')
    return NextResponse.redirect(url)
  }

  // Determine where to send the user based on role in JWT metadata
  const role = data.session.user.user_metadata?.role as string | undefined
  const KNOWN_ROLES = new Set(['student', 'parent', 'admin'])

  let target = '/student/dashboard' // safe default
  if (role && KNOWN_ROLES.has(role)) {
    target =
      role === 'admin'  ? '/admin/dashboard'  :
      role === 'parent' ? '/parent/dashboard' :
                          '/student/dashboard'
  }

  return NextResponse.redirect(new URL(target, origin))
}
