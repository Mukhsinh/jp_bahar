import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: inds } = await supabase.from('m_kpi_indicators')
        .select('id, name, target_value, weight_percentage, calculation_method')
        .limit(10);

    console.log(inds);
}
main().catch(console.error);
