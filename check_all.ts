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
    const period = '2026-08'

    const { data: allAss } = await supabase
        .from('t_kpi_assessments')
        .select('*')
        .eq('employee_id', empId)
        .eq('period', period)
        .eq('revenue_type', 'umum')

    console.log('ALL assessments for Durrotul:')
    allAss?.forEach(a => console.log(`score:${a.score} | real:${a.realization_value} | ind:${a.indicator_id} | sub:${a.sub_indicator_id}`))

    const { data: subAss } = await supabase
        .from('m_kpi_sub_indicators')
        .select('id, name, score_value')
        .in('id', allAss?.filter(a => a.sub_indicator_id).map(a => a.sub_indicator_id) || [])

    console.log('Sub-indicators mapped:', subAss)
}

test()
