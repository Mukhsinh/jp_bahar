/**
 * KPI Assessment Sync & Resolution Service
 * Dedicated service module encapsulating shared business logic between
 * /assessment and /reports modules to guarantee data synchronization
 * and consistency without altering any formulas or UI.
 */

export interface SubIndicatorDef {
    id: string;
    code?: string;
    name?: string;
    base_index_value?: number;
    measurement_type?: string;
    weight_percentage?: number;
    target_value?: number;
}

export interface IndicatorDef {
    id: string;
    code?: string;
    name?: string;
    calculation_method?: string;
    base_index_value?: number;
    sub_indicators?: SubIndicatorDef[];
}

export interface SubAssessmentRow {
    id?: string;
    sub_indicator_id: string;
    realization_value: number;
    score?: number;
}

/**
 * Resolves the score or Rupiah value for a priority/quantitative sub-assessment.
 * Formula remains 100% exact: realization_value * base_index_value (fallback to score if valid).
 */
export function resolveSubAssessmentScore(
    subAssessment: SubAssessmentRow,
    subDef?: SubIndicatorDef
): number {
    const real = subAssessment.realization_value || 0;
    const tariff = parseFloat(subDef?.base_index_value?.toString() || '1') || 1;

    if (subAssessment.score !== undefined && subAssessment.score !== null && subAssessment.score !== 0) {
        if (Math.abs(subAssessment.score) > 1000000000 && Math.abs(real) <= 100000000) {
            return (Math.abs(real) > 1000 && Math.abs(tariff) > 1000) ? real : real * tariff;
        }
        return subAssessment.score;
    }

    if (Math.abs(real) > 1000 && Math.abs(tariff) > 1000) {
        return real;
    }

    return real * tariff;
}

/**
 * Filters out sub-assessments whose sub_indicator_id is not active or present in active indicators.
 */
export function filterActiveSubAssessments<T extends SubAssessmentRow>(
    subAssessments: T[],
    activeSubIndicators: SubIndicatorDef[]
): T[] {
    const validIds = new Set(activeSubIndicators.map(s => s.id));
    return subAssessments.filter(sa => validIds.has(sa.sub_indicator_id));
}

/**
 * Maps source sub-assessment rows to target sub-indicators based on sub-indicator code.
 * Used when copying assessments between BPJS and UMUM in 'different' schema mode.
 */
export function mapSubAssessmentsForCopy(
    sourceSubAssessments: SubAssessmentRow[],
    sourceSubIndicators: SubIndicatorDef[],
    targetSubIndicators: SubIndicatorDef[]
): { targetSubId: string; realizationValue: number }[] {
    const sourceCodeMap = new Map<string, string>();
    sourceSubIndicators.forEach(s => {
        if (s.code) sourceCodeMap.set(s.id, s.code);
    });

    const targetCodeToIdMap = new Map<string, string>();
    targetSubIndicators.forEach(t => {
        if (t.code) targetCodeToIdMap.set(t.code, t.id);
    });

    const mapped: { targetSubId: string; realizationValue: number }[] = [];

    for (const sa of sourceSubAssessments) {
        const sourceCode = sourceCodeMap.get(sa.sub_indicator_id);
        if (!sourceCode) continue;

        const targetSubId = targetCodeToIdMap.get(sourceCode);
        if (targetSubId) {
            mapped.push({
                targetSubId,
                realizationValue: sa.realization_value || 0
            });
        }
    }

    return mapped;
}
