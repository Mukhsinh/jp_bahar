const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function getColumns() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, key);

    const tables = ['t_kpi_assessments', 't_individual_scores', 't_unit_scores', 't_calculation_results', 't_history_pir', 't_calculation_log', 'remunerasi_hasil'];

    for (const table of tables) {
        console.log(`\n--- TABLE: ${table} ---`);
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position;` });
        if (error) {
            // Fallback: try inserting dummy and reading error or selecting 1 row
            const { data: selectData, error: selectErr } = await supabase.from(table).select('*').limit(1);
            if (selectErr) {
                console.log('Error selecting:', selectErr.message);
            } else if (selectData.length > 0) {
                console.log('Columns from row:', Object.keys(selectData[0]));
            } else {
                // Try inserting empty object to get column list error
                const { error: insErr } = await supabase.from(table).insert({});
                console.log('Insert error hint:', insErr?.message);
            }
        } else {
            console.log(data);
        }
    }
}

getColumns().then(() => process.exit(0));
