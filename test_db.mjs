import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data, error } = await supabase.from('t_kpi_assessments').select('*, m_kpi_indicators(name, base_index_value, calculation_method)').eq('revenue_type', 'bpjs').order('created_at', { ascending: false });
    console.log(JSON.stringify(data.filter(d => Number(d.realization_value) < 0 || (d.m_kpi_indicators && Number(d.m_kpi_indicators.base_index_value) < 0)), null, 2));
}
run();
