import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/supabase/auth-helper'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const supabaseClient = await createClient()
        const user = await getAuthenticatedUser(supabaseClient, request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const params = await props.params
        const unitId = params?.id

        if (!unitId) {
            return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 })
        }

        const adminSupabase = await createAdminClient()
        const { data: unit, error } = await adminSupabase
            .from('m_units')
            .select('*')
            .eq('id', unitId)
            .maybeSingle()

        if (error || !unit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            unit
        })
    } catch (error: any) {
        console.error('Fetch unit error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
