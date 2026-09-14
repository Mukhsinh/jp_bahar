import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create admin client directly without cookies (for API routes)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data, error } = await supabase
      .from('t_settings')
      .select('key, value')
    
    if (error) {
      console.error('Settings API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Transform to object format
    const settings: any = {}
    data?.forEach((item) => {
      settings[item.key] = item.value
    })
    
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Settings API exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
