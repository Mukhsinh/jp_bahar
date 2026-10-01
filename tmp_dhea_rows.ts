import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    const empId = 'fb38995d-5f23-4d5c-b4b4-c6ffb6a17982'
    const { data: rows } = await supabase
        .from('t_kpi_assessments')
        .select('id, period, revenue_type, indicator_id, sub_indicator_id, realization_value, score, created_at, updated_at')
        .eq('employee_id', empId)

    console.log('All t_kpi_assessments for dr. Dhea:')
    console.table(rows)
}

run().catch(console.error)
