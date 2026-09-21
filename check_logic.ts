import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const empId = '9b44aa8b-6012-4ba7-b9cc-018563d28668' // Durrotul
    const period = '2026-08'
    const revenueType = 'umum'

    // 1. Fetch assessments
    const { data: allAssessments } = await supabase
        .from('t_kpi_assessments')
        .select(`
      employee_id, indicator_id, score, realization_value, weight_percentage, target_value,
      m_kpi_indicators (
        id, name, target_value, weight_percentage, base_index_value, calculation_method,
        m_kpi_categories (category, configuration_style, is_weighted)
      )
    `)
        .eq('employee_id', empId)
        .eq('period', period)
        .eq('revenue_type', revenueType)
        .is('sub_indicator_id', null)

    // 2. Fetch sub assessments
    const { data: subAssessments } = await supabase
        .from('t_kpi_assessments')
        .select('employee_id, indicator_id, score, realization_value, sub_indicator_id, m_kpi_sub_indicators(id, name, score_value)')
        .eq('employee_id', empId)
        .eq('period', period)
        .eq('revenue_type', revenueType)
        .not('sub_indicator_id', 'is', null)

    const subScoreMap = new Map()
    for (const sub of (subAssessments || [])) {
        if (!sub.m_kpi_sub_indicators) continue
        const sVal = parseFloat((sub.m_kpi_sub_indicators as any).score_value) || 0
        const sKey = `${sub.employee_id}:${sub.indicator_id}`
        const existing = subScoreMap.get(sKey)
        if (existing) {
            existing.count++
            existing.score += sVal
        } else {
            subScoreMap.set(sKey, { count: 1, score: sVal })
        }
    }

    const empAssessments = allAssessments || []
    let totalActivityRupiah = 0

    empAssessments.forEach((a: any) => {
        const indRealization = parseFloat(a.realization_value) || 0
        const basicVal = parseFloat(a.m_kpi_indicators?.base_index_value) || 0
        const rawScore = a.score
        const indWeight = parseFloat(a.weight_percentage) || parseFloat(a.m_kpi_indicators?.weight_percentage) || 0
        const indTarget = parseFloat(a.target_value) || parseFloat(a.m_kpi_indicators?.target_value) || 0
        const calcMethod = a.m_kpi_indicators?.calculation_method || 'indexing'

        const isPriority = calcMethod === 'priority'
        const isActivity = isPriority

        let effectiveScore: number
        const subKey = `${empId}:${a.indicator_id}`
        const subAgg = subScoreMap.get(subKey)

        if (subAgg !== undefined) {
            effectiveScore = subAgg.score
        } else if (rawScore !== null && rawScore !== undefined && parseFloat(rawScore) >= 0) {
            if (isActivity && basicVal > 1 && parseFloat(rawScore) === indRealization) {
                effectiveScore = indRealization * basicVal
            } else {
                effectiveScore = parseFloat(rawScore)
            }
        } else if (basicVal > 1) {
            effectiveScore = indRealization * basicVal
        } else if (indTarget > 0) {
            const achPct = Math.min(100, (indRealization / indTarget) * 100)
            effectiveScore = indWeight > 0 ? (achPct * indWeight) / 100 : achPct
        } else {
            effectiveScore = indRealization
        }

        if (isActivity) {
            console.log(`Activity [${a.m_kpi_indicators?.name}]: rawScore=${rawScore}, real=${indRealization}, basicVal=${basicVal} -> effScore=${effectiveScore}`)
            totalActivityRupiah += effectiveScore
        }
    })

    console.log('Final totalActivityRupiah:', totalActivityRupiah)
}

run()
