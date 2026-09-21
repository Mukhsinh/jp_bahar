import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const empId = '9b44aa8b-6012-4ba7-b9cc-018563d28668' // Durrotul

    const { data: q1 } = await supabase
        .from('t_kpi_assessments')
        .select('id, score, realization_value, revenue_type, m_kpi_indicators(name)')
        .eq('employee_id', empId)
        .or('score.eq.175000,realization_value.eq.175000')

    console.log('Assessments with 175000 for Durrotul:', q1)

    const { data: q2 } = await supabase
        .from('t_kpi_assessments')
        .select('id, score, realization_value, revenue_type, m_kpi_indicators(name)')
        .or('score.eq.175000,realization_value.eq.175000')
        .limit(10)

    console.log('Assessments with 175000 globally (first 10):', q2)
}

test()
