import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    const { data: allRows, error } = await supabase
        .from('t_kpi_assessments')
        .select(`
      id, period, employee_id, revenue_type, realization_value, score, target_value, indicator_id, sub_indicator_id,
      m_employees!t_kpi_assessments_employee_id_fkey ( full_name, unit_id, m_units(name) ),
      m_kpi_indicators ( name, calculation_method )
    `)
        .gt('realization_value', 1000)

    if (error) console.error('Query error:', error)
    console.log('Found large realization rows count:', allRows?.length)
    allRows?.forEach((r: any) => {
        console.log({
            id: r.id,
            period: r.period,
            employee_name: r.m_employees?.full_name,
            unit_name: r.m_employees?.m_units?.name,
            revenue_type: r.revenue_type,
            indicator_name: r.m_kpi_indicators?.name,
            calc_method: r.m_kpi_indicators?.calculation_method,
            realization_value: r.realization_value,
            score: r.score
        })
    })
}

run().catch(console.error)
