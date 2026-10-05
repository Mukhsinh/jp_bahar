import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectAssessments() {
    const empId = 'aeb81480-97fa-404b-8ed3-1b545648a666'; // dr. EDI YULIANTO
    const { data: assessments } = await supabase
        .from('t_kpi_assessments')
        .select('*, m_kpi_indicators(*, m_kpi_categories(*))')
        .eq('employee_id', empId);

    console.log('Total assessments for dr. EDI YULIANTO across all periods:', assessments?.length);
    for (const a of assessments || []) {
        const { data: subAss } = await supabase.from('t_kpi_sub_assessments').select('*, m_kpi_sub_indicators(*)').eq('assessment_id', a.id);
        const cat = a.m_kpi_indicators?.m_kpi_categories?.category;
        console.log(`Period: ${a.period} | RevType: ${a.revenue_type} | IndCode: ${a.m_kpi_indicators?.code} | Name: ${a.m_kpi_indicators?.name} | Cat: ${cat} | Realization: ${a.realization_value} | Score: ${a.score} | SubAss: ${subAss?.length}`);
        subAss?.forEach(s => {
            console.log(`   --> Sub: ${s.m_kpi_sub_indicators?.name} | Realization: ${s.realization_value} | Score: ${s.score}`);
        });
    }
}

inspectAssessments().catch(console.error);
