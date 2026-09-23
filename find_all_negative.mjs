import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: assessments, error } = await supabase
        .from('t_kpi_assessments')
        .select('*, m_kpi_indicators(name, calculation_method, base_index_value), m_kpi_sub_indicators(name, base_index_value)');

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    const negs = assessments?.filter(a => Number(a.realization_value) < 0 || (a.m_kpi_indicators && Number(a.m_kpi_indicators.base_index_value) < 0) || (a.m_kpi_sub_indicators && Number(a.m_kpi_sub_indicators.base_index_value) < 0));

    console.log('=== ALL NEGATIVE ASSESSMENTS IN DATABASE (' + (negs?.length || 0) + ') ===');
    console.log(JSON.stringify(negs, null, 2));
}

run();
