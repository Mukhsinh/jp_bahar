import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    console.log('--- REMUNERASI MASTER DOKTER ---')
    const { data: docs } = await supabase
        .from('remunerasi_master_dokter')
        .select('*')
    console.log('Master Dokter:', JSON.stringify(docs, null, 2))

    console.log('\n--- KPI INDICATORS FOR MEDIS UNIT ---')
    const { data: medisUnit } = await supabase.from('m_units').select('id').eq('name', 'MEDIS').single()
    if (medisUnit) {
        const { data: cats } = await supabase.from('m_kpi_categories').select('*, m_kpi_indicators(*)').eq('unit_id', medisUnit.id)
        console.log('Categories & Indicators for MEDIS:', JSON.stringify(cats, null, 2))
    }
}

run().catch(console.error)
