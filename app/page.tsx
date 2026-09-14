import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      redirect('/login')
    }
    
    // All authenticated users go to /dashboard
    // Dashboard will show role-specific content
    redirect('/dashboard')
  } catch (error) {
    redirect('/login')
  }
}
