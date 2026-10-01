import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    const empId = 'fb38995d-5f23-4d5c-b4b4-c6ffb6a17982'
    const { data: ass } = await supabase
        .from('t_kpi_assessments')
        .select(`
      id, period, revenue_type, score, weight_percentage, realization_value, target_value, sub_indicator_id,
      m_kpi_indicators (
        id, name, calculation_method, base_index_value, weight_percentage, target_value,
        m_kpi_categories ( id, category, configuration_style, is_weighted, revenue_type, unit_id )
      ),
      m_kpi_sub_indicators ( id, name, measurement_type, base_index_value, weight_percentage )
    `)
        .eq('employee_id', empId)
        .eq('period', '2026-08')

    console.log('ALL ASSESSMENTS FOR 2026-08:')
    ass?.forEach((a: any) => {
        console.log({
            id: a.id,
            revenue_type: a.revenue_type,
            indicator_name: a.m_kpi_indicators?.name,
            category: a.m_kpi_indicators?.m_kpi_categories?.category,
            calc_method: a.m_kpi_indicators?.calculation_method,
            sub_indicator_name: a.m_kpi_sub_indicators?.name,
            sub_measurement: a.m_kpi_sub_indicators?.measurement_type,
            sub_base_index: a.m_kpi_sub_indicators?.base_index_value,
            realization_value: a.realization_value,
            score: a.score,
            target: a.target_value
        })
    })

    // Also check if there are other period assessments or other employees in MEDIS unit
    const { data: emp } = await supabase.from('m_employees').select('*, m_units(*)').eq('id', empId).single()
    console.log('EMP UNIT:', emp?.m_units)
}

run().catch(console.error)
