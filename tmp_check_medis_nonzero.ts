import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    const { data: medisEmps } = await supabase
        .from('m_employees')
        .select('id, full_name')
        .eq('unit_id', '398d11b1-523d-478c-ac38-61caffb9fec0')

    const ids = medisEmps?.map(e => e.id) || []

    const { data: ass } = await supabase
        .from('t_kpi_assessments')
        .select('id, employee_id, revenue_type, realization_value, m_kpi_indicators(name), m_employees!t_kpi_assessments_employee_id_fkey(full_name)')
        .in('employee_id', ids)
        .gt('realization_value', 0)

    console.log('Non-zero assessments in MEDIS unit:', JSON.stringify(ass, null, 2))
}

run().catch(console.error)
