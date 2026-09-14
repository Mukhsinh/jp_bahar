import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, exportAuditLogs } from '@/lib/services/audit.service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const export_format = searchParams.get('export')

    const filters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      user: searchParams.get('user') || undefined,
      table: searchParams.get('table') || undefined,
      operation: searchParams.get('operation') || undefined,
    }

    if (export_format) {
      const { data, error } = await exportAuditLogs(filters, supabase)

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    const { data, count, error } = await getAuditLogs(filters, page, pageSize, supabase)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data, count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
