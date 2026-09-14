/**
 * Centralized validation schemas to eliminate duplication
 * Uses Zod for consistent validation across the application
 */

import { z } from 'zod'

// Common validation patterns
export const percentageSchema = z.number().min(0).max(100)
export const uuidSchema = z.string().uuid()
export const periodSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM')

// User/Employee validation
export const employeeSchema = z.object({
  employee_code: z.string().min(1, 'Kode pegawai wajib diisi'),
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  unit_id: uuidSchema,
  role: z.enum(['superadmin', 'unit_manager', 'employee']),
  email: z.string().email('Format email tidak valid'),
  tax_status: z.enum(['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']).optional(),
  is_active: z.boolean().optional()
})

// Unit validation
export const unitSchema = z.object({
  code: z.string().min(1, 'Kode unit wajib diisi'),
  name: z.string().min(1, 'Nama unit wajib diisi'),
  proportion_percentage: percentageSchema,
  is_active: z.boolean().optional()
})

// KPI validation
export const kpiCategorySchema = z.object({
  unit_id: uuidSchema,
  category: z.enum(['P1', 'P2', 'P3']),
  category_name: z.string().min(1, 'Nama kategori wajib diisi'),
  weight_percentage: percentageSchema,
  description: z.string().optional(),
  is_active: z.boolean().optional()
})

export const kpiIndicatorSchema = z.object({
  category_id: uuidSchema,
  code: z.string().min(1, 'Kode indikator wajib diisi'),
  name: z.string().min(1, 'Nama indikator wajib diisi'),
  target_value: z.number().positive('Target harus lebih dari 0'),
  weight_percentage: percentageSchema,
  measurement_unit: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional()
})

// Pool validation
export const poolSchema = z.object({
  period: periodSchema,
  revenue_total: z.number().min(0, 'Total pendapatan tidak boleh negatif'),
  deduction_total: z.number().min(0, 'Total potongan tidak boleh negatif'),
  global_allocation_percentage: percentageSchema,
  status: z.enum(['draft', 'approved', 'distributed']).optional()
})

// Assessment validation
export const assessmentSchema = z.object({
  employee_id: uuidSchema,
  indicator_id: uuidSchema,
  period: periodSchema,
  realization_value: z.number().min(0, 'Nilai realisasi tidak boleh negatif'),
  target_value: z.number().positive('Target harus lebih dari 0'),
  weight_percentage: percentageSchema
})