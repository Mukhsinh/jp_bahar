const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function isMedicalUnit(unitId, unitName) {
    if (unitName && (unitName.toUpperCase().includes('MEDIS') || unitName.toUpperCase().includes('DOKTER'))) {
        return true;
    }
    return false;
}

async function run() {
    const period = '2026-08';
    const revenueType = 'bpjs';
    const unitId = '398d11b1-523d-478c-ac38-61caffb9fec0'; // MEDIS unit

    const { data: poolData } = await supabase
        .from('t_pool')
        .select('id, net_pool, allocated_bpjs, allocated_umum, revenue_bpjs, revenue_umum, revenue_total')
        .eq('period', period)
        .maybeSingle();

    let netPool = Number(poolData.revenue_bpjs || poolData.net_pool || 0);

    const { data: allEmployees } = await supabase
        .from('m_employees')
        .select('*, m_units(id, name, proportion_percentage, proportion_umum_percentage, use_same_proportion, kpi_schema_mode)')
        .eq('unit_id', unitId);

    const empIds = allEmployees.map(e => e.id);

    const { data: assessments } = await supabase
        .from('t_kpi_assessments')
        .select('*, m_kpi_indicators(name, calculation_method, base_index_value, m_kpi_categories(category, weight_percentage, is_weighted))')
        .eq('period', period)
        .is('sub_indicator_id', null)
        .in('employee_id', empIds);

    const { data: subAssessments } = await supabase
        .from('t_kpi_assessments')
        .select('*, m_kpi_sub_indicators(id, measurement_type, base_index_value, weight_percentage)')
        .eq('period', period)
        .not('sub_indicator_id', 'is', null)
        .in('employee_id', empIds);

    const subScoreMap = new Map();
    for (const sub of (subAssessments || [])) {
        const key = `${sub.employee_id}:${sub.indicator_id}`;
        let effectiveScore = Number(sub.score || 0);
        const measurementType = sub.m_kpi_sub_indicators?.measurement_type;
        if (measurementType === 'quantitative') {
            let tariffStr = String(sub.m_kpi_sub_indicators?.base_index_value || '1').replace(',', '.');
            const tariff = Number(tariffStr) || 1;
            let realVolStr = String(sub.realization_value || '0').replace(/\./g, '').replace(',', '.');
            const subRealization = Number(realVolStr) || 0;
            const realScore = subRealization * tariff;
            if (effectiveScore === 0 && Math.abs(realScore) > 0) {
                effectiveScore = realScore;
            }
        }
        const existing = subScoreMap.get(key);
        if (existing) {
            existing.score += effectiveScore;
        } else {
            subScoreMap.set(key, { score: effectiveScore });
        }
    }

    // Calculate scores per employee
    const empScores = [];
    let totalUnitScore = 0;
    let totalUnitActivityRupiah = 0;

    for (const emp of allEmployees) {
        const empAsses = assessments.filter(a => a.employee_id === emp.id);
        let empP1 = 0, empP2 = 0, empP3 = 0;
        let empActivityRupiah = 0;

        for (const a of empAsses) {
            const calcMethod = a.m_kpi_indicators?.calculation_method || 'indexing';
            const catName = (a.m_kpi_indicators?.m_kpi_categories?.category || '').trim().toUpperCase();
            const subKey = `${emp.id}:${a.indicator_id}`;
            const subAgg = subScoreMap.get(subKey);

            let effectiveScore = 0;
            if (subAgg !== undefined) {
                effectiveScore = subAgg.score;
            } else if (calcMethod === 'priority') {
                effectiveScore = Number(a.realization_value || 0) * Number(a.m_kpi_indicators?.base_index_value || 0);
            } else {
                effectiveScore = Number(a.realization_value || 0);
            }

            if (calcMethod === 'priority') {
                empActivityRupiah += effectiveScore;
            } else {
                if (catName.startsWith('P1')) empP1 += effectiveScore;
                else if (catName.startsWith('P2')) empP2 += effectiveScore;
                else if (catName.startsWith('P3')) empP3 += effectiveScore;
            }
        }

        const totalScore = empP1 + empP2 + empP3;
        empScores.push({ emp, empP1, empP2, empP3, totalScore, empActivityRupiah });
        totalUnitScore += totalScore;
        totalUnitActivityRupiah += empActivityRupiah;
    }

    const { data: masterDocs } = await supabase
        .from('remunerasi_master_dokter')
        .select('pagu_guarantee_fee')
        .eq('periode_id', period);

    const totalGuaranteeFee = masterDocs?.reduce((acc, d) => acc + Number(d.pagu_guarantee_fee || 0), 0) || 0;

    const unitProp = 20; // 20%
    const allocatedForUnit = netPool * (unitProp / 100);
    const sisaPaguMedis = allocatedForUnit - totalGuaranteeFee - totalUnitActivityRupiah;
    const pir = totalUnitScore > 0 ? (sisaPaguMedis / totalUnitScore) : 0;
    const roundedPir = Number(pir.toFixed(2));

    // Now calculate gross incentive per employee
    let sumGrossIncentiveUnroundedPir = 0;
    let sumGrossIncentiveRoundedPir = 0;

    const empDetails = [];

    for (const item of empScores) {
        const indexIncentiveUnrounded = item.totalScore * pir;
        const grossUnrounded = indexIncentiveUnrounded + item.empActivityRupiah;

        const indexIncentiveRounded = item.totalScore * roundedPir;
        const grossRounded = indexIncentiveRounded + item.empActivityRupiah;

        sumGrossIncentiveUnroundedPir += grossUnrounded;
        sumGrossIncentiveRoundedPir += grossRounded;

        empDetails.push({
            name: item.emp.full_name,
            totalScore: item.totalScore,
            empActivityRupiah: item.empActivityRupiah,
            indexIncentiveUnrounded,
            grossUnrounded,
            indexIncentiveRounded,
            grossRounded
        });
    }

    const output = {
        period,
        revenueType,
        netPool,
        unitProp,
        allocatedForUnit,
        totalGuaranteeFee,
        totalUnitActivityRupiah,
        sisaPaguMedis,
        totalUnitScore,
        pirExact: pir,
        pirRounded2Decimals: roundedPir,
        sumGrossIncentiveUnroundedPir,
        sumGrossIncentiveRoundedPir,
        differenceWithAllocated_ExactPIR: sumGrossIncentiveUnroundedPir - allocatedForUnit,
        differenceWithAllocated_RoundedPIR: sumGrossIncentiveRoundedPir - allocatedForUnit,
        empCount: allEmployees.length,
        empDetails
    };

    fs.writeFileSync('tmp_medis_simulation.json', JSON.stringify(output, null, 2));
    console.log('Done!');
    process.exit(0);
}

run();
