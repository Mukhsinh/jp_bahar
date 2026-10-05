import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSubAss() {
    const { data: subAss, error } = await supabase.from('t_kpi_sub_assessments').select('*');
    console.log('Total sub assessments in table:', subAss?.length, error);
    if (subAss && subAss.length > 0) {
        console.log('Sample sub assessments:', subAss.slice(0, 10));
    }
}
checkSubAss();
