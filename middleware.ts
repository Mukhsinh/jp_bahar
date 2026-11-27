import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import {
  isPublicRoute,
  isLegacyRoute,
  getLegacyRedirectPath,
  isRouteAllowed
} from '@/lib/services/route-config.service'
import type { Role } from '@/lib/services/rbac.service'

// OPTIMIZED: LRU Cache with better memory management
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>()
  private maxSize: number
  private ttl: number

  constructor(maxSize = 500, ttl = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    // Move to end (LRU)
    this.cache.delete(key)
    this.cache.set(key, item)
    return item.value
  }

  set(key: string, value: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }

    this.cache.set(key, { value, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }
}

// Optimized cache instance with enhanced settings
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes TTL (increased from 5 minutes)
const MAX_CACHE_SIZE = 1000 // Increased cache size
const AUTH_USER_CACHE_TTL = 60 * 1000 // 60s cache per auth cookie signature to prevent 429 rate limits & speed up navigation

const employeeCache = new LRUCache<{
  role: Role
  is_active: boolean
}>(MAX_CACHE_SIZE, CACHE_TTL)

const authUserCache = new LRUCache<any>(MAX_CACHE_SIZE, AUTH_USER_CACHE_TTL)
const inFlightAuthChecks = new Map<string, Promise<{ user: any; error: any }>>()

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Build a stable key from Supabase auth cookies for short-lived verification caching
 * and in-flight request deduplication.
 */
function getAuthCookieSignature(request: NextRequest): string | null {
  const authCookies = request.cookies
    .getAll()
    .filter((c) => c.name.includes('auth-token') || c.name.includes('access-token'))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (authCookies.length === 0) return null
  return authCookies.map((c) => `${c.name}=${c.value}`).join('|')
}

/**
 * Decode a Supabase JWT access token locally (Edge-compatible via atob) as a
 * fallback ONLY when Supabase Cloud Auth returns a transient 429 / network error.
 */
function decodeUnexpiredJwtFromCookies(request: NextRequest): any | null {
  try {
    const authCookies = request.cookies
      .getAll()
      .filter((c) => c.name.includes('auth-token') || c.name.includes('access-token'))

    if (authCookies.length === 0) return null

    const groups: Record<string, { idx: number; val: string }[]> = {}
    for (const c of authCookies) {
      const match = c.name.match(/^(.*?)(?:\.(\d+))?$/)
      const baseName = match ? match[1] : c.name
      const idx = match && match[2] !== undefined ? parseInt(match[2], 10) : 0
      if (!groups[baseName]) groups[baseName] = []
      groups[baseName].push({ idx, val: c.value })
    }

    for (const baseName in groups) {
      let raw = groups[baseName]
        .sort((a, b) => a.idx - b.idx)
        .map((c) => c.val)
        .join('')

      if (!raw) continue

      if (raw.startsWith('base64-')) {
        raw = atob(raw.slice(7).replace(/-/g, '+').replace(/_/g, '/'))
      } else if (!raw.includes('.') && (raw.startsWith('eyJ') || raw.startsWith('W3'))) {
        try {
          const decoded = atob(raw.replace(/-/g, '+').replace(/_/g, '/'))
          if (decoded.startsWith('{') || decoded.startsWith('[')) raw = decoded
        } catch {
          // ignore
        }
      }

      let token = raw
      if (raw.startsWith('{') || raw.startsWith('[')) {
        try {
          const parsed = JSON.parse(raw)
          token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : '') || ''
        } catch {
          continue
        }
      }

      const parts = token.split('.')
      if (parts.length !== 3) continue
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(b64))
      if (!payload?.sub) continue

      // Reject clearly expired tokens (allow 5-minute grace during concurrent refresh race)
      const nowSec = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp + 300 < nowSec) continue

      return {
        id: payload.sub,
        email: payload.email || '',
        user_metadata: payload.user_metadata || {},
        app_metadata: payload.app_metadata || {},
        role: payload.role || payload.app_metadata?.role || payload.user_metadata?.role,
      }
    }
  } catch {
    return null
  }
  return null
}

function isTransientAuthError(error: any): boolean {
  if (!error) return false
  const status = error.status || error.statusCode
  const msg = (error.message || '').toLowerCase()
  return (
    status === 400 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('invalid refresh token') ||
    msg.includes('already used')
  )
}

/**
 * Build redirect URL safely behind reverse proxies (e.g. aaPanel Nginx).
 * Prevents redirecting to internal 127.0.0.1 / 0.0.0.0 / localhost addresses.
 */
function buildRedirectUrl(request: NextRequest, path: string): URL {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()

  if (host) {
    const proto = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'http'
    return new URL(path, `${proto}://${host}`)
  }

  return new URL(path, request.url)
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // 0. Skip middleware for static assets, favicon, health check, and all API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icon') ||
      pathname.includes('.') ||
      pathname.startsWith('/api/')
    ) {
      return response
    }

    if (isDev) {
      console.log('[MIDDLEWARE] Path:', pathname, '| Cookies present:', request.cookies.getAll().map(c => c.name))
    }

    // 1. Create supabase client with modern getAll / setAll
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            } catch (e) {
              // Ignore cookie setting errors in middleware
            }
          },
        },
      }
    )

    // Verify user session with short-lived per-cookie caching + in-flight deduplication
    // to prevent Supabase Cloud 429 Rate Limits and concurrent refresh token race conditions.
    const cookieSig = getAuthCookieSignature(request)
    let user: any = cookieSig ? authUserCache.get(cookieSig) : null
    let userError: any = null

    if (!user && cookieSig) {
      let checkPromise = inFlightAuthChecks.get(cookieSig)
      if (!checkPromise) {
        checkPromise = supabase.auth
          .getUser()
          .then(({ data, error }) => ({ user: data?.user || null, error }))
          .catch((err) => ({ user: null, error: err }))
          .finally(() => {
            inFlightAuthChecks.delete(cookieSig)
          })
        inFlightAuthChecks.set(cookieSig, checkPromise)
      }

      const authResult = await checkPromise
      user = authResult.user
      userError = authResult.error

      if (user) {
        authUserCache.set(cookieSig, user)
      } else if (isTransientAuthError(userError)) {
        // Fallback to local session / JWT check when Supabase Auth hits 429 or concurrent refresh race
        const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
        user = sessionData?.session?.user || decodeUnexpiredJwtFromCookies(request)
        if (user) {
          authUserCache.set(cookieSig, user)
        }
      }
    }

    // If there's an error and it's related to invalid/missing tokens, 
    // we let it be handled by the session check below
    if (userError && !user) {
      // Don't log expected auth errors to keep console clean
      if (!userError.message?.includes('Refresh Token Not Found')) {
        console.warn('[MIDDLEWARE] Auth check:', userError.message)
      }
    }

    const session = user ? { user } : null
    if (isDev) {
      console.log('[MIDDLEWARE] Path:', pathname, '| Session User:', user?.email || 'NONE', '| UserError:', userError?.message || 'NONE')
    }


    // 2. Check if public route (login, reset-password, forbidden)
    if (isPublicRoute(pathname)) {
      // If user is already authenticated and visits /login, redirect to /dashboard
      if (session && pathname === '/login') {
        const dashboardUrl = buildRedirectUrl(request, '/dashboard')
        return NextResponse.redirect(dashboardUrl)
      }
      return response
    }

    // 3. Check for legacy routes and redirect permanently
    if (isLegacyRoute(pathname)) {
      const newPath = getLegacyRedirectPath(pathname)
      if (newPath) {
        const url = buildRedirectUrl(request, newPath)
        url.search = request.nextUrl.search
        return NextResponse.redirect(url, 301)
      }
    }

    // 4. Validate session
    if (!session) {
      // For API routes, return JSON 401 Unauthorized instead of redirect HTML
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Only redirect to login if not already on login page
      if (pathname !== '/login') {
        const loginUrl = buildRedirectUrl(request, '/login')
        const redirectResponse = NextResponse.redirect(loginUrl)

        // Clear auth cookies
        const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token']
        cookiesToClear.forEach(cookieName => {
          redirectResponse.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
        })

        return redirectResponse
      }
      // If already on login page, just continue
      return response
    }

    // 5. Get employee data and role (with optimized caching)
    let employeeData = employeeCache.get(session.user.id)

    // Check if cached role matches auth metadata role
    // If not, invalidate cache to pick up the updated role
    const sessionMetadataRole = session.user.user_metadata?.role
    if (employeeData && sessionMetadataRole && employeeData.role !== sessionMetadataRole) {
      employeeData = null // Invalidate cache
    }

    if (!employeeData) {
      // 1. Check auth metadata first (it's the source of truth for superadmins)
      const userMeta = session.user.user_metadata || {}
      const appMeta = session.user.app_metadata || {}

      const rawRole = (appMeta.role || userMeta.role || '').toString().toLowerCase()
      const isAdmin = rawRole === 'superadmin' || rawRole === 'admin' || session.user.email === 'admin@sungaibahar.com'

      if (isAdmin) {
        employeeData = {
          role: 'superadmin' as Role,
          is_active: true
        }
        employeeCache.set(session.user.id, employeeData)
      } else {
        // 2. Fetch employee record for non-admin users - try user_id first, then email
        let { data: employee, error: employeeError } = await supabase
          .from('m_employees')
          .select('id, role, is_active')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle()

        if (!employee && session.user.email) {
          const { data: empByEmail } = await supabase
            .from('m_employees')
            .select('id, role, is_active')
            .eq('email', session.user.email)
            .limit(1)
            .maybeSingle()

          if (empByEmail) {
            employee = empByEmail
            // Auto-sync user_id for seamless future lookups
            await supabase
              .from('m_employees')
              .update({ user_id: session.user.id })
              .eq('id', empByEmail.id)
          }
        }

        if (employeeError || !employee) {
          console.error('[MIDDLEWARE] User not found in employees and no admin metadata:', session.user.email)
          if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'User record not found' }, { status: 404 })
          }
          const loginUrl = buildRedirectUrl(request, '/login')
          loginUrl.searchParams.set('error', 'user_not_found')
          return NextResponse.redirect(loginUrl)
        }

        employeeData = {
          role: (employee.role || 'employee') as Role,
          is_active: !!employee.is_active
        }
        employeeCache.set(session.user.id, employeeData)
      }
    }

    // 6. Check if employee is active
    if (!employeeData || !employeeData.is_active) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Account inactive or not found' }, { status: 403 })
      }
      const loginUrl = buildRedirectUrl(request, '/login')
      loginUrl.searchParams.set('error', 'inactive')

      const redirectResponse = NextResponse.redirect(loginUrl)
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token']
      cookiesToClear.forEach(cookieName => {
        redirectResponse.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
      })

      return redirectResponse
    }

    // 7. Check route authorization
    // Superadmins can bypass route checks (they have full access)
    if (employeeData && employeeData.role !== 'superadmin' && !pathname.startsWith('/api/') && !isRouteAllowed(pathname, employeeData.role)) {
      const forbiddenUrl = buildRedirectUrl(request, '/forbidden')
      return NextResponse.redirect(forbiddenUrl)
    }

    // 8. Set security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response
  } catch (error: any) {
    console.error('Middleware error:', error)

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Never redirect public routes (like /login) to /login to prevent infinite redirect loops
    if (isPublicRoute(pathname)) {
      return response
    }

    // On any error for protected routes, redirect to login and clear cookies
    const loginUrl = buildRedirectUrl(request, '/login')
    const redirectResponse = NextResponse.redirect(loginUrl)
    const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token', 'sb-auth-token']
    cookiesToClear.forEach(cookieName => {
      redirectResponse.cookies.set(cookieName, '', { maxAge: 0, path: '/' })
    })

    return redirectResponse
  }
}

export const config = {
  matcher: [
    // Protected routes (exact and subpaths)
    '/dashboard',
    '/dashboard/:path*',
    '/units',
    '/units/:path*',
    '/users',
    '/users/:path*',
    '/pegawai',
    '/pegawai/:path*',
    '/kpi-config',
    '/kpi-config/:path*',
    '/pool',
    '/pool/:path*',
    '/realization',
    '/realization/:path*',
    '/assessment',
    '/assessment/:path*',
    '/reports',
    '/reports/:path*',
    '/audit',
    '/audit/:path*',
    '/settings',
    '/settings/:path*',
    '/profile',
    '/profile/:path*',
    '/notifications',
    '/notifications/:path*',
    // Legacy routes for redirect
    '/admin/:path*',
    '/manager/:path*',
    '/employee/:path*',
  ],
}