/**
 * Medical Unit utilities
 * Single source of truth for identifying the "Medis" (Medical) unit.
 * Medical units use SUM-based scoring instead of weighted averages.
 */

export const MEDICAL_UNIT_ID = '8914356c-4ec8-4bd7-bc5e-5fb619f6c3f2'
export const MEDICAL_UNIT_NAME_KEYWORD = 'MEDIS'

/**
 * Determines if a unit is the Medical (Medis) unit.
 * @param unitId - The unit's UUID
 * @param unitName - The unit's display name
 */
export function isMedicalUnit(unitId?: string | null, unitName?: string | null): boolean {
    if (unitId && unitId === MEDICAL_UNIT_ID) return true

    if (unitName) {
        const upperName = unitName.toUpperCase().trim()

        if (upperName === MEDICAL_UNIT_NAME_KEYWORD) return true
        if (upperName.startsWith(MEDICAL_UNIT_NAME_KEYWORD + ' ')) return true
        if (upperName.includes('MEDIS') && !upperName.includes('REKAM MEDIS')) return true
        if (upperName.includes('DOKTER')) return true
        if (upperName.includes('SPESIALIS')) return true
    }

    return false
}
