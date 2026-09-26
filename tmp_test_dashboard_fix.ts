const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function testFix() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, key);

    console.log('=== TESTING FIXED DASHBOARD QUERIES ===');

    // Parse period 'M-08' -> '2026-08'
    function parsePeriod(period, year = '2026') {
        if (!period || period === 'month' || period === 'all') return null;
        if (period.startsWith('M-')) {
            const m = period.split('-')[1];
            return `${year}-${m.padStart(2, '0')}`;
        }
        return period;
    }

    const periodStr = parsePeriod('M-08', '2026') || '2026-08';
    console.log('Target period:', periodStr);

    // 1. Get employees
    const { data: emps } = await supabase.from('m_employees').select('id, full_name, unit_id, m_units(name)').eq('is_active', true).neq('role', 'superadmin');
    console.log('Active employees count:', emps.length);

    // 2. Query t_individual_scores
    const { data: scores } = await supabase.from('t_individual_scores').select('*').eq('period', periodStr);
    console.log(`t_individual_scores count for ${periodStr}:`, scores ? scores.length : 0);

    if (scores && scores.length > 0) {
        const avgScore = scores.reduce((sum, s) => sum + Number(s.individual_total_score || 0), 0) / scores.length;
        const avgP1 = scores.reduce((sum, s) => sum + Number(s.p1_score || 0), 0) / scores.length;
        const avgP2 = scores.reduce((sum, s) => sum + Number(s.p2_score || 0), 0) / scores.length;
        const avgP3 = scores.reduce((sum, s) => sum + Number(s.p3_score || 0), 0) / scores.length;

        console.log('\n--- CARD STATS ---');
        console.log('Total Employees:', emps.length);
        console.log('Average Score (Skor KPI):', avgScore.toFixed(2));
        console.log('Completion Rate:', ((scores.length / emps.length) * 100).toFixed(1) + '%');

        console.log('\n--- KPI DISTRIBUTION ---');
        console.log('P1 (Posisi):', avgP1.toFixed(2));
        console.log('P2 (Kinerja):', avgP2.toFixed(2));
        console.log('P3 (Potensi):', avgP3.toFixed(2));

        // Top Performers
        const empMap = new Map(emps.map(e => [e.id, e]));
        const joined = scores.map(s => {
            const e = empMap.get(s.employee_id);
            return {
                id: s.employee_id,
                name: e ? e.full_name : 'Unknown',
                unit: e && e.m_units ? e.m_units.name : 'Unknown',
                score: Number(s.individual_total_score || 0)
            };
        });

        joined.sort((a, b) => b.score - a.score);
        console.log('\n--- TOP 5 PERFORMERS ---');
        console.log(joined.slice(0, 5));

        console.log('\n--- WORST 5 PERFORMERS ---');
        console.log(joined.slice(-5).reverse());
    }
}

testFix().then(() => process.exit(0));
