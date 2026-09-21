import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function batchedIn(supabaseClient, table, selectFields, inColumn, inValues, queryBuilderFn = undefined, batchSize = 100) {
    if (!inValues || inValues.length === 0) return [];
    const allData = [];
    for (let i = 0; i < inValues.length; i += batchSize) {
        const chunk = inValues.slice(i, i + batchSize);
        let query = supabaseClient.from(table).select(selectFields).in(inColumn, chunk);
        if (queryBuilderFn) query = queryBuilderFn(query);
        const { data, error } = await query;
        if (error) throw error;
        if (data) allData.push(...data);
    }
    return allData;
}

async function main() {
    const period = '2026-08'; // Hardcode known issue period or adjust later
    const revenueType = 'umum';

    // Choose the first Keperawatan unit
    const { data: units } = await supabase.from('m_units').select('id, name, kpi_schema_mode').ilike('name', '%KEPERAWATAN%');
    const unitId = units[0].id;
    console.log(`Unit: ${units[0].name}, schema: ${units[0].kpi_schema_mode}`);

    const { data: allEmployees } = await supabase
        .from('m_employees')
        .select(`
            id, full_name, unit_id,
            m_units ( id, name, kpi_schema_mode )
        `)
        .neq('role', 'superadmin')
        .eq('unit_id', unitId)
        .limit(5);

    const empIds = allEmployees.map(e => e.id);

    const mainFields = `
      employee_id, indicator_id, score, realization_value, weight_percentage,
      m_kpi_indicators (
        id, name, target_value, weight_percentage, calculation_method,
        m_kpi_categories (category, is_weighted, configuration_style, weight_percentage)
      )
    `;

    const subFields = `
      employee_id, indicator_id, score, realization_value,
      m_kpi_sub_indicators (id, measurement_type, base_index_value, weight_percentage)
    `;

    const [allAssessments, subAssessments] = await Promise.all([
        batchedIn(
            supabase, 't_kpi_assessments', mainFields, 'employee_id', empIds,
            q => q.eq('period', period).is('sub_indicator_id', null).eq('revenue_type', revenueType)
        ),
        batchedIn(
            supabase, 't_kpi_assessments', subFields, 'employee_id', empIds,
            q => q.eq('period', period).not('sub_indicator_id', 'is', null).eq('revenue_type', revenueType)
        )
    ]);

    console.log(`Found ${allAssessments.length} UMUM main rows and ${subAssessments.length} UMUM sub rows`);

    const empsWithUmum = new Set([...allAssessments.map(x => x.employee_id), ...subAssessments.map(x => x.employee_id)]);
    const missingUmumIds = empIds.filter(id => !empsWithUmum.has(id));

    console.log(`Employees missing UMUM: ${missingUmumIds.length}`);

    if (missingUmumIds.length > 0) {
        console.log('Fetching BPJS fallback for missing...');
        const [bMain, bSub] = await Promise.all([
            batchedIn(
                supabase, 't_kpi_assessments', mainFields, 'employee_id', missingUmumIds,
                q => q.eq('period', period).is('sub_indicator_id', null).eq('revenue_type', 'bpjs')
            ),
            batchedIn(
                supabase, 't_kpi_assessments', subFields, 'employee_id', missingUmumIds,
                q => q.eq('period', period).not('sub_indicator_id', 'is', null).eq('revenue_type', 'bpjs')
            )
        ]);
        allAssessments.push(...bMain);
        subAssessments.push(...bSub);
        console.log(`Added ${bMain.length} BPJS main and ${bSub.length} BPJS sub as fallback`);
    }

    const subScoreMap = new Map();
    for (const sub of subAssessments) {
        const key = `${sub.employee_id}:${sub.indicator_id}`;
        const existing = subScoreMap.get(key) || { score: 0, realization: 0 };

        let effectiveScore = Number(sub.score || 0);
        const mType = sub.m_kpi_sub_indicators?.measurement_type;

        if (mType === 'quantitative') {
            const tariff = Number(sub.m_kpi_sub_indicators?.base_index_value || 1);
            const realScore = Number(sub.realization_value || 0) * tariff;
            if (realScore > 0 && effectiveScore !== realScore && tariff > 1) {
                effectiveScore = realScore;
            }
        } else {
            const weight = Number(sub.m_kpi_sub_indicators?.weight_percentage || 0);
            if (effectiveScore === 0 && Number(sub.realization_value) > 0) {
                effectiveScore = Number(sub.realization_value) * (weight > 0 ? (weight / 100) : 1);
            }
        }
        existing.score += effectiveScore;
        existing.realization += Number(sub.realization_value || 0);
        subScoreMap.set(key, existing);
    }

    for (const emp of allEmployees) {
        const eMain = allAssessments.filter(a => a.employee_id === emp.id);

        const calcCat = (targetCat) => {
            const matches = eMain.filter(a => {
                const c = (a.m_kpi_indicators?.m_kpi_categories?.category || '').trim().toUpperCase();
                return c === targetCat || c.startsWith(targetCat);
            });

            let indexScore = 0;
            for (const a of matches) {
                const rawScore = a.score;
                const basicVal = parseFloat(a.m_kpi_indicators?.base_index_value) || 0;
                const indRealization = parseFloat(a.realization_value) || 0;
                const indTarget = parseFloat(a.m_kpi_indicators?.target_value) || 0;
                const indWeight = parseFloat(a.weight_percentage) || parseFloat(a.m_kpi_indicators?.weight_percentage) || 0;
                const isActivity = a.m_kpi_indicators?.calculation_method === 'priority';

                let effectiveScore = 0;
                const subAgg = subScoreMap.get(`${emp.id}:${a.indicator_id}`);
                if (subAgg !== undefined) {
                    effectiveScore = subAgg.score;
                } else if (rawScore !== null && rawScore !== undefined && parseFloat(rawScore) >= 0) {
                    if (isActivity && basicVal > 1 && parseFloat(rawScore) === indRealization) {
                        effectiveScore = indRealization * basicVal;
                    } else {
                        effectiveScore = parseFloat(rawScore);
                        if (effectiveScore === 0 && indRealization > 0) {
                            if (indTarget === 0) {
                                effectiveScore = indRealization * (indWeight > 0 ? (indWeight / 100) : 1);
                            }
                        }
                    }
                } else if (basicVal > 1) {
                    effectiveScore = indRealization * basicVal;
                } else if (indTarget > 0) {
                    const achPct = Math.min(100, (indRealization / indTarget) * 100);
                    effectiveScore = indWeight > 0 ? (achPct * indWeight) / 100 : achPct;
                } else {
                    effectiveScore = indRealization;
                }
                if (!isActivity) indexScore += effectiveScore;
            }
            return indexScore;
        };

        const p1 = calcCat('P1');
        console.log(`[${emp.full_name}] P1 = ${p1}`);
    }
}
main().catch(console.error);
