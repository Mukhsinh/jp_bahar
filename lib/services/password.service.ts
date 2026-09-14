import { createClient } from '@/lib/supabase/client'

export interface PasswordValidation {
  valid: boolean
  errors: string[]
}

/**
 * Validate password strength
 * Requirements: minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least 1 special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Change user's password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      }
    }
    
    // Verify current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }
    
    // Try to sign in with current password to verify it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })
    
    if (signInError) {
      return {
        success: false,
        error: 'Current password is incorrect'
      }
    }
    
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (updateError) {
      return {
        success: false,
        error: updateError.message
      }
    }
    
    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    }
  }
}

/**
 * Reset password for a user (admin function)
 */
export async function resetUserPassword(
  userId: string
): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
  try {
    // Generate temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let tempPassword = ''
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // In production, this should be done via a server-side API route with admin privileges
    // For now, we'll return the temp password and let the admin handle it
    
    return {
      success: true,
      tempPassword
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred'
    }
  }
}
