import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const { data } = await supabase
        .from('t_kpi_assessments')
        .select('id, indicator_id, created_at, updated_at, m_kpi_indicators(name)')
        .eq('revenue_type', 'umum')
        .eq('employee_id', '9b44aa8b-6012-4ba7-b9cc-018563d28668')
        .is('sub_indicator_id', null)
        .order('indicator_id')

    console.log(JSON.stringify(data, null, 2))
}

run()
