import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

interface ValidationError {
  row: number
  field: string
  message: string
}

/**
 * Import realization data from Excel
 * Requirements: 16.3, 16.4, 16.5
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    // Validate data
    const errors: ValidationError[] = []
    const validRows: any[] = []

    const supabase = await createClient()

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i]
      const rowNumber = i + 2 // Excel row number (1-indexed + header)

      // Validate required columns (Requirement 16.3)
      if (!row.employee_id) {
        errors.push({
          row: rowNumber,
          field: 'employee_id',
          message: 'Employee ID is required',
        })
        continue
      }

      if (!row.period) {
        errors.push({
          row: rowNumber,
          field: 'period',
          message: 'Period is required',
        })
        continue
      }

      if (!row.indicator_id) {
        errors.push({
          row: rowNumber,
          field: 'indicator_id',
          message: 'Indicator ID is required',
        })
        continue
      }

      if (row.realization_value === undefined || row.realization_value === null) {
        errors.push({
          row: rowNumber,
          field: 'realization_value',
          message: 'Realization value is required',
        })
        continue
      }

      // Validate data types
      if (typeof row.realization_value !== 'number') {
        errors.push({
          row: rowNumber,
          field: 'realization_value',
          message: 'Realization value must be a number',
        })
        continue
      }

      // Validate period format (YYYY-MM)
      const periodRegex = /^\d{4}-\d{2}$/
      if (!periodRegex.test(row.period)) {
        errors.push({
          row: rowNumber,
          field: 'period',
          message: 'Period must be in YYYY-MM format',
        })
        continue
      }

      // Validate employee exists
      const { data: employee, error: empError } = await supabase
        .from('m_employees')
        .select('id')
        .eq('id', row.employee_id)
        .single()

      if (empError || !employee) {
        errors.push({
          row: rowNumber,
          field: 'employee_id',
          message: 'Employee not found',
        })
        continue
      }

      // Validate indicator exists
      const { data: indicator, error: indError } = await supabase
        .from('m_kpi_indicators')
        .select('id, target_value')
        .eq('id', row.indicator_id)
        .single()

      if (indError || !indicator) {
        errors.push({
          row: rowNumber,
          field: 'indicator_id',
          message: 'Indicator not found',
        })
        continue
      }

      // Calculate achievement percentage
      const achievementPercentage = (row.realization_value / indicator.target_value) * 100

      validRows.push({
        employee_id: row.employee_id,
        indicator_id: row.indicator_id,
        period: row.period,
        realization_value: row.realization_value,
        achievement_percentage: achievementPercentage,
        notes: row.notes || null,
      })
    }

    // If there are errors, return them (Requirement 16.4)
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        validCount: validRows.length,
        errorCount: errors.length,
      })
    }

    // Import valid rows
    const { error: insertError } = await supabase
      .from('t_realization')
      .upsert(validRows, {
        onConflict: 'employee_id,indicator_id,period',
      })

    if (insertError) {
      throw insertError
    }

    // Return success message (Requirement 16.5)
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${validRows.length} records`,
      importedCount: validRows.length,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
