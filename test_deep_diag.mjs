import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
    const keperawatanId = '30ae9e7f-1296-44e1-83c3-f92817592c80'

    // Get ALL employees
    const { data: emps } = await supabase.from('m_employees').select('id').eq('unit_id', keperawatanId).eq('is_active', true)
    const empIds = emps.map(e => e.id)
    console.log(`Active employees: ${empIds.length}`)

    // Paginated fetch ALL assessments for period 2026-08 with BPJS
    let allBpjs = []
    let page = 0
    const pageSize = 1000
    while (true) {
        const { data, error } = await supabase
            .from('t_kpi_assessments')
            .select('employee_id, indicator_id, sub_indicator_id')
            .in('employee_id', empIds)
            .eq('period', '2026-08')
            .eq('revenue_type', 'bpjs')
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) { console.error(error); break }
        allBpjs.push(...data)
        if (data.length < pageSize) break
        page++
    }
    console.log(`Total BPJS assessment rows: ${allBpjs.length}`)

    // Count unique employees with main (non-sub) assessments
    const bpjsEmpIndicators = {}
    allBpjs.filter(a => !a.sub_indicator_id).forEach(a => {
        if (!bpjsEmpIndicators[a.employee_id]) bpjsEmpIndicators[a.employee_id] = new Set()
        bpjsEmpIndicators[a.employee_id].add(a.indicator_id)
    })

    const totalRequired = 17
    let complete = 0
    let partial = 0
    for (const [empId, indSet] of Object.entries(bpjsEmpIndicators)) {
        if (indSet.size >= totalRequired) complete++
        else partial++
    }
    console.log(`BPJS: ${complete} complete, ${partial} partial out of ${Object.keys(bpjsEmpIndicators).length} assessed employees`)

    // Same for UMUM
    let allUmum = []
    page = 0
    while (true) {
        const { data, error } = await supabase
            .from('t_kpi_assessments')
            .select('employee_id, indicator_id, sub_indicator_id')
            .in('employee_id', empIds)
            .eq('period', '2026-08')
            .eq('revenue_type', 'umum')
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) { console.error(error); break }
        allUmum.push(...data)
        if (data.length < pageSize) break
        page++
    }
    console.log(`\nTotal UMUM assessment rows: ${allUmum.length}`)

    const umumEmpIndicators = {}
    allUmum.filter(a => !a.sub_indicator_id).forEach(a => {
        if (!umumEmpIndicators[a.employee_id]) umumEmpIndicators[a.employee_id] = new Set()
        umumEmpIndicators[a.employee_id].add(a.indicator_id)
    })

    let umumComplete = 0
    let umumPartial = 0
    for (const [empId, indSet] of Object.entries(umumEmpIndicators)) {
        if (indSet.size >= totalRequired) umumComplete++
        else umumPartial++
    }
    console.log(`UMUM: ${umumComplete} complete, ${umumPartial} partial out of ${Object.keys(umumEmpIndicators).length} assessed employees`)
}

test()
