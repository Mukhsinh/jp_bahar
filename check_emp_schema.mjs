import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: emps, error } = await supabase
        .from('m_employees')
        .select('*')
        .limit(10);

    if (error) {
        console.error('Emp fetch error:', error);
        return;
    }

    console.log('Sample employees from DB:');
    console.log(JSON.stringify(emps, null, 2));
}

run();
