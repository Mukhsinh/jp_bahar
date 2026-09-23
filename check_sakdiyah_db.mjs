import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const empId = 'abbe3d1b-0b9d-4d7f-af29-d87a101ce252'; // Sakdiyah
    const period = '2026-08';

    const { data: mainAsses } = await supabase
        .from('t_kpi_assessments')
        .select('*')
        .eq('employee_id', empId)
        .eq('period', period)
        .is('sub_indicator_id', null);

    console.log('Sakdiyah MAIN assessments count:', mainAsses.length);
    mainAsses.forEach(a => console.log('Main:', a.indicator_id));

    const { data: subAsses } = await supabase
        .from('t_kpi_assessments')
        .select('*')
        .eq('employee_id', empId)
        .eq('period', period)
        .not('sub_indicator_id', 'is', null);

    console.log('Sakdiyah SUB assessments count:', subAsses.length);
    subAsses.forEach(a => console.log('Sub:', a.indicator_id, 'Realization:', a.realization_value));
}

run();
