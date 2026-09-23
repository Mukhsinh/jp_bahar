import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: allAss } = await supabase
        .from('t_kpi_assessments')
        .select('*, m_kpi_indicators(name)')
        .order('created_at', { ascending: false });

    const { data: allEmps } = await supabase
        .from('m_employees')
        .select('id, employee_code, name, unit_id, m_units(name)');

    const empMap = new Map(allEmps?.map(e => [e.id, e]));

    console.log('Total assessments in DB:', allAss?.length);
    console.log('Total employees in DB:', allEmps?.length);

    const negs = allAss?.filter(a => Number(a.realization_value) < 0 || Number(a.score) < 0 || (a.m_kpi_indicators?.name?.toUpperCase()?.includes('POTONGAN')));

    console.log('\n=== ALL POTONGAN / NEGATIVE ASSESSMENTS ===');
    console.log(negs?.map(a => ({
        id: a.id,
        employee_id: a.employee_id,
        emp_name: empMap.get(a.employee_id)?.name || 'UNKNOWN (ID NOT IN m_employees)',
        emp_code: empMap.get(a.employee_id)?.employee_code,
        unit: empMap.get(a.employee_id)?.m_units?.name,
        period: a.period,
        revenue_type: a.revenue_type,
        realization: a.realization_value,
        score: a.score,
        ind_name: a.m_kpi_indicators?.name
    })));
}

run();
