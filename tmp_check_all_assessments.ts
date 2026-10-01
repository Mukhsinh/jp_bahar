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
        .select('id, full_name, unit_id')
        .eq('unit_id', '398d11b1-523d-478c-ac38-61caffb9fec0')

    console.log('MEDIS EMPLOYEES COUNT:', medisEmps?.length)

    const empIds = medisEmps?.map(e => e.id) || []

    const { data: allAss } = await supabase
        .from('t_kpi_assessments')
        .select(`
      id, period, employee_id, revenue_type, realization_value, score, target_value,
      m_kpi_indicators ( name, calculation_method )
    `)
        .in('employee_id', empIds)

    console.log('TOTAL ASSESSMENTS IN MEDIS UNIT:', allAss?.length)

    const nonZeroPriority = allAss?.filter(a => Number(a.realization_value) > 0 || Number(a.score) > 0)
    console.log('NON ZERO ASSESSMENTS IN MEDIS UNIT:', JSON.stringify(nonZeroPriority, null, 2))
}

run().catch(console.error)
