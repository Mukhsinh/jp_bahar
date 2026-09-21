import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function main() {
    const { data: cats } = await supabase.from('m_kpi_categories').select('category').limit(10);
    console.log("Categories:", cats);
    const { data: revs } = await supabase.from('t_kpi_assessments').select('revenue_type').limit(5);
    console.log("Revenue types:", revs);
}
main();
