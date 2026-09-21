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
    const { data: indicators } = await supabase
        .from('m_kpi_indicators')
        .select('name, base_index_value, calculation_method, target_value')
        .or('base_index_value.eq.175000,target_value.eq.175000,base_index_value.eq.175,target_value.eq.175')

    console.log('Indicators with 175000:', indicators)
}

test()
