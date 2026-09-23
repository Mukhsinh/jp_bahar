import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const period = '2026-08';
    const revenueType = 'bpjs';

    // 1. Fetch all employees
    const { data: emps } = await supabase
        .from('m_employees')
        .select('id, employee_code, name, unit_id, m_units(id, name)');

    console.log('=== EMPLOYEES ===');
    console.log(emps?.map(e => ({ id: e.id, code: e.employee_code, name: e.name, unit: e.m_units ? e.m_units.name : null })));

    // 2. Fetch all assessments for period 2026-08 and revenue_type bpjs
    const { data: assessments } = await supabase
        .from('t_kpi_assessments')
        .select('*, m_kpi_indicators(name, calculation_method, base_index_value), m_kpi_sub_indicators(name, base_index_value)')
        .eq('period', period)
        .eq('revenue_type', revenueType);

    console.log('\n=== ASSESSMENTS FOR 2026-08 BPJS ===');
    console.log(assessments?.map(a => ({
        id: a.id,
        emp_id: a.employee_id,
        ind_id: a.indicator_id,
        sub_ind_id: a.sub_indicator_id,
        realization: a.realization_value,
        score: a.score,
        ind_name: a.m_kpi_indicators ? a.m_kpi_indicators.name : null,
        calc_method: a.m_kpi_indicators ? a.m_kpi_indicators.calculation_method : null,
        base_val: a.m_kpi_indicators ? a.m_kpi_indicators.base_index_value : null,
        sub_base_val: a.m_kpi_sub_indicators ? a.m_kpi_sub_indicators.base_index_value : null
    })));
}

run();
