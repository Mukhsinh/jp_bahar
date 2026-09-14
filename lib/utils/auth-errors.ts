/**
 * Auth Error Handling Utility
 * Maps Supabase authentication errors to user-friendly messages
 * Ensures no technical details are exposed to users
 */

export interface AuthError {
  message: string
  code?: string
  details?: any
}

/**
 * Maps Supabase auth errors to user-friendly Indonesian messages
 * @param error - The error object from Supabase
 * @returns User-friendly error message
 */
export function handleAuthError(error: any): string {
  // Log technical details for debugging (server-side only)
  if (typeof window === 'undefined') {
    console.error('[Auth Error]', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      timestamp: new Date().toISOString(),
    })
  }

  // Return user-friendly messages without technical details
  if (!error) {
    return 'Terjadi kesalahan, silakan coba lagi'
  }

  const message = error.message?.toLowerCase() || ''
  const code = error.code?.toLowerCase() || ''

  // Invalid credentials
  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid password') ||
    message.includes('invalid email or password') ||
    code === 'invalid_credentials'
  ) {
    return 'Email atau password salah'
  }

  // Email not confirmed
  if (message.includes('email not confirmed') || code === 'email_not_confirmed') {
    return 'Email belum diverifikasi'
  }

  // User not found
  if (message.includes('user not found') || code === 'user_not_found') {
    return 'Akun tidak ditemukan'
  }

  // Account disabled/inactive
  if (
    message.includes('user is disabled') ||
    message.includes('account disabled') ||
    code === 'user_disabled'
  ) {
    return 'Akun Anda tidak aktif'
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    code === 'network_error'
  ) {
    return 'Koneksi gagal, silakan coba lagi'
  }

  // Rate limiting
  if (message.includes('rate limit') || code === 'rate_limit_exceeded') {
    return 'Terlalu banyak percobaan, silakan tunggu beberapa saat'
  }

  // Session expired
  if (message.includes('session expired') || code === 'session_expired') {
    return 'Sesi Anda telah berakhir, silakan login kembali'
  }

  // Generic error (no technical details)
  return 'Terjadi kesalahan, silakan coba lagi'
}

/**
 * Logs authentication errors for debugging purposes
 * Only logs on server-side to prevent exposing sensitive info
 * @param context - Context where the error occurred
 * @param error - The error object
 */
export function logAuthError(context: string, error: any): void {
  if (typeof window === 'undefined') {
    console.error(`[Auth Error - ${context}]`, {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Validates that error messages don't contain technical details
 * Used for testing purposes
 * @param message - The error message to validate
 * @returns true if message is safe for users
 */
export function isUserFriendlyMessage(message: string): boolean {
  const technicalTerms = [
    'stack trace',
    'exception',
    'null pointer',
    'undefined',
    'database',
    'query',
    'sql',
    'jwt',
    'token',
    'api key',
    'secret',
    'internal server',
    'status code',
    'http',
  ]

  const lowerMessage = message.toLowerCase()
  return !technicalTerms.some((term) => lowerMessage.includes(term))
}
