import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/supabase/auth-helper'

/**
 * POST /api/kpi-config/copy-structure
 * Copy BPJS KPI structure to UMUM for a given unit.
 * Uses admin client to bypass RLS.
 */
export async function POST(request: NextRequest) {
    try {
        const supabaseClient = await createClient()
        const user = await getAuthenticatedUser(supabaseClient, request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { unitId } = await request.json()

        if (!unitId) {
            return NextResponse.json({ error: 'Unit belum dipilih' }, { status: 400 })
        }

        const supabase = await createAdminClient()

        // 1. Get BPJS categories for this unit (revenue_type 'bpjs' or 'all')
        const { data: bpjsCategories, error: catError } = await supabase
            .from('m_kpi_categories')
            .select('*')
            .eq('unit_id', unitId)
            .in('revenue_type', ['bpjs', 'all'])

        if (catError) {
            console.error('Error fetching BPJS categories:', catError)
            return NextResponse.json({ error: catError.message || 'Gagal mengambil kategori BPJS' }, { status: 500 })
        }

        if (!bpjsCategories || bpjsCategories.length === 0) {
            return NextResponse.json({ error: 'Unit ini belum memiliki struktur KPI BPJS Kesehatan untuk disalin.' }, { status: 400 })
        }

        // 2. Remove any existing 'umum' categories (and their indicators/sub-indicators)
        const { data: existingUmumCats, error: fetchUmumErr } = await supabase
            .from('m_kpi_categories')
            .select('id')
            .eq('unit_id', unitId)
            .eq('revenue_type', 'umum')

        if (fetchUmumErr) {
            console.error('Error fetching existing UMUM categories:', fetchUmumErr)
            return NextResponse.json({ error: fetchUmumErr.message }, { status: 500 })
        }

        if (existingUmumCats && existingUmumCats.length > 0) {
            const umumCatIds = existingUmumCats.map(c => c.id)

            // 2a. Fetch indicators under existing UMUM categories
            const { data: existingUmumInds, error: fetchIndsErr } = await supabase
                .from('m_kpi_indicators')
                .select('id')
                .in('category_id', umumCatIds)

            if (fetchIndsErr) {
                console.error('Error fetching existing UMUM indicators:', fetchIndsErr)
                return NextResponse.json({ error: fetchIndsErr.message }, { status: 500 })
            }

            if (existingUmumInds && existingUmumInds.length > 0) {
                const umumIndIds = existingUmumInds.map(i => i.id)

                // 2b. Delete sub-indicators first
                const { error: delSubErr } = await supabase
                    .from('m_kpi_sub_indicators')
                    .delete()
                    .in('indicator_id', umumIndIds)
                if (delSubErr) {
                    console.error('Error deleting UMUM sub-indicators:', delSubErr)
                    return NextResponse.json({ error: delSubErr.message }, { status: 500 })
                }

                // 2c. Delete indicators second
                const { error: delIndErr } = await supabase
                    .from('m_kpi_indicators')
                    .delete()
                    .in('id', umumIndIds)
                if (delIndErr) {
                    console.error('Error deleting UMUM indicators:', delIndErr)
                    return NextResponse.json({ error: delIndErr.message }, { status: 500 })
                }
            }

            // 2d. Delete categories third
            const { error: delCatErr } = await supabase
                .from('m_kpi_categories')
                .delete()
                .in('id', umumCatIds)
            if (delCatErr) {
                console.error('Error deleting UMUM categories:', delCatErr)
                return NextResponse.json({ error: delCatErr.message }, { status: 500 })
            }
        }

        // 3. Copy categories with revenue_type = 'umum'
        const categoryMapping: Record<string, string> = {}

        for (const category of bpjsCategories) {
            const { data: newCat, error: insertCatError } = await supabase
                .from('m_kpi_categories')
                .insert({
                    unit_id: unitId,
                    category: category.category,
                    category_name: category.category_name,
                    weight_percentage: category.weight_percentage,
                    description: category.description,
                    configuration_style: category.configuration_style,
                    is_weighted: category.is_weighted,
                    is_active: category.is_active,
                    revenue_type: 'umum'
                })
                .select()
                .single()

            if (insertCatError) {
                console.error('Error inserting UMUM category:', insertCatError)
                return NextResponse.json({ error: insertCatError.message }, { status: 500 })
            }
            categoryMapping[category.id] = newCat.id
        }

        // 4. Get BPJS indicators
        const bpjsCategoryIds = bpjsCategories.map(c => c.id)
        const { data: bpjsIndicators, error: indError } = await supabase
            .from('m_kpi_indicators')
            .select('*')
            .in('category_id', bpjsCategoryIds)

        if (indError) {
            console.error('Error fetching BPJS indicators:', indError)
            return NextResponse.json({ error: indError.message }, { status: 500 })
        }

        const indicatorMapping: Record<string, string> = {}

        if (bpjsIndicators && bpjsIndicators.length > 0) {
            for (const indicator of bpjsIndicators) {
                const targetCatId = categoryMapping[indicator.category_id]
                if (!targetCatId) continue

                const { data: newInd, error: insertIndError } = await supabase
                    .from('m_kpi_indicators')
                    .insert({
                        category_id: targetCatId,
                        code: indicator.code,
                        name: indicator.name,
                        target_value: indicator.target_value,
                        weight_percentage: indicator.weight_percentage,
                        measurement_unit: indicator.measurement_unit,
                        description: indicator.description,
                        calculation_method: indicator.calculation_method || 'indexing',
                        base_index_value: indicator.base_index_value || indicator.basic_index_value || 0,
                        is_active: indicator.is_active ?? true,
                        measurement_type: indicator.measurement_type || 'scoring',
                        unit_tariff: indicator.unit_tariff || 0,
                        basic_index_value: indicator.basic_index_value || indicator.base_index_value || 0,
                        service_types: indicator.service_types || []
                    })
                    .select()
                    .single()

                if (insertIndError) {
                    console.error('Error inserting UMUM indicator:', insertIndError)
                    return NextResponse.json({ error: insertIndError.message }, { status: 500 })
                }
                indicatorMapping[indicator.id] = newInd.id
            }

            // 5. Get BPJS sub-indicators
            const bpjsIndicatorIds = bpjsIndicators.map(i => i.id)
            const { data: bpjsSubIndicators, error: fetchSubErr } = await supabase
                .from('m_kpi_sub_indicators')
                .select('*')
                .in('indicator_id', bpjsIndicatorIds)

            if (fetchSubErr) {
                console.error('Error fetching BPJS sub-indicators:', fetchSubErr)
                return NextResponse.json({ error: fetchSubErr.message }, { status: 500 })
            }

            if (bpjsSubIndicators && bpjsSubIndicators.length > 0) {
                const subToInsert = bpjsSubIndicators
                    .filter(sub => indicatorMapping[sub.indicator_id])
                    .map(sub => ({
                        indicator_id: indicatorMapping[sub.indicator_id],
                        code: sub.code,
                        name: sub.name,
                        target_value: sub.target_value,
                        weight_percentage: sub.weight_percentage,
                        scoring_criteria: sub.scoring_criteria,
                        measurement_unit: sub.measurement_unit,
                        description: sub.description,
                        is_active: sub.is_active ?? true,
                        measurement_type: sub.measurement_type || 'scoring',
                        unit_tariff: sub.unit_tariff || 0,
                        base_index_value: sub.base_index_value || 0,
                        service_types: sub.service_types || []
                    }))

                if (subToInsert.length > 0) {
                    const { error: insertSubError } = await supabase
                        .from('m_kpi_sub_indicators')
                        .insert(subToInsert)

                    if (insertSubError) {
                        console.error('Error inserting UMUM sub-indicators:', insertSubError)
                        return NextResponse.json({ error: insertSubError.message }, { status: 500 })
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Struktur KPI dari BPJS Kesehatan berhasil disalin ke Pendapatan Umum!',
            categories_copied: Object.keys(categoryMapping).length,
            indicators_copied: Object.keys(indicatorMapping).length
        })
    } catch (error: any) {
        console.error('Copy structure error:', error)
        return NextResponse.json(
            { error: error?.message || 'Gagal menyalin struktur KPI' },
            { status: 500 }
        )
    }
}
