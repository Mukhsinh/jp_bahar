import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { data: units } = await supabase
        .from('m_units')
        .select('id, name')
        .ilike('name', '%KEPERAWATAN%')

    console.log('Units:', units)

    const empId = '9b44aa8b-6012-4ba7-b9cc-018563d28668' // Durrotul
    const { data: doctorMaster } = await supabase
        .from('remunerasi_master_dokter')
        .select('pagu_guarantee_fee')
        .eq('employee_id', empId)

    console.log('Guarantee fee for Durrotul:', doctorMaster)
}

test()
