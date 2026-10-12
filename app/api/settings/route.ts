import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Expires': '0',
  }

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // Create admin client directly without cookies (for API routes)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
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
      return NextResponse.json({ error: error.message }, { status: 500, headers: noCacheHeaders })
    }

    // Transform to object format
    const settings: any = {}
    data?.forEach((item) => {
      settings[item.key] = item.value
    })

    return NextResponse.json(settings, { headers: noCacheHeaders })
  } catch (error: any) {
    console.error('Settings API exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: noCacheHeaders })
  }
}
