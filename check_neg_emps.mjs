import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: emps } = await supabase
        .from('m_employees')
        .select('id, employee_code, name, unit_id, m_units(name)')
        .in('id', ['abbe3d1b-0b9d-4d7f-af29-d87a101ce252', '7d7a32fc-83ac-463e-baa1-c8d7255c1e0e']);

    console.log('=== EMPLOYEES WITH NEGATIVE ASSESSMENTS ===');
    console.log(JSON.stringify(emps, null, 2));

    // Also get all employees in the SAME unit as these two
    if (emps && emps.length > 0) {
        const unitIds = emps.map(e => e.unit_id);
        const { data: unitEmps } = await supabase
            .from('m_employees')
            .select('id, employee_code, name, unit_id, m_units(name)')
            .in('unit_id', unitIds);

        console.log('\n=== ALL EMPLOYEES IN THAT UNIT ===');
        console.log(JSON.stringify(unitEmps, null, 2));
    }
}

run();
