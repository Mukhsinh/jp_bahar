import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Paginated fetch to bypass Supabase's default 1000-row limit.
 * Fetches all rows by iterating through pages.
 */
async function fetchAllRows(client: any, table: string, selectFields: string, filters: (q: any) => any, pageSize: number = 1000): Promise<any[]> {
  const allRows: any[] = []
  let page = 0
  while (true) {
    const from = page * pageSize
    const to = from + pageSize - 1
    let query = client.from(table).select(selectFields).range(from, to)
    query = filters(query)
    const { data, error } = await query
    if (error) {
      console.error(`[fetchAllRows] Error fetching ${table} page ${page}:`, error)
      break
    }
    if (data && data.length > 0) {
      allRows.push(...data)
      if (data.length < pageSize) break
      page++
    } else {
      break
    }
  }
  return allRows
}

interface AssessmentStatus {
  employee_id: string
  full_name: string
  unit_id: string
  unit_name: string
  period: string
  total_indicators: number
  assessed_indicators: number
  status: string
  completion_percentage: number
  role?: string
}

import { getAuthenticatedUser } from '@/lib/supabase/auth-helper'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const user = await getAuthenticatedUser(supabase, request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to bypass RLS for employee lookup
    const adminClient = await createAdminClient()

    // Try by user_id first
    let currentEmployee: any = null
    const { data: byUserId } = await adminClient
      .from('m_employees')
      .select('id, role, unit_id, full_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (byUserId) {
      currentEmployee = byUserId
    } else {
      const appRole = user.app_metadata?.role
      const userRole = user.user_metadata?.role
      const email = user.email

      const isSuperAdmin =
        appRole === 'superadmin' ||
        userRole === 'superadmin' ||
        email === 'admin@sungaibahar.com'

      if (isSuperAdmin) {
        currentEmployee = {
          id: user.id,
          full_name: 'Super Administrator',
          role: 'superadmin',
          unit_id: '0'
        }
      } else {
        console.error('No employee record linked to user id:', user.id)
        return NextResponse.json({ error: 'Employee record not found. Please contact admin to link your account.' }, { status: 404 })
      }
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const status = searchParams.get('status')
    const requestedUnitId = searchParams.get('unit_id')

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 })
    }

    // STUCT UNIT ISOLATION & FILTERING
    const userRole = currentEmployee.role
    const userUnitId = currentEmployee.unit_id

    const revenueType = searchParams.get('revenue_type') || 'bpjs'
    let employeesData: AssessmentStatus[] = []
    const effectiveUnitFilter =
      userRole === 'unit_manager' && userUnitId
        ? userUnitId
        : userRole === 'superadmin' && requestedUnitId && requestedUnitId !== 'all'
          ? requestedUnitId
          : null

    let empQuery = adminClient
      .from('m_employees')
      .select(`
          id,
          full_name,
          unit_id,
          role,
          m_units!inner (
            name,
            code
          )
        `)
      .eq('is_active', true)
      .neq('role', 'superadmin')

    if (effectiveUnitFilter) {
      empQuery = empQuery.eq('unit_id', effectiveUnitFilter)
    }

    let catQuery = adminClient
      .from('m_kpi_categories')
      .select('id, unit_id, revenue_type')
      .eq('is_active', true)

    if (effectiveUnitFilter) {
      catQuery = catQuery.eq('unit_id', effectiveUnitFilter)
    }

    // Run independent metadata queries in parallel instead of 4 sequential round-trips
    const [
      { data: unitsData },
      { data: rawDirectEmps, error: directErr },
      { data: categoriesData },
    ] = await Promise.all([
      adminClient.from('m_units').select('id, code, name, kpi_schema_mode'),
      empQuery.order('full_name'),
      catQuery,
    ])

    const adminUnitIds = new Set(
      (unitsData || [])
        .filter((u: any) => u.code?.toUpperCase() === 'ADMIN' || u.name?.toUpperCase() === 'SUPERADMIN')
        .map((u: any) => u.id)
    )

    const directEmps = (rawDirectEmps || []).filter((emp: any) => {
      if (adminUnitIds.has(emp.unit_id)) return false
      const unitObj = Array.isArray(emp.m_units) ? emp.m_units[0] : emp.m_units
      if (unitObj?.code?.toUpperCase() === 'ADMIN' || unitObj?.name?.toUpperCase() === 'SUPERADMIN') return false
      return true
    })

    if (!directErr && directEmps.length > 0) {
      const unitSchemaMap = new Map((unitsData || []).map((u: any) => [u.id, u.kpi_schema_mode]))

      // Filter categories according to the schema logic matching the assessment form
      const validCategories = (categoriesData || []).filter(c => {
        const schemaMode = unitSchemaMap.get(c.unit_id)
        if (schemaMode === 'different') {
          return c.revenue_type === revenueType || c.revenue_type === 'all' || !c.revenue_type
        }
        return c.revenue_type === 'bpjs' || c.revenue_type === 'all' || !c.revenue_type
      })
      const validCategoryIds = validCategories.map(c => c.id)
      const catToUnitMap = new Map(validCategories.map(c => [c.id, c.unit_id]))

      let requiredIndicatorCountMap: Record<string, number> = {}
      let priorityIndicatorIds = new Set<string>()
      let allIndicatorCountMap: Record<string, number> = {}

      // Scope assessment query to unit employees when filtered (avoids scanning entire hospital)
      const directEmpIds = directEmps.map((e: any) => e.id)
      const scopeByEmpIds = Boolean(effectiveUnitFilter && directEmpIds.length > 0 && directEmpIds.length <= 200)

      // Run indicators query and existing assessments query in parallel
      const [validIndicatorsRes, existingAssessments] = await Promise.all([
        validCategoryIds.length > 0
          ? adminClient
              .from('m_kpi_indicators')
              .select('id, category_id, calculation_method')
              .eq('is_active', true)
              .in('category_id', validCategoryIds)
          : Promise.resolve({ data: [] as any[] }),
        fetchAllRows(
          adminClient,
          't_kpi_assessments',
          'employee_id, indicator_id',
          (q: any) => {
            let qry = q.eq('period', period).or(`revenue_type.eq.${revenueType},revenue_type.is.null`)
            if (scopeByEmpIds) qry = qry.in('employee_id', directEmpIds)
            return qry
          }
        ),
      ])

      validIndicatorsRes.data?.forEach((ind: any) => {
        const uId = catToUnitMap.get(ind.category_id) as string
        if (uId) {
          allIndicatorCountMap[uId] = (allIndicatorCountMap[uId] || 0) + 1
          if (ind.calculation_method === 'priority') {
            priorityIndicatorIds.add(ind.id)
          } else {
            requiredIndicatorCountMap[uId] = (requiredIndicatorCountMap[uId] || 0) + 1
          }
        }
      })

      const assessedCountMap: Record<string, Set<string>> = {}
      existingAssessments?.forEach((ass: any) => {
        if (!assessedCountMap[ass.employee_id]) {
          assessedCountMap[ass.employee_id] = new Set()
        }
        assessedCountMap[ass.employee_id].add(ass.indicator_id)
      })

      // BPJS fallback for same-schema units when viewing UMUM:
      // If an employee in a 'same' schema unit has no UMUM assessments, use BPJS data
      if (revenueType === 'umum') {
        const empsMissingUmum = directEmps
          .filter((emp: any) => {
            const schemaMode = unitSchemaMap.get(emp.unit_id)
            return schemaMode !== 'different' && !assessedCountMap[emp.id]
          })
          .map((emp: any) => emp.id)

        if (empsMissingUmum.length > 0) {
          const bpjsFallback = await fetchAllRows(
            adminClient,
            't_kpi_assessments',
            'employee_id, indicator_id',
            (q: any) => q.eq('period', period).eq('revenue_type', 'bpjs').in('employee_id', empsMissingUmum)
          )
          bpjsFallback?.forEach((ass: any) => {
            if (!assessedCountMap[ass.employee_id]) {
              assessedCountMap[ass.employee_id] = new Set()
            }
            assessedCountMap[ass.employee_id].add(ass.indicator_id)
          })
        }
      }

      employeesData = directEmps.map((emp: any) => {
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

        const totalAssessed = assessedReq + assessedPrio

        // Priority indicators are elective / optional:
        // An employee is considered 'Selesai' when all required indicators are assessed,
        // regardless of whether priority indicators were chosen or not.
        const isCompleted = reqTotal > 0 ? (assessedReq >= reqTotal) : (assessedPrio > 0)

        const totalInd = reqTotal > 0 ? (reqTotal + assessedPrio) : (allIndicatorCountMap[emp.unit_id] || 0)
        const assessedInd = totalAssessed

        let empStatus = 'Belum Dinilai'
        let completionPct = 0

        if (totalAssessed > 0) {
          if (isCompleted) {
            empStatus = 'Selesai'
            completionPct = 100
          } else {
            empStatus = 'Sebagian'
            completionPct = reqTotal > 0 ? Math.min(99, Math.round((assessedReq / reqTotal) * 100)) : 50
          }
        }

        return {
          employee_id: emp.id,
          full_name: emp.full_name,
          unit_id: emp.unit_id,
          unit_name: (emp.m_units as any)?.name || '-',
          period: period,
          total_indicators: totalInd,
          assessed_indicators: assessedInd,
          status: empStatus,
          completion_percentage: completionPct,
          role: emp.role
        }
      })

      if (status && ['Belum Dinilai', 'Sebagian', 'Selesai'].includes(status)) {
        employeesData = employeesData.filter(e => e.status === status)
      }
    }

    const filteredResults = employeesData.filter((emp: any) => {
      if (emp.role === 'superadmin') return false
      if (adminUnitIds.has(emp.unit_id)) return false
      if (emp.unit_name?.toUpperCase() === 'SUPERADMIN') return false
      if (userRole === 'unit_manager' && emp.unit_id !== userUnitId) {
        return false
      }
      return true
    })

    const completedCount = filteredResults.filter(s => s.status === 'Selesai').length
    const summary = {
      total_employees: filteredResults.length,
      completed: completedCount,
      started: filteredResults.filter(s => s.assessed_indicators > 0).length,
      partial: filteredResults.filter(s => s.status === 'Sebagian').length,
      not_started: filteredResults.filter(s => s.assessed_indicators === 0).length,
      completion_rate: filteredResults.length > 0
        ? Math.round((completedCount / filteredResults.length) * 100)
        : 0,
    }

    return NextResponse.json({ employees: filteredResults, summary })
  } catch (error) {
    console.error('Assessment employees GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees for assessment' },
      { status: 500 }
    )
  }
}