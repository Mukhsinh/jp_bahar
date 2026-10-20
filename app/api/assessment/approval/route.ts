import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/supabase/auth-helper'

export const dynamic = 'force-dynamic'

/**
 * Helper to get the approval setting key
 */
function getApprovalKey(period: string, revenueType: string = 'bpjs') {
  return `assessment_approval_${period}_${revenueType}`
}

/**
 * GET /api/assessment/approval?period=YYYY-MM&revenue_type=bpjs|umum
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getAuthenticatedUser(supabase, request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const revenueType = searchParams.get('revenue_type') || 'bpjs'

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 })
    }

    const adminClient = await createAdminClient()
    const key = getApprovalKey(period, revenueType)

    const { data: settingData, error } = await adminClient
      .from('t_settings')
      .select('value, updated_at')
      .eq('key', key)
      .maybeSingle()

    if (error) {
      console.error('Error fetching approval status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const approval = settingData?.value as any
    const isApproved = approval?.status === 'approved'

    return NextResponse.json({
      success: true,
      isApproved,
      approval: isApproved ? approval : null
    })
  } catch (error: any) {
    console.error('Approval GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approval status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/assessment/approval
 * Body: { period, revenue_type, action: 'approve' | 'unapprove', notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getAuthenticatedUser(supabase, request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    // Find current user's employee record
    let currentEmployee: any = null
    const { data: byUserId } = await adminClient
      .from('m_employees')
      .select('id, role, full_name, unit_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (byUserId) {
      currentEmployee = byUserId
    } else if (user.email) {
      const { data: byEmail } = await adminClient
        .from('m_employees')
        .select('id, role, full_name, unit_id')
        .eq('email', user.email)
        .maybeSingle()
      if (byEmail) currentEmployee = byEmail
    }

    const appRole = user.app_metadata?.role
    const userRole = user.user_metadata?.role
    const isSuperAdmin =
      currentEmployee?.role === 'superadmin' ||
      appRole === 'superadmin' ||
      userRole === 'superadmin' ||
      user.email === 'admin@sungaibahar.com'

    if (!isSuperAdmin && currentEmployee?.role !== 'unit_manager') {
      return NextResponse.json(
        { error: 'Hanya Administrator atau Manajer Unit yang dapat melakukan persetujuan penilaian' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { period, revenue_type = 'bpjs', action = 'approve', notes = '' } = body

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 })
    }

    const key = getApprovalKey(period, revenue_type)

    if (action === 'approve') {
      // 1. Verify that all active employees are indeed 100% assessed
      // Fetch active employees (excluding superadmin & SUPERADMIN unit)
      const { data: adminUnit } = await adminClient
        .from('m_units')
        .select('id')
        .or('code.ilike.ADMIN,name.ilike.SUPERADMIN')
        .maybeSingle()

      let empQuery = adminClient
        .from('m_employees')
        .select('id, unit_id')
        .eq('is_active', true)
        .neq('role', 'superadmin')

      if (adminUnit?.id) {
        empQuery = empQuery.neq('unit_id', adminUnit.id)
      }

      const { data: emps } = await empQuery
      const totalEmployees = emps?.length || 0

      if (totalEmployees === 0) {
        return NextResponse.json(
          { error: 'Tidak ada pegawai aktif untuk dinilai pada periode ini' },
          { status: 400 }
        )
      }

      // Check assessments count
      const { data: unitData } = await adminClient.from('m_units').select('id, kpi_schema_mode')
      const unitSchemaMap = new Map((unitData || []).map((u: any) => [u.id, u.kpi_schema_mode]))

      const { data: categoriesData } = await adminClient
        .from('m_kpi_categories')
        .select('id, unit_id, revenue_type')
        .eq('is_active', true)

      const validCategories = (categoriesData || []).filter((c: any) => {
        const schemaMode = unitSchemaMap.get(c.unit_id)
        if (schemaMode === 'different') {
          return c.revenue_type === revenue_type || c.revenue_type === 'all' || !c.revenue_type
        }
        return c.revenue_type === 'bpjs' || c.revenue_type === 'all' || !c.revenue_type
      })
      const validCategoryIds = validCategories.map((c: any) => c.id)
      const catToUnitMap = new Map(validCategories.map((c: any) => [c.id, c.unit_id]))

      let requiredIndicatorCountMap: Record<string, number> = {}
      let priorityIndicatorIds = new Set<string>()

      if (validCategoryIds.length > 0) {
        const { data: indicators } = await adminClient
          .from('m_kpi_indicators')
          .select('id, category_id, calculation_method')
          .eq('is_active', true)
          .in('category_id', validCategoryIds)

        indicators?.forEach((ind: any) => {
          const uId = catToUnitMap.get(ind.category_id) as string
          if (uId) {
            if (ind.calculation_method === 'priority') {
              priorityIndicatorIds.add(ind.id)
            } else {
              requiredIndicatorCountMap[uId] = (requiredIndicatorCountMap[uId] || 0) + 1
            }
          }
        })
      }

      // Fetch distinct assessments
      const { data: assessments } = await adminClient
        .from('t_kpi_assessments')
        .select('employee_id, indicator_id')
        .eq('period', period)
        .or(`revenue_type.eq.${revenue_type},revenue_type.is.null`)

      const assessedCountMap: Record<string, Set<string>> = {}
      assessments?.forEach((ass: any) => {
        if (!assessedCountMap[ass.employee_id]) {
          assessedCountMap[ass.employee_id] = new Set()
        }
        assessedCountMap[ass.employee_id].add(ass.indicator_id)
      })

      let completedCount = 0
      emps?.forEach((emp: any) => {
        const reqTotal = requiredIndicatorCountMap[emp.unit_id] || 0
        const allAssessed = assessedCountMap[emp.id] || new Set()

        let assessedReq = 0
        let assessedPrio = 0
        allAssessed.forEach((indId: string) => {
          if (priorityIndicatorIds.has(indId)) {
            assessedPrio++
          } else {
            assessedReq++
          }
        })

        // Priority indicators are elective / optional:
        // Completed when all required indicators are assessed
        const isCompleted = reqTotal > 0 ? (assessedReq >= reqTotal) : (assessedPrio > 0)
        if (isCompleted) {
          completedCount++
        }
      })

      const completionRate = totalEmployees > 0 ? Math.round((completedCount / totalEmployees) * 100) : 0

      // Only allow approval if completionRate is 100%
      if (completionRate < 100) {
        return NextResponse.json(
          {
            error: `Persetujuan ditolak: Penilaian baru mencapai ${completionRate}% (${completedCount}/${totalEmployees} pegawai selesai). Seluruh pegawai harus dinilai 100% sebelum disetujui.`
          },
          { status: 400 }
        )
      }

      const approverName = currentEmployee?.full_name || user.email || 'Administrator'
      const approvalPayload = {
        period,
        revenue_type,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by_id: currentEmployee?.id || user.id,
        approved_by_name: approverName,
        notes: notes || 'Persetujuan Penilaian KPI Periode Lengkap',
        summary: {
          total_employees: totalEmployees,
          completed: completedCount,
          completion_rate: 100
        }
      }

      const { error: saveError } = await adminClient
        .from('t_settings')
        .upsert(
          {
            key,
            value: approvalPayload,
            description: `Status Persetujuan Penilaian KPI ${period} (${revenue_type.toUpperCase()})`,
            updated_at: new Date().toISOString(),
            updated_by: currentEmployee?.id || null
          },
          { onConflict: 'key' }
        )

      if (saveError) {
        console.error('Error saving approval:', saveError)
        return NextResponse.json({ error: saveError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Periode penilaian ${period} (${revenue_type.toUpperCase()}) berhasil disetujui dan dikunci.`,
        approval: approvalPayload
      })
    } else if (action === 'unapprove') {
      // Unapprove / Cancel approval
      const approvalPayload = {
        period,
        revenue_type,
        status: 'draft',
        unapproved_at: new Date().toISOString(),
        unapproved_by_id: currentEmployee?.id || user.id,
        unapproved_by_name: currentEmployee?.full_name || user.email || 'Administrator',
        notes: notes || 'Pembatalan persetujuan penilaian'
      }

      const { error: unapproveError } = await adminClient
        .from('t_settings')
        .upsert(
          {
            key,
            value: approvalPayload,
            description: `Status Persetujuan Penilaian KPI ${period} (${revenue_type.toUpperCase()})`,
            updated_at: new Date().toISOString(),
            updated_by: currentEmployee?.id || null
          },
          { onConflict: 'key' }
        )

      if (unapproveError) {
        console.error('Error unapproving:', unapproveError)
        return NextResponse.json({ error: unapproveError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Persetujuan periode penilaian ${period} (${revenue_type.toUpperCase()}) telah dibatalkan. Penilaian kini dapat diedit kembali.`,
        approval: approvalPayload
      })
    } else {
      return NextResponse.json({ error: `Aksi tidak dikenal: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Approval POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem saat memproses persetujuan' },
      { status: 500 }
    )
  }
}
