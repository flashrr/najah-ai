/**
 * Najah AI — Middleware
 *
 * Two jobs only:
 *  1. Refresh the Supabase session token (cookie refresh).
 *  2. Enforce route visibility rules with one-way, non-looping redirects.
 *
 * Redirect rules:
 *  A. Unauthenticated user on a protected route  → /login  (one-hop, safe)
 *  B. Authenticated user on /login or /register  → their dashboard (one-hop)
 *     ONLY when profile exists AND role is a confirmed known value.
 *     If profile is missing or role is unknown  → let user stay on /login.
 *     Rationale: sending a user with no profile to /student/dashboard causes
 *     the student layout to reject them and redirect back to /login → loop.
 *
 * Anti-loop guards:
 *  - Rule B only fires when target !== current pathname.
 *  - Rule B only fires when role is in the explicit known-roles set.
 *    No ?? fallback.  No default role assumption.
 *
 * Session cookies:
 *  Any redirect response inherits cookies from supabaseResponse so that a
 *  token refresh performed during getUser() is not silently discarded.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Protected path prefixes — any pathname that starts with one of these
// requires an authenticated session.
const PROTECTED_PREFIXES = ['/student', '/parent', '/admin']

// Auth-page paths — authenticated users should leave these pages.
const AUTH_PATHS = ['/login', '/register']

// The only roles the application understands.  Anything outside this set
// (null, undefined, empty string, unexpected value) is treated as unknown
// and does NOT trigger a dashboard redirect.
const KNOWN_ROLES = new Set(['student', 'parent', 'admin'])

function dashboardFor(role: string): string {
  if (role === 'admin')  return '/admin/dashboard'
  if (role === 'parent') return '/parent/dashboard'
  return '/student/dashboard'
}

export async function middleware(request: NextRequest) {
  // ── SESSION REFRESH ──────────────────────────────────────────────────────
  // supabaseResponse starts as NextResponse.next().
  // The setAll callback may recreate it when Supabase refreshes a token.
  // Do not insert any logic between createServerClient and getUser() — the
  // cookie refresh must complete before we inspect the session.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── RULE A: Unauthenticated → protected route ────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── RULE B: Authenticated → auth page ───────────────────────────────────
  // Read role from JWT user_metadata — no DB query, no RLS dependency.
  // This is set during signUp via options.data and stored in raw_user_meta_data.
  if (user && AUTH_PATHS.includes(pathname)) {
    const role = (user.user_metadata?.role as string | undefined) ?? ''

    if (KNOWN_ROLES.has(role)) {
      const target = dashboardFor(role)

      if (target !== pathname) {
        const url = request.nextUrl.clone()
        url.pathname = target

        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
        })
        return redirectResponse
      }
    }
  }

  // ── DEFAULT: pass through with session cookies ───────────────────────────
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - common image extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
