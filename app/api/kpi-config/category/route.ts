import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/supabase/auth-helper'

/**
 * POST /api/kpi-config/category
 * Create or update a KPI category. Uses admin client to bypass RLS.
 */
export async function POST(request: NextRequest) {
    try {
        const supabaseClient = await createClient()
        const user = await getAuthenticatedUser(supabaseClient, request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { categoryId, data } = await request.json()

        if (!data || (!data.unit_id && !categoryId)) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
        }

        const supabase = await createAdminClient()

        if (categoryId) {
            // Update existing category
            const { data: updated, error } = await supabase
                .from('m_kpi_categories')
                .update(data)
                .eq('id', categoryId)
                .select()
                .single()

            if (error) {
                console.error('Error updating category:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, category: updated })
        } else {
            // Create new category
            const { data: created, error } = await supabase
                .from('m_kpi_categories')
                .insert(data)
                .select()
                .single()

            if (error) {
                console.error('Error creating category:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, category: created })
        }
    } catch (error: any) {
        console.error('Category API error:', error)
        return NextResponse.json(
            { error: error?.message || 'Gagal menyimpan kategori' },
            { status: 500 }
        )
    }
}
