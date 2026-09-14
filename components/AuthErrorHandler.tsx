'use client'

import { useEffect } from 'react'
import { setupAuthErrorHandler } from '@/lib/utils/auth-session'

/**
 * Client component to setup global auth error handling
 * Catches invalid refresh token errors and handles them gracefully
 */
export function AuthErrorHandler() {
  useEffect(() => {
    setupAuthErrorHandler()
  }, [])

  return null
}
