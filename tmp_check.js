const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars', { supabaseUrl });
    process.exit(1);
}

const supa = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const { data: dbAssess, error: dbErr } = await supa
            .from('t_kpi_assessments')
            .select('id, period, employee_id, revenue_type')
            .limit(20);

        console.log('Assessments (limit 20):', JSON.stringify(dbAssess, null, 2));

        if (dbErr) {
            console.error('Error:', dbErr);
        }
    } catch (err) {
        console.error('Catch error:', err);
    }
}

run();
