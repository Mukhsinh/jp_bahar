const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    try {
        const { data: emps } = await supabase
            .from('m_employees')
            .select('id, full_name, unit_id, m_units(id, name, kpi_schema_mode)')
            .ilike('full_name', '%ENDARWAN%');

        console.log('=== EMPLOYEE INFO ===');
        console.log(emps);

        if (!emps || emps.length === 0) return;
        const empId = emps[0].id;
        const unitId = emps[0].unit_id;

        console.log('=== UNIT CATEGORIES & INDICATORS ===');
        const { data: categories } = await supabase
            .from('m_kpi_categories')
            .select('id, category, category_name, revenue_type, is_weighted, m_kpi_indicators(id, code, name, calculation_method, base_index_value, target_value, weight_percentage, m_kpi_sub_indicators(id, code, name, base_index_value, target_value, measurement_type))')
            .eq('unit_id', unitId);

        categories.forEach(cat => {
            console.log(`Cat: ${cat.category} (${cat.category_name}), rev: ${cat.revenue_type}, weighted: ${cat.is_weighted}`);
            cat.m_kpi_indicators.forEach(ind => {
                console.log(`  Ind [${ind.id}]: code=${ind.code}, name=${ind.name}, calcMethod=${ind.calculation_method}, baseIndex=${ind.base_index_value}, target=${ind.target_value}`);
                if (ind.m_kpi_sub_indicators) {
                    ind.m_kpi_sub_indicators.forEach(sub => {
                        console.log(`    Sub [${sub.id}]: code=${sub.code}, name=${sub.name}, type=${sub.measurement_type}, baseIndex=${sub.base_index_value}`);
                    });
                }
            });
        });

        console.log('\n=== ASSESSMENTS FOR ENDARWAN ===');
        const { data: assessments } = await supabase
            .from('t_kpi_assessments')
            .select('*')
            .eq('employee_id', empId);

        assessments.forEach(a => {
            console.log(`Ass [${a.id}]: period=${a.period}, rev=${a.revenue_type}, ind_id=${a.indicator_id}, sub_id=${a.sub_indicator_id}, real=${a.realization_value}, target=${a.target_value}, score=${a.score}, ach=${a.achievement_percentage}`);
        });

    } catch (err) {
        console.error(err);
    }
}

inspect();
