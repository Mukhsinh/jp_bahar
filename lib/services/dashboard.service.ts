import { createAdminClient } from '@/lib/supabase/server'
import { Role } from './rbac.service'
import { SupabaseClient } from '@supabase/supabase-js'

export interface DashboardStats {
  totalEmployees: number
  totalUnits: number
  avgScore: number
  completionRate: number
  trends: {
    employees: number
    score: number
    completion: number
  }
}

export interface EmployeeStats {
  score: number;
  rank: number;
  completionStatus: string;
  unitRank: string;
}

export interface TopPerformer {
  id: string
  name: string
  unit: string
  score: number
  rank: number
  avatar?: string
}

export interface UnitPerformance {
  id: string
  name: string
  avgScore: number
  completionRate: number
  employeeCount: number
}

export interface PerformanceTrend {
  month: string
  p1: number
  p2: number
  p3: number
  total: number
}

export interface KPIDistribution {
  name: string
  value: number
  color: string
}

export class DashboardService {
  /**
   * Helper to sanitize KPI total score if priority rupiah was legacy-stored into index score
   */
  private static sanitizeScore(row: any): { p1: number; p2: number; p3: number; total: number } {
    let p1 = Number(row?.p1_score || 0)
    let p2 = Number(row?.p2_score || 0)
    let p3 = Number(row?.p3_score || 0)
    let tot = Number(row?.individual_total_score || 0)

    if (p2 > 10000) p2 = 0
    if (tot > 10000) tot = p1 + p2 + p3

    return { p1, p2, p3, total: tot }
  }

  /**
   * Helper to parse and resolve period strings
   */
  private static async getResolvedPeriods(supabase: SupabaseClient, period?: string, year?: string): Promise<string[]> {
    const currentYear = year || new Date().getFullYear().toString()

    if (!period || period === 'month' || period === 'all') {
      const current = new Date()
      const currentPeriod = `${currentYear}-${String(current.getMonth() + 1).padStart(2, '0')}`

      // Check if data exists in t_individual_scores for current period
      const { count: indCount } = await supabase
        .from('t_individual_scores')
        .select('id', { count: 'exact', head: true })
        .eq('period', currentPeriod)

      if (indCount && indCount > 0) return [currentPeriod]

      // Check t_kpi_assessments
      const { count: assCount } = await supabase
        .from('t_kpi_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('period', currentPeriod)

      if (assCount && assCount > 0) return [currentPeriod]

      // Fall back to latest available period in t_individual_scores or t_kpi_assessments
      const { data: latestInd } = await supabase
        .from('t_individual_scores')
        .select('period')
        .like('period', `${currentYear}-%`)
        .order('period', { ascending: false })
        .limit(1)

      if (latestInd && latestInd.length > 0) return [latestInd[0].period]

      const { data: latestAss } = await supabase
        .from('t_kpi_assessments')
        .select('period')
        .like('period', `${currentYear}-%`)
        .order('period', { ascending: false })
        .limit(1)

      if (latestAss && latestAss.length > 0) return [latestAss[0].period]

      return [currentPeriod]
    }

    if (period.startsWith('M-')) {
      const monthPart = period.split('-')[1]
      return [`${currentYear}-${monthPart.padStart(2, '0')}`]
    }

    if (period.startsWith('Q-')) {
      const q = parseInt(period.split('-')[1])
      const startMonth = (q - 1) * 3 + 1
      return [
        `${currentYear}-${String(startMonth).padStart(2, '0')}`,
        `${currentYear}-${String(startMonth + 1).padStart(2, '0')}`,
        `${currentYear}-${String(startMonth + 2).padStart(2, '0')}`
      ]
    }

    if (period.startsWith('S-')) {
      const s = parseInt(period.split('-')[1])
      const startMonth = (s - 1) * 6 + 1
      return Array.from({ length: 6 }, (_, i) =>
        `${currentYear}-${String(startMonth + i).padStart(2, '0')}`
      )
    }

    if (period === 'full-year') {
      return Array.from({ length: 12 }, (_, i) =>
        `${currentYear}-${String(i + 1).padStart(2, '0')}`
      )
    }

    return [period]
  }

  /**
   * Helper to get latest period for trend anchor
   */
  private static async getLatestAvailablePeriod(supabase: SupabaseClient): Promise<string | null> {
    const { data: indData } = await supabase
      .from('t_individual_scores')
      .select('period')
      .order('period', { ascending: false })
      .limit(1)

    if (indData && indData.length > 0) return indData[0].period

    const { data: assData } = await supabase
      .from('t_kpi_assessments')
      .select('period')
      .order('period', { ascending: false })
      .limit(1)

    return assData && assData.length > 0 ? assData[0].period : null
  }

  /**
   * Get dashboard statistics from database tables
   */
  static async getDashboardStats(unitId?: string, period?: string, year?: string): Promise<DashboardStats> {
    const supabase = await createAdminClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      // 1. Get total display employees
      let empQuery = supabase
        .from('m_employees')
        .select('id, unit_id', { count: 'exact' })
        .eq('is_active', true)
        .neq('role', 'superadmin')

      if (unitId && unitId !== 'all') {
        empQuery = empQuery.eq('unit_id', unitId)
      }

      const { data: allEmployees, count: totalDisplayEmployees } = await empQuery
      const empIds = (allEmployees || []).map(e => e.id)

      // 2. Get total units
      const { count: totalUnitsCount } = await supabase
        .from('m_units')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .neq('code', 'ADMIN')

      const totalUnits = (unitId && unitId !== 'all') ? 1 : (totalUnitsCount || 0)

      // 3. Query t_individual_scores for calculation results
      const { data: indScores } = await supabase
        .from('t_individual_scores')
        .select('employee_id, p1_score, p2_score, p3_score, individual_total_score')
        .in('period', resolvedPeriods)
        .in('employee_id', empIds.length > 0 ? empIds : ['00000000-0000-0000-0000-000000000000'])

      if (indScores && indScores.length > 0) {
        const uniqueEmps = new Set(indScores.map(s => s.employee_id))
        const totalAssessed = uniqueEmps.size
        const scores = indScores.map(s => this.sanitizeScore(s).total)
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
        const completionRate = (totalDisplayEmployees || 0) > 0 ? (totalAssessed / (totalDisplayEmployees || 0)) * 100 : 0

        return {
          totalEmployees: totalDisplayEmployees || 0,
          totalUnits,
          avgScore: Math.round(avgScore * 100) / 100,
          completionRate: Math.round(completionRate * 10) / 10,
          trends: { employees: 0, score: 0, completion: 0 }
        }
      }

      // Fallback if t_individual_scores empty for period: check t_kpi_assessments count
      const { data: assRows } = await supabase
        .from('t_kpi_assessments')
        .select('employee_id')
        .in('period', resolvedPeriods)
        .in('employee_id', empIds.length > 0 ? empIds : ['00000000-0000-0000-0000-000000000000'])

      const assessedCount = new Set((assRows || []).map(a => a.employee_id)).size
      const completionRate = (totalDisplayEmployees || 0) > 0 ? (assessedCount / (totalDisplayEmployees || 0)) * 100 : 0

      return {
        totalEmployees: totalDisplayEmployees || 0,
        totalUnits,
        avgScore: 0,
        completionRate: Math.round(completionRate * 10) / 10,
        trends: { employees: 0, score: 0, completion: 0 }
      }
    } catch (error: any) {
      console.error('Error in getDashboardStats:', error?.message || error)
      return { totalEmployees: 0, totalUnits: 0, avgScore: 0, completionRate: 0, trends: { employees: 0, score: 0, completion: 0 } }
    }
  }

  static async getTopPerformers(limit: number = 5, unitId?: string, period?: string, year?: string): Promise<TopPerformer[]> {
    const supabase = await createAdminClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      let query = supabase
        .from('t_individual_scores')
        .select(`
          employee_id,
          p1_score, p2_score, p3_score, individual_total_score,
          employee:m_employees!t_individual_scores_employee_id_fkey!inner (
            id, full_name, is_active, role, unit_id,
            m_units!m_employees_unit_id_fkey ( name )
          )
        `)
        .in('period', resolvedPeriods)
        .eq('employee.is_active', true)
        .neq('employee.role', 'superadmin')

      if (unitId && unitId !== 'all') {
        query = query.eq('employee.unit_id', unitId)
      }

      const { data: scores, error } = await query
      if (error) throw error

      const empScoresMap = new Map<string, { id: string; name: string; unit: string; score: number }>()

      for (const row of (scores || [])) {
        const emp = Array.isArray(row.employee) ? row.employee[0] : row.employee
        if (!emp || !emp.is_active) continue

        const empId = emp.id
        const clean = this.sanitizeScore(row)

        if (!empScoresMap.has(empId) || clean.total > empScoresMap.get(empId)!.score) {
          empScoresMap.set(empId, {
            id: empId,
            name: emp.full_name || 'Unknown',
            unit: emp.m_units?.name || 'Unknown',
            score: clean.total
          })
        }
      }

      return Array.from(empScoresMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((p, i) => ({ ...p, rank: i + 1 }))
    } catch (error: any) {
      console.error('Error in getTopPerformers:', error?.message || error)
      return []
    }
  }

  static async getWorstPerformers(limit: number = 5, unitId?: string, period?: string, year?: string): Promise<TopPerformer[]> {
    const supabase = await createAdminClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      let query = supabase
        .from('t_individual_scores')
        .select(`
          employee_id,
          p1_score, p2_score, p3_score, individual_total_score,
          employee:m_employees!t_individual_scores_employee_id_fkey!inner (
            id, full_name, is_active, role, unit_id,
            m_units!m_employees_unit_id_fkey ( name )
          )
        `)
        .in('period', resolvedPeriods)
        .eq('employee.is_active', true)
        .neq('employee.role', 'superadmin')

      if (unitId && unitId !== 'all') {
        query = query.eq('employee.unit_id', unitId)
      }

      const { data: scores, error } = await query
      if (error) throw error

      const empScoresMap = new Map<string, { id: string; name: string; unit: string; score: number }>()

      for (const row of (scores || [])) {
        const emp = Array.isArray(row.employee) ? row.employee[0] : row.employee
        if (!emp || !emp.is_active) continue

        const empId = emp.id
        const clean = this.sanitizeScore(row)

        if (!empScoresMap.has(empId) || clean.total < empScoresMap.get(empId)!.score) {
          empScoresMap.set(empId, {
            id: empId,
            name: emp.full_name || 'Unknown',
            unit: emp.m_units?.name || 'Unknown',
            score: clean.total
          })
        }
      }

      return Array.from(empScoresMap.values())
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)
        .map((p, i) => ({ ...p, rank: i + 1 }))
    } catch (error: any) {
      console.error('Error in getWorstPerformers:', error?.message || error)
      return []
    }
  }

  static async getUnitPerformance(period?: string, year?: string): Promise<UnitPerformance[]> {
    const supabase = await createAdminClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      // 1. Fetch active units and employee count per unit
      const { data: units } = await supabase
        .from('m_units')
        .select('id, name')
        .eq('is_active', true)
        .neq('code', 'ADMIN')

      if (!units) return []

      const { data: unitEmps } = await supabase
        .from('m_employees')
        .select('unit_id')
        .eq('is_active', true)
        .neq('role', 'superadmin')

      const unitEmpCountMap = new Map<string, number>()
      for (const e of (unitEmps || [])) {
        if (!e.unit_id) continue
        unitEmpCountMap.set(e.unit_id, (unitEmpCountMap.get(e.unit_id) || 0) + 1)
      }

      // 2. Fetch t_individual_scores
      const { data: scores } = await supabase
        .from('t_individual_scores')
        .select(`
          employee_id,
          p1_score, p2_score, p3_score, individual_total_score,
          employee:m_employees!t_individual_scores_employee_id_fkey!inner ( unit_id )
        `)
        .in('period', resolvedPeriods)

      const unitScoresMap = new Map<string, Map<string, number>>()

      for (const row of (scores || [])) {
        const emp = Array.isArray(row.employee) ? row.employee[0] : row.employee
        const unitId = emp?.unit_id
        if (!unitId) continue

        if (!unitScoresMap.has(unitId)) unitScoresMap.set(unitId, new Map())
        const clean = this.sanitizeScore(row)
        unitScoresMap.get(unitId)!.set(row.employee_id, clean.total)
      }

      return units.map(u => {
        const empCount = unitEmpCountMap.get(u.id) || 0
        const empScores = unitScoresMap.get(u.id)
        const assessedCount = empScores ? empScores.size : 0

        let avgScore = 0
        if (empScores && empScores.size > 0) {
          const sum = Array.from(empScores.values()).reduce((a, b) => a + b, 0)
          avgScore = sum / empScores.size
        }

        const completionRate = empCount > 0 ? (assessedCount / empCount) * 100 : 0

        return {
          id: u.id,
          name: u.name,
          avgScore: Math.round(avgScore * 100) / 100,
          completionRate: Math.round(completionRate * 10) / 10,
          employeeCount: empCount
        }
      }).sort((a, b) => b.avgScore - a.avgScore)
    } catch (error: any) {
      console.error('Error in getUnitPerformance:', error?.message || error)
      return []
    }
  }

  static async getPerformanceTrend(months: number = 6, unitId?: string, period?: string, year?: string): Promise<PerformanceTrend[]> {
    const supabase = await createAdminClient()

    try {
      const currentYear = year || new Date().getFullYear().toString()
      let anchorPeriod: string | undefined

      if (period && period.startsWith('M-')) {
        const m = period.split('-')[1]
        anchorPeriod = `${currentYear}-${m.padStart(2, '0')}`
      } else if (period && period.includes('-') && !period.startsWith('Q-') && !period.startsWith('S-')) {
        anchorPeriod = period
      } else {
        const latest = await this.getLatestAvailablePeriod(supabase)
        anchorPeriod = latest || `${currentYear}-08`
      }

      const periods: string[] = []
      const [yStr, mStr] = anchorPeriod.split('-')
      const y = parseInt(yStr) || parseInt(currentYear)
      const m = parseInt(mStr) || 8

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(y, m - 1 - i, 1)
        periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
      }

      // Fetch t_individual_scores for these 6 periods
      let query = supabase
        .from('t_individual_scores')
        .select(`
          period,
          employee_id,
          p1_score, p2_score, p3_score, individual_total_score,
          employee:m_employees!t_individual_scores_employee_id_fkey!inner ( is_active, role, unit_id )
        `)
        .in('period', periods)
        .eq('employee.is_active', true)
        .neq('employee.role', 'superadmin')

      if (unitId && unitId !== 'all') {
        query = query.eq('employee.unit_id', unitId)
      }

      const { data: scores } = await query

      return periods.map(p => {
        const pScores = (scores || []).filter(s => s.period === p)
        if (pScores.length === 0) {
          return { month: p, p1: 0, p2: 0, p3: 0, total: 0 }
        }

        let sumP1 = 0, sumP2 = 0, sumP3 = 0, sumTotal = 0
        for (const row of pScores) {
          const clean = this.sanitizeScore(row)
          sumP1 += clean.p1
          sumP2 += clean.p2
          sumP3 += clean.p3
          sumTotal += clean.total
        }

        const count = pScores.length
        return {
          month: p,
          p1: Math.round((sumP1 / count) * 100) / 100,
          p2: Math.round((sumP2 / count) * 100) / 100,
          p3: Math.round((sumP3 / count) * 100) / 100,
          total: Math.round((sumTotal / count) * 100) / 100
        }
      })
    } catch (error: any) {
      console.error('Error in getPerformanceTrend:', error?.message || error)
      return []
    }
  }

  static async getKPIDistribution(unitId?: string, period?: string, year?: string): Promise<KPIDistribution[]> {
    const supabase = await createAdminClient()

    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      let query = supabase
        .from('t_individual_scores')
        .select(`
          p1_score, p2_score, p3_score, individual_total_score,
          employee:m_employees!t_individual_scores_employee_id_fkey!inner ( is_active, role, unit_id )
        `)
        .in('period', resolvedPeriods)
        .eq('employee.is_active', true)
        .neq('employee.role', 'superadmin')

      if (unitId && unitId !== 'all') {
        query = query.eq('employee.unit_id', unitId)
      }

      const { data: scores } = await query

      if (!scores || scores.length === 0) {
        return [
          { name: 'P1 (Posisi)', value: 0, color: '#3b82f6' },
          { name: 'P2 (Kinerja)', value: 0, color: '#10b981' },
          { name: 'P3 (Potensi)', value: 0, color: '#f59e0b' }
        ]
      }

      let sumP1 = 0, sumP2 = 0, sumP3 = 0
      for (const row of scores) {
        const clean = this.sanitizeScore(row)
        sumP1 += clean.p1
        sumP2 += clean.p2
        sumP3 += clean.p3
      }

      const count = scores.length
      return [
        { name: 'P1 (Posisi)', value: Math.round((sumP1 / count) * 100) / 100, color: '#3b82f6' },
        { name: 'P2 (Kinerja)', value: Math.round((sumP2 / count) * 100) / 100, color: '#10b981' },
        { name: 'P3 (Potensi)', value: Math.round((sumP3 / count) * 100) / 100, color: '#f59e0b' }
      ]
    } catch (error: any) {
      console.error('Error in getKPIDistribution:', error?.message || error)
      return [
        { name: 'P1 (Posisi)', value: 0, color: '#3b82f6' },
        { name: 'P2 (Kinerja)', value: 0, color: '#10b981' },
        { name: 'P3 (Potensi)', value: 0, color: '#f59e0b' }
      ]
    }
  }

  static async getEmployeeStats(employeeId: string, period?: string, year?: string): Promise<EmployeeStats> {
    const supabase = await createAdminClient()
    try {
      const resolvedPeriods = await this.getResolvedPeriods(supabase, period, year)

      const { data: employee } = await supabase
        .from('m_employees')
        .select('unit_id')
        .eq('id', employeeId)
        .single()

      if (!employee) throw new Error('Employee not found')

      const { data: empScoreRow } = await supabase
        .from('t_individual_scores')
        .select('p1_score, p2_score, p3_score, individual_total_score')
        .eq('employee_id', employeeId)
        .in('period', resolvedPeriods)
        .limit(1)

      let score = 0
      let completionStatus = 'Belum Dinilai'

      if (empScoreRow && empScoreRow.length > 0) {
        score = this.sanitizeScore(empScoreRow[0]).total
        completionStatus = 'Selesai'
      }

      const topInUnit = await this.getTopPerformers(1000, employee.unit_id, period, year)
      const rank = topInUnit.findIndex(p => p.id === employeeId) + 1

      return {
        score: Math.round(score * 100) / 100,
        rank: rank || 0,
        completionStatus,
        unitRank: rank > 0 ? `${rank} dari ${topInUnit.length}` : '-'
      }
    } catch (error) {
      console.error('Error in getEmployeeStats:', error)
      return { score: 0, rank: 0, completionStatus: 'Error', unitRank: '-' }
    }
  }

  static async getRecentActivities() {
    const supabase = await createAdminClient()
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data || []).map(audit => {
        const action = audit.action.toLowerCase()
        let type: 'create' | 'update' | 'delete' = 'update'
        if (action.includes('create') || action.includes('insert')) type = 'create'
        if (action.includes('delete') || action.includes('remove')) type = 'delete'

        const actionParts = audit.action.split(' ')
        const actionText = actionParts.length > 1 ? actionParts.slice(0, 2).join(' ') : audit.action

        return {
          id: audit.id,
          type,
          title: actionText,
          description: audit.details || 'No details',
          timestamp: new Date(audit.timestamp).toLocaleString('id-ID')
        }
      })
    } catch (error) {
      console.error('Exception in getRecentActivities:', error)
      return []
    }
  }
}
