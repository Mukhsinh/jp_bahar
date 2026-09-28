const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function checkNani() {
    const { data: emps } = await supabase.from('m_employees').select('id, full_name').ilike('full_name', '%NANI YULIDARNI%');
    if (emps && emps.length > 0) {
        const empId = emps[0].id;
        console.log('Found ID:', empId);

        console.log('--- MAIN ASSESSMENTS ---');
        const { data: main } = await supabase.from('t_kpi_assessments').select('*').eq('employee_id', empId).is('sub_indicator_id', null).eq('period', 'August 2026');
        console.log(main);

        console.log('--- SUB ASSESSMENTS ---');
        const { data: subs } = await supabase.from('t_kpi_assessments').select('*').eq('employee_id', empId).not('sub_indicator_id', 'is', null).eq('period', 'August 2026');
        console.log(subs);
    }
}
checkNani().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
