import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function batchedIn(client, table, selectFields, filterColumn, filterValues, additionalFilters, batchSize = 20) {
    if (filterValues.length === 0) return [];
    const results = [];
    const pageSize = 1000;

    for (let i = 0; i < filterValues.length; i += batchSize) {
        const batch = filterValues.slice(i, i + batchSize);
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            let query = client.from(table).select(selectFields).in(filterColumn, batch).range(from, to);
            if (additionalFilters) query = additionalFilters(query);

            const { data, error } = await query;
            if (error) throw error;

            if (data && data.length > 0) {
                results.push(...data);
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }
    }
    return results;
}

async function run() {
    const period = '2026-08';
    const revenueType = 'bpjs';

    const { data: allEmployees } = await supabase
        .from('m_employees')
        .select('*, m_units!m_employees_unit_id_fkey(id, name, code, kpi_schema_mode)')
        .eq('is_active', true);

    const empIds = allEmployees.map(e => e.id);

    const mainSelectFields = `
    id,
    employee_id,
    indicator_id,
    score,
    achievement_percentage,
    realization_value,
    created_at,
    updated_at,
    target_value,
    revenue_type,
    m_kpi_indicators (
      id,
      name,
      weight_percentage,
      base_index_value,
      target_value,
      calculation_method,
      m_kpi_categories (
        category,
        weight_percentage,
        configuration_style,
        is_weighted
      )
    )
  `;

    let [allAssessments, subAssessments] = await Promise.all([
        batchedIn(
            supabase,
            't_kpi_assessments',
            mainSelectFields,
            'employee_id',
            empIds,
            q => q.eq('period', period).is('sub_indicator_id', null).eq('revenue_type', revenueType)
        ),
        batchedIn(
            supabase,
            't_kpi_assessments',
            'employee_id, indicator_id, score, realization_value, sub_indicator_id, revenue_type, m_kpi_sub_indicators (id, measurement_type, base_index_value, weight_percentage)',
            'employee_id',
            empIds,
            q => q.eq('period', period).not('sub_indicator_id', 'is', null).eq('revenue_type', revenueType)
        )
    ]);

    const oppositeRevenue = revenueType === 'bpjs' ? 'umum' : 'bpjs';
    const [oppositeMain, oppositeSub] = await Promise.all([
        batchedIn(
            supabase,
            't_kpi_assessments',
            mainSelectFields,
            'employee_id',
            empIds,
            q => q.eq('period', period).is('sub_indicator_id', null).eq('revenue_type', oppositeRevenue)
        ),
        batchedIn(
            supabase,
            't_kpi_assessments',
            'employee_id, indicator_id, score, realization_value, sub_indicator_id, revenue_type, m_kpi_sub_indicators (id, measurement_type, base_index_value, weight_percentage)',
            'employee_id',
            empIds,
            q => q.eq('period', period).not('sub_indicator_id', 'is', null).eq('revenue_type', oppositeRevenue)
        )
    ]);

    for (const opp of oppositeMain) {
        const key = `${opp.employee_id}:${opp.indicator_id}`;
        const existingIdx = allAssessments.findIndex(a => `${a.employee_id}:${a.indicator_id}` === key);
        if (existingIdx === -1) {
            allAssessments.push(opp);
        } else if (Number(allAssessments[existingIdx].realization_value || 0) === 0 && Number(opp.realization_value || 0) !== 0) {
            allAssessments[existingIdx] = opp;
        }
    }

    for (const oppSub of oppositeSub) {
        const key = `${oppSub.employee_id}:${oppSub.indicator_id}:${oppSub.sub_indicator_id}`;
        const existingIdx = subAssessments.findIndex(a => `${a.employee_id}:${a.indicator_id}:${a.sub_indicator_id}` === key);
        if (existingIdx === -1) {
            subAssessments.push(oppSub);
        } else if (Number(subAssessments[existingIdx].realization_value || 0) === 0 && Number(oppSub.realization_value || 0) !== 0) {
            subAssessments[existingIdx] = oppSub;
        }
    }

    const { data: activeCategories } = await supabase.from('m_kpi_categories').select('id, unit_id, revenue_type').eq('is_active', true);
    const { data: activeIndicators } = await supabase.from('m_kpi_indicators').select('id, category_id').eq('is_active', true);
    const activeCategoryMap = new Map((activeCategories || []).map(c => [c.id, c]));

    const getActiveIndicatorSet = (unitId, schemaMode, targetRevenueType) => {
        const validIds = new Set();
        const isDiff = schemaMode === 'different';
        (activeIndicators || []).forEach(ind => {
            const cat = activeCategoryMap.get(ind.category_id);
            if (cat && cat.unit_id === unitId) {
                if (isDiff) {
                    if (targetRevenueType === 'umum' && (cat.revenue_type === 'umum' || cat.revenue_type === 'all' || !cat.revenue_type)) validIds.add(ind.id);
                    if (targetRevenueType === 'bpjs' && (cat.revenue_type === 'bpjs' || cat.revenue_type === 'all' || !cat.revenue_type)) validIds.add(ind.id);
                } else {
                    validIds.add(ind.id);
                }
            }
        });
        return validIds;
    };

    const empUnitMap = new Map();
    for (const emp of allEmployees) {
        const unitData = Array.isArray(emp.m_units) ? emp.m_units[0] : emp.m_units;
        if (unitData?.id) {
            empUnitMap.set(emp.id, { unitId: unitData.id, schemaMode: unitData.kpi_schema_mode });
        }
    }

    allAssessments = allAssessments.filter((a) => {
        const info = empUnitMap.get(a.employee_id);
        if (!info) return true;
        const isPriority = a.m_kpi_indicators?.calculation_method === 'priority';
        const hasRealization = Math.abs(Number(a.realization_value || 0)) > 0;
        if (isPriority || hasRealization) return true;
        const validSet = getActiveIndicatorSet(info.unitId, info.schemaMode, a.revenue_type || revenueType);
        return validSet.size === 0 || validSet.has(a.indicator_id);
    });

    subAssessments = subAssessments.filter((s) => {
        const info = empUnitMap.get(s.employee_id);
        if (!info) return true;
        const isPriority = s.m_kpi_sub_indicators?.measurement_type === 'quantitative' || Math.abs(Number(s.realization_value || 0)) > 0;
        if (isPriority) return true;
        const validSet = getActiveIndicatorSet(info.unitId, info.schemaMode, s.revenue_type || revenueType);
        return validSet.size === 0 || validSet.has(s.indicator_id);
    });

    const subScoreMap = new Map();
    for (const sub of subAssessments) {
        const key = `${sub.employee_id}:${sub.indicator_id}`;
        let effectiveScore = Number(sub.score || 0);
        const measurementType = sub.m_kpi_sub_indicators?.measurement_type;

        if (measurementType === 'quantitative') {
            const tariff = Number(sub.m_kpi_sub_indicators?.base_index_value || 1);
            const realScore = Number(sub.realization_value || 0) * tariff;
            if (Math.abs(realScore) > 0 && effectiveScore !== realScore && Math.abs(tariff) > 1) {
                effectiveScore = realScore;
            }
            if (effectiveScore === 0 && Math.abs(realScore) > 0) {
                effectiveScore = realScore;
            }
        } else {
            const weight = Number(sub.m_kpi_sub_indicators?.weight_percentage || 0);
            const mainAsses = allAssessments?.find(a => a.employee_id === sub.employee_id && a.indicator_id === sub.indicator_id);
            const isPriority = mainAsses?.m_kpi_indicators?.calculation_method === 'priority';

            if (effectiveScore === 0 && Math.abs(Number(sub.realization_value)) > 0) {
                if (isPriority) {
                    const subBase = Number(sub.m_kpi_sub_indicators?.base_index_value || 0);
                    const mainBase = Number(mainAsses?.m_kpi_indicators?.base_index_value || 0);
                    const baseIndex = subBase !== 0 ? subBase : (mainBase !== 0 ? mainBase : 1);
                    effectiveScore = Number(sub.realization_value) * baseIndex;
                } else {
                    effectiveScore = Number(sub.realization_value) * (weight / 100);
                }
            }
        }

        const existing = subScoreMap.get(key);
        if (existing) {
            existing.score += effectiveScore;
            existing.realization += Number(sub.realization_value || 0);
        } else {
            subScoreMap.set(key, {
                score: effectiveScore,
                realization: Number(sub.realization_value || 0)
            });
        }
    }

    const sakdiyah = allEmployees.find(e => e.employee_code === 'PEG004');
    console.log('Sakdiyah ID:', sakdiyah?.id);
    const dummySet = getActiveIndicatorSet('f7d5cbec-b7ed-4e53-8ae6-6e915bc99d93', 'same', 'bpjs');
    console.log('Dummy set KASI count: ', dummySet.size);

    if (sakdiyah) {
        const sakAsses = allAssessments.filter(a => a.employee_id === sakdiyah.id);
        console.log(`Sakdiyah main assessments after filters: ${sakAsses.length}`);
        for (const a of sakAsses) {
            console.log(`Main Asses: Ind:${a.m_kpi_indicators?.name} Cat:${a.m_kpi_indicators?.m_kpi_categories?.category}`);
        }

        let totalDeductionRupiah = 0;
        const calcCategoryScore = (categoryName) => {
            const targetCat = categoryName.trim().toUpperCase();
            const catAssessments = sakAsses.filter(a => {
                const cat = (a.m_kpi_indicators?.m_kpi_categories?.category || '').trim().toUpperCase();
                return cat === targetCat || cat.startsWith(targetCat);
            });
            console.log(`\nSakdiyah Category ${targetCat} count:`, catAssessments.length);

            for (const a of catAssessments) {
                const indRealization = parseFloat(a.realization_value) || 0;
                const basicVal = parseFloat(a.m_kpi_indicators?.base_index_value) || 0;
                const rawScore = a.score;
                const calcMethod = a.m_kpi_indicators?.calculation_method || 'indexing';
                const isPriority = calcMethod === 'priority';
                const isActivity = isPriority;

                let effectiveScore;
                const subKey = `${sakdiyah.id}:${a.indicator_id}`;
                const subAgg = subScoreMap.get(subKey);

                if (subAgg !== undefined) {
                    effectiveScore = subAgg.score;
                    console.log(`- Ind '${a.m_kpi_indicators?.name}': got subAgg.score = ${effectiveScore}`);
                } else if (isActivity) {
                    effectiveScore = indRealization * basicVal;
                    console.log(`- Ind '${a.m_kpi_indicators?.name}': uses indReal*basicVal = ${effectiveScore}`);
                } else if (rawScore !== null && rawScore !== undefined && !isNaN(parseFloat(rawScore))) {
                    effectiveScore = parseFloat(rawScore);
                    console.log(`- Ind '${a.m_kpi_indicators?.name}': uses rawScore = ${effectiveScore}`);
                } else {
                    effectiveScore = indRealization * basicVal;
                    console.log(`- Ind '${a.m_kpi_indicators?.name}': uses final fallback = ${effectiveScore}`);
                }

                if (effectiveScore < 0) {
                    totalDeductionRupiah += Math.abs(effectiveScore);
                }
            }
        };

        calcCategoryScore('P1');
        calcCategoryScore('P2');
        calcCategoryScore('P3');

        console.log(`\nSakdiyah Total Deduction Rupiah calculated: ${totalDeductionRupiah}`);
    }
}

run();
