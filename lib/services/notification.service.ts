import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'pool_approval' | 'calculation_complete' | 'password_reset' | 'new_user' | 'general'
  read: boolean
  link?: string
  created_at: string
  read_at?: string
}

// Helper to get supabase client, works on both client and server
function getSupabaseClient(supabaseClient?: any) {
  if (supabaseClient) return supabaseClient
  // Fallback to browser client (only works on client side)
  return createClient()
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  link?: string,
  supabaseClient?: any
) {
  const supabase = getSupabaseClient(supabaseClient)

  const { data, error } = await supabase
    .from('t_notification')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      link,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create notification:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getNotifications(employeeId: string, supabaseClient?: any) {
  const supabase = getSupabaseClient(supabaseClient)

  const { data, error } = await supabase
    .from('t_notification')
    .select('*')
    .eq('user_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch notifications:', error)
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

export async function getUnreadCount(userId: string, supabaseClient?: any) {
  try {
    const supabase = getSupabaseClient(supabaseClient)

    // userId is already auth.user.id, use it directly
    const { count, error } = await supabase
      .from('t_notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Failed to fetch unread count:', error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error: any) {
    console.error('Exception in getUnreadCount:', error)
    return { count: 0, error: error.message }
  }
}

export async function markAsRead(notificationId: string, supabaseClient?: any) {
  const supabase = getSupabaseClient(supabaseClient)

  const { error } = await supabase
    .from('t_notification')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    console.error('Failed to mark notification as read:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function markAllAsRead(userId: string, supabaseClient?: any) {
  const supabase = getSupabaseClient(supabaseClient)

  const { error } = await supabase
    .from('t_notification')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Failed to mark all notifications as read:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// Notification triggers
export async function notifyPoolApproval(period: string, supabaseClient?: any) {
  const supabase = getSupabaseClient(supabaseClient)

  // Get all auth users with unit_manager role from metadata
  // Note: This requires service role key to access auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError || !authData) {
    console.error('Failed to fetch auth users:', authError)
    return
  }

  // Filter users with unit_manager role
  const managerAuthIds = authData.users
    .filter((user: any) => user.user_metadata?.role === 'unit_manager')
    .map((user: any) => user.id)

  if (managerAuthIds.length === 0) return

  // Get employee IDs for these auth users
  const { data: managers } = await supabase
    .from('m_employees')
    .select('id')
    .in('user_id', managerAuthIds)

  if (managers) {
    for (const manager of managers) {
      await createNotification(
        manager.id,
        'Pool Approved',
        `Pool for period ${period} has been approved.`,
        'pool_approval',
        '/admin/pool',
        supabase
      )
    }
  }
}

export async function notifyCalculationComplete(period: string, employeeIds: string[], supabaseClient?: any) {
  for (const employeeId of employeeIds) {
    await createNotification(
      employeeId,
      'Calculation Complete',
      `Calculation for period ${period} is complete. View your incentive details.`,
      'calculation_complete',
      '/employee/dashboard',
      supabaseClient
    )
  }
}

export async function notifyPasswordReset(userId: string, supabaseClient?: any) {
  await createNotification(
    userId,
    'Password Reset',
    'Your password has been successfully reset.',
    'password_reset',
    undefined,
    supabaseClient
  )
}

export async function notifyNewUser(userId: string, temporaryPassword: string, supabaseClient?: any) {
  await createNotification(
    userId,
    'Welcome to JASPEL',
    `Your account has been created. Your temporary password is: ${temporaryPassword}. Please change it after your first login.`,
    'new_user',
    '/profile',
    supabaseClient
  )
}
