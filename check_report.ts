import { generateIncentiveReport } from './app/api/reports/generate/route.ts'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
    const period = '2026-08'
    // get durrotul ID
    const { data: emps } = await supabase.from('m_employees').select('id, full_name').ilike('full_name', '%Durrotul%').limit(1)
    const empId = emps![0].id

    // Call generateIncentiveReport for UMUM
    console.log('Generating report for ' + empId)
    const reportData = await generateIncentiveReport(supabase, period, 'all', empId, 'umum')

    if (reportData.length > 0) {
        const row = reportData[0]
        console.log('Result for Durrotul:')
        console.log('totalActivityRupiah:', row.total_activity_rupiah)
        console.log('grossIncentive:', row.gross_incentive)
        console.log('p1_priority:', row.p1_priority)
        console.log('p2_priority:', row.p2_priority)
        console.log('p3_priority:', row.p3_priority)

        console.log('assessment_details with activity_value > 0:')
        const actDetails = row.assessment_details.filter((d: any) => d.activity_value > 0)
        console.log(JSON.stringify(actDetails, null, 2))
    } else {
        console.log('No report generated')
    }
}

test()
