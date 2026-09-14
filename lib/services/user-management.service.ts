import { createClient } from '@/lib/supabase/client'
import type { User, CreateUserData, UpdateUserData } from '@/lib/types/database.types'

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate a random 8-character alphanumeric password
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Get all users with pagination and search
 * Now uses m_employees with user_id linking to auth.users
 * Note: This should be called from server-side only
 */
export async function getUsers(
  page: number = 1,
  pageSize: number = 50,
  searchTerm: string = ''
): Promise<{ data: User[]; count: number; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get employees with their auth user data
    let query = supabase
      .from('m_employees')
      .select(`
        id,
        user_id,
        employee_code,
        full_name,
        unit_id,
        tax_status,
        is_active,
        created_at,
        updated_at,
        m_units(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply search filter
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,employee_code.ilike.%${searchTerm}%`)
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data: employees, error, count } = await query
    
    if (error) {
      return { data: [], count: 0, error: error.message }
    }
    
    // Transform data - we'll get email and role from API route
    // This function should be replaced with server-side API call
    const transformedData: User[] = (employees || []).map((emp: any) => ({
      id: emp.user_id,
      email: '', // Will be populated by server-side API
      role: 'employee' as 'superadmin' | 'unit_manager' | 'employee', // Will be populated by server-side API
      employee_id: emp.id,
      is_active: emp.is_active,
      created_at: emp.created_at,
      updated_at: emp.updated_at,
      pegawai: {
        id: emp.id,
        employee_code: emp.employee_code,
        full_name: emp.full_name,
        unit_id: emp.unit_id,
        tax_status: emp.tax_status,
        is_active: emp.is_active,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
        m_units: Array.isArray(emp.m_units) && emp.m_units.length > 0
          ? emp.m_units[0]
          : undefined
      }
    }))
    
    return { data: transformedData, count: count || 0 }
  } catch (err: any) {
    console.error('Error in getUsers:', err)
    return { data: [], count: 0, error: err.message }
  }
}

/**
 * Create a new user with auth.users and t_user records
 * NOTE: This function is deprecated. Use the /api/users/create endpoint instead.
 */
export async function createUser(
  input: CreateUserData & { password: string }
): Promise<{ success: boolean; user?: User; error?: string; password?: string }> {
  // This function should not be called directly from client
  // Use the API route instead to avoid 403 errors
  return { success: false, error: 'Use /api/users/create endpoint instead' }
}

/**
 * Update user data
 * NOTE: This function is deprecated. Use the /api/users/update endpoint instead.
 */
export async function updateUser(
  id: string,
  updates: UpdateUserData
): Promise<{ success: boolean; error?: string }> {
  // This function should not be called directly from client
  // Use the API route instead to avoid 403 errors
  return { success: false, error: 'Use /api/users/update endpoint instead' }
}

/**
 * Deactivate a user
 * Now updates m_employees table
 */
export async function deactivateUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Update m_employees record (id here is user_id from auth.users)
    const { error: employeeError } = await supabase
      .from('m_employees')
      .update({ is_active: false })
      .eq('user_id', id)
    
    if (employeeError) {
      return { success: false, error: employeeError.message }
    }
    
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Delete a user (soft delete by deactivating)
 */
export async function deleteUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return deactivateUser(id)
}
