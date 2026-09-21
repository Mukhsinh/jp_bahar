import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

async function test() {
    const { data: ind1 } = await supabase
        .from('m_kpi_indicators')
        .select('name, base_index_value, calculation_method')
        .eq('base_index_value', '1750')
    console.log('1750 indicators:', ind1)

    const { data: ind2 } = await supabase
        .from('m_kpi_indicators')
        .select('name, base_index_value, calculation_method')
        .eq('base_index_value', '17500')
    console.log('17500 indicators:', ind2)
}

test()
