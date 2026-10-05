import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectKasi() {
    const catIds = [
        '12c2b31b-a5c6-4cad-8525-ed492b860d0f', // P1
        'b37f7645-493d-4883-8f32-589231f7d687', // P2
        'f4a55bd3-9fdd-4572-af5e-684f7e8acf5f'  // P3
    ];

    const { data: indicators, error } = await supabase.from('m_kpi_indicators').select('*').in('category_id', catIds);
    console.log('Indicators count:', indicators?.length);

    if (indicators) {
        for (const ind of indicators) {
            const { data: subInds } = await supabase.from('m_kpi_sub_indicators').select('*').eq('indicator_id', ind.id);
            console.log(`\nInd ID: ${ind.id} | Code: ${ind.code} | Name: ${ind.name} | CatID: ${ind.category_id} | CalcMethod: ${ind.calculation_method} | Weight: ${ind.weight_percentage} | Target: ${ind.target_value}`);
            if (subInds && subInds.length > 0) {
                console.log(`   --> ${subInds.length} Sub-indicators:`);
                subInds.forEach(s => console.log(`      Sub ID: ${s.id} | Code: ${s.code} | Name: ${s.name} | Weight: ${s.weight_percentage}% | Type: ${s.measurement_type} | Target: ${s.target_value} | BaseIndexVal: ${s.base_index_value}`));
            }
        }
    }
}

inspectKasi().catch(console.error);
