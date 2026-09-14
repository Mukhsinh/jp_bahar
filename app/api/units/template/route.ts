import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    // Create template data
    const templateData = [
      {
        'Kode Unit': 'IT',
        'Nama Unit': 'Information Technology',
        'Proporsi (%)': '25.00',
        'Status': 'Aktif'
      },
      {
        'Kode Unit': 'SALES',
        'Nama Unit': 'Sales & Marketing',
        'Proporsi (%)': '30.00',
        'Status': 'Aktif'
      }
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(templateData)

    // Set column widths
    ws['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 }
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Template Unit')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Template_Unit.xlsx"'
      }
    })
  } catch (error: any) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}
