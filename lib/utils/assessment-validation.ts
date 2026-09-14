/**
 * Assessment validation utilities
 * These are pure functions that don't need server actions
 */

export interface AssessmentInput {
  employee_id: string
  indicator_id: string
  period: string
  realization_value: number
  target_value: number
  weight_percentage: number
  notes?: string
  assessor_id: string
}

/**
 * Calculate achievement percentage based on realization and target values
 */
export function calculateAchievementPercentage(
  realizationValue: number,
  targetValue: number
): number {
  if (targetValue <= 0) return 0
  return Math.round((realizationValue / targetValue) * 100 * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate score based on achievement percentage
 */
export function calculateScore(achievementPercentage: number): number {
  if (achievementPercentage >= 100) return 100
  return Math.max(0, achievementPercentage)
}

/**
 * Validate assessment input data
 */
export function validateAssessmentInput(input: Partial<AssessmentInput>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Required fields validation
  if (!input.employee_id) {
    errors.push('Employee ID is required')
  }

  if (!input.indicator_id) {
    errors.push('Indicator ID is required')
  }

  if (!input.period) {
    errors.push('Period is required')
  } else if (!/^\d{4}-\d{2}$/.test(input.period)) {
    errors.push('Period must be in YYYY-MM format')
  }

  if (input.realization_value === undefined || input.realization_value === null) {
    errors.push('Realization value is required')
  } else if (input.realization_value < 0) {
    errors.push('Realization value cannot be negative')
  }

  if (!input.target_value || input.target_value <= 0) {
    errors.push('Target value must be greater than 0')
  }

  if (!input.weight_percentage || input.weight_percentage <= 0 || input.weight_percentage > 100) {
    errors.push('Weight percentage must be between 0 and 100')
  }

  if (!input.assessor_id) {
    errors.push('Assessor ID is required')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}