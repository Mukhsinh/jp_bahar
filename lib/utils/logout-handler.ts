/**
 * Centralized logout handler to eliminate code duplication
 * Handles session cleanup, storage clearing, and redirection
 */

import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

export interface LogoutOptions {
  redirectTo?: string
  clearStorage?: boolean
}

export async function handleLogout(options: LogoutOptions = {}) {
  const { redirectTo = '/login', clearStorage = true } = options
  
  try {
    const supabase = createClient()
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear browser storage if requested
    if (clearStorage && typeof window !== 'undefined') {
      try {
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear specific cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        })
      } catch (storageError) {
        console.warn('Could not clear storage:', storageError)
      }
    }
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo
    } else {
      redirect(redirectTo)
    }
  } catch (error) {
    console.error('Logout error:', error)
    // Force redirect even if logout fails
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo
    } else {
      redirect(redirectTo)
    }
  }
}

export function createLogoutHandler(options?: LogoutOptions) {
  return () => handleLogout(options)
}