const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function check() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(url, key);
    const tables = [
        't_kpi_assessments',
        't_pool',
        't_pool_revenue',
        't_pool_deduction',
        't_individual_scores',
        't_unit_scores',
        't_calculation_results',
        't_calculation_log',
        't_history_pir',
        'remunerasi_hasil',
        'remunerasi_periode',
        'm_employees',
        'm_units',
        'v_assessment_status',
        't_audit_log',
        't_auth_log'
    ];

    console.log('=== TABLE ROW COUNTS ===');
    for (const table of tables) {
        try {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) console.log(`[ERROR] ${table}: ${error.message}`);
            else console.log(`[COUNT] ${table}: ${count}`);
        } catch (e) {
            console.log(`[EXCEPT] ${table}: ${e.message}`);
        }
    }
}

check();
