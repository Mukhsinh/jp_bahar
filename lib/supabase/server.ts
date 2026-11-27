import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Reuse stateless service-role client across server requests (Node.js process pooling)
let adminClientSingleton: SupabaseClient | null = null

/**
 * Create a Supabase client for server-side operations with user context
 * Uses anon key with cookie-based auth for user-scoped operations
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error: any) {
            // Handle cookie setting errors (e.g. from Server Components)
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase admin client for server-side operations
 * Uses service role key for admin operations (bypasses RLS)
 * ONLY use this for admin operations that require elevated privileges
 */
export async function createAdminClient() {
  if (!adminClientSingleton) {
    adminClientSingleton = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return adminClientSingleton
}

/**
 * Request-memoized current user lookup for Server Components (deduplicates layout + page auth calls)
 */
export const getCachedAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
