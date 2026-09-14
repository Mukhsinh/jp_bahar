import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

/**
 * Generate and download import template
 * Requirement 16.6: Template with headers, sample data, and instructions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type') || 'realization'

    const supabase = await createClient()

    // Create workbook
    const wb = XLSX.utils.book_new()

    if (templateType === 'realization') {
      // Get sample employee
      const { data: employees } = await supabase
        .from('m_employees')
        .select('id, employee_code, full_name')
        .eq('is_active', true)
        .limit(1)

      // Get sample indicator
      const { data: indicators } = await supabase
        .from('m_kpi_indicators')
        .select('id, code, name, target_value')
        .eq('is_active', true)
        .limit(1)

      const sampleEmployee = employees?.[0]
      const sampleIndicator = indicators?.[0]

      // Data sheet with headers and sample
      const dataHeaders = [
        'employee_id',
        'period',
        'indicator_id',
        'realization_value',
        'notes',
      ]

      const sampleData = sampleEmployee && sampleIndicator
        ? [
            sampleEmployee.id,
            '2026-03',
            sampleIndicator.id,
            sampleIndicator.target_value * 0.95, // 95% of target as example
            'Sample data - replace with actual values',
          ]
        : ['', '2026-03', '', '', 'Fill in your data here']

      const wsData = [dataHeaders, sampleData]
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Set column widths
      ws['!cols'] = [
        { wch: 40 }, // employee_id
        { wch: 10 }, // period
        { wch: 40 }, // indicator_id
        { wch: 18 }, // realization_value
        { wch: 30 }, // notes
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Realization Data')

      // Instructions sheet
      const instructions = [
        ['REALIZATION DATA IMPORT TEMPLATE'],
        [''],
        ['Instructions:'],
        ['1. Fill in the employee_id column with valid employee UUID'],
        ['2. Fill in the period column in YYYY-MM format (e.g., 2026-03)'],
        ['3. Fill in the indicator_id column with valid indicator UUID'],
        ['4. Fill in the realization_value column with numeric values'],
        ['5. Notes column is optional'],
        [''],
        ['Column Descriptions:'],
        ['- employee_id: UUID of the employee (required)'],
        ['- period: Period in YYYY-MM format (required)'],
        ['- indicator_id: UUID of the KPI indicator (required)'],
        ['- realization_value: Numeric value of achievement (required)'],
        ['- notes: Optional notes or comments'],
        [''],
        ['Tips:'],
        ['- You can get employee IDs from the employee management page'],
        ['- You can get indicator IDs from the KPI configuration page'],
        ['- Make sure all required fields are filled'],
        ['- The system will calculate achievement percentage automatically'],
        [''],
        ['Sample Data:'],
        sampleEmployee && sampleIndicator
          ? [
              `Employee: ${sampleEmployee.full_name} (${sampleEmployee.employee_code})`,
              `Indicator: ${sampleIndicator.name} (${sampleIndicator.code})`,
              `Target: ${sampleIndicator.target_value}`,
            ]
          : ['No sample data available - please check your database'],
      ]

      const wsInstructions = XLSX.utils.aoa_to_sheet(instructions)
      wsInstructions['!cols'] = [{ wch: 80 }]
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')
    } else if (templateType === 'employee') {
      // Employee data template
      const dataHeaders = [
        'employee_code',
        'full_name',
        'email',
        'unit_id',
        'role',
        'tax_status',
      ]

      const sampleData = [
        'EMP001',
        'John Doe',
        'john.doe@example.com',
        '',
        'employee',
        'TK/0',
      ]

      const wsData = [dataHeaders, sampleData]
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      ws['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 30 },
        { wch: 40 },
        { wch: 15 },
        { wch: 10 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Employee Data')

      // Instructions
      const instructions = [
        ['EMPLOYEE DATA IMPORT TEMPLATE'],
        [''],
        ['Instructions:'],
        ['1. Fill in all required fields'],
        ['2. Role must be: superadmin, unit_manager, or employee'],
        ['3. Tax status must be: TK/0, TK/1, TK/2, TK/3, K/0, K/1, K/2, or K/3'],
        ['4. Email must be unique'],
        ['5. Employee code must be unique'],
      ]

      const wsInstructions = XLSX.utils.aoa_to_sheet(instructions)
      wsInstructions['!cols'] = [{ wch: 80 }]
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')
    }

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${templateType}-import-template.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
