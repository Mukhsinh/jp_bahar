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
    const { data: emps } = await supabase
        .from('m_employees')
        .select('id, full_name')
        .ilike('full_name', '%Durrotul%')

    if (!emps || emps.length === 0) {
        console.log('Employee not found')
        return
    }

    const empId = emps[0].id
    console.log(`Found Employee: ${emps[0].full_name} (${empId})`)

    const period = '2026-08'
    const { data: assessments } = await supabase
        .from('t_kpi_assessments')
        .select(`
      id,
      score,
      realization_value,
      revenue_type,
      m_kpi_indicators (
        name,
        calculation_method,
        base_index_value,
        m_kpi_categories(category)
      )
    `)
        .eq('employee_id', empId)
        .eq('period', period)
        .eq('revenue_type', 'umum')

    console.log('All UMUM Assessments:')
    assessments?.forEach((a: any) => {
        console.log(JSON.stringify(a))
    })
}

test()
