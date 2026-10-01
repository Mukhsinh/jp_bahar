import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    console.log('--- EMPLOYEES MATCHING DHEA ---')
    const { data: emps, error: empErr } = await supabase
        .from('m_employees')
        .select('id, full_name, nik, unit_id, m_units(id, name, kpi_schema_mode)')
        .ilike('full_name', '%Dhea%')

    console.log('Employee error:', empErr)
    console.log('Employees:', JSON.stringify(emps, null, 2))

    if (emps && emps.length > 0) {
        for (const emp of emps) {
            console.log(`\n--- ASSESSMENTS FOR ${emp.full_name} (${emp.id}) ---`)
            const { data: ass, error: assErr } = await supabase
                .from('t_kpi_assessments')
                .select(`
          id, period, revenue_type, score, weight_percentage, realization_value, target_value, sub_indicator_id,
          m_kpi_indicators (
            id, name, calculation_method, base_index_value, weight_percentage, target_value,
            m_kpi_categories ( id, category, configuration_style, is_weighted, revenue_type, unit_id )
          ),
          m_kpi_sub_indicators ( id, name, measurement_type, base_index_value, weight_percentage )
        `)
                .eq('employee_id', emp.id)

            console.log('Assessment count:', ass?.length)
            console.log('Assessments:', JSON.stringify(ass, null, 2))
        }
    }

    // Also check t_calculation_results or t_individual_scores for recent periods
    console.log('\n--- RECENT CALCULATION RESULTS FOR DHEA ---')
    if (emps && emps.length > 0) {
        const empId = emps[0].id
        const { data: calcRes } = await supabase
            .from('t_calculation_results')
            .select('*')
            .eq('employee_id', empId)
        console.log('Calc Results:', JSON.stringify(calcRes, null, 2))
    }
}

run().catch(console.error)
