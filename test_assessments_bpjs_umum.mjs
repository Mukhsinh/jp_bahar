import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
    const { data: assessments, error } = await supabase
        .from('t_kpi_assessments')
        .select('employee_id, period, indicator_id')

    const byPeriod = {}
    assessments.forEach(a => {
        if (!byPeriod[a.period]) byPeriod[a.period] = new Set()
        byPeriod[a.period].add(a.employee_id)
    })

    for (let p in byPeriod) {
        console.log(`Period ${p} has ${byPeriod[p].size} unique employee_ids assessed`)
    }

    // Get units
    const { data: emps } = await supabase.from('m_employees').select('id, m_units(name)')
    const keperawatanMap = new Set()
    emps.forEach(e => {
        if (e.m_units && e.m_units.name === 'KEPERAWATAN') keperawatanMap.add(e.id)
    })

    const byPeriodKep = {}
    assessments.forEach(a => {
        if (keperawatanMap.has(a.employee_id)) {
            if (!byPeriodKep[a.period]) byPeriodKep[a.period] = new Set()
            byPeriodKep[a.period].add(a.employee_id)
        }
    })

    for (let p in byPeriodKep) {
        console.log(`(Kep) Period ${p} has ${byPeriodKep[p].size} unique employee_ids assessed`)
    }
}

test()
