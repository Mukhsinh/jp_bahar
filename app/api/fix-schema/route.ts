import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const sql = `
      ALTER TABLE t_kpi_assessments DROP COLUMN IF EXISTS score;
      ALTER TABLE t_kpi_assessments ADD COLUMN score DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
          WHEN target_value > 0 AND (realization_value / target_value * 100) >= 100 THEN weight_percentage
          WHEN target_value > 0 THEN ROUND((realization_value / target_value * weight_percentage)::numeric, 2)
          ELSE 0 
        END
      ) STORED;
    `

        // We can't run raw SQL via the client easily unless there's an RPC.
        // Let's try to check if there's a migration function or use the postgres driver if we can?
        // Actually, Supabase client doesn't support raw SQL.

        return NextResponse.json({
            error: 'Cannot run raw SQL via Supabase client. Please use the Supabase Dashboard SQL Editor to run the following SQL:',
            sql: sql
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
