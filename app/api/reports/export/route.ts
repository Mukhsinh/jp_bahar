import { NextRequest, NextResponse } from 'next/server'
import { exportToExcel } from '@/lib/export/excel-export'
import { exportToPDF } from '@/lib/export/pdf-export'

/**
 * Export reports to Excel or PDF
 * Precision: 2 decimals in PDF and Excel
 */
export async function POST(request: NextRequest) {
  try {
    const { reportType, period, format, data, revenueType, isBreakdown } = await request.json()

    if (!reportType || !period || !format || !data) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    let buffer: Buffer | Uint8Array
    let contentType: string
    let filename: string

    const filePrefix = isBreakdown ? `${reportType}-breakdown` : reportType

    if (format === 'excel') {
      buffer = await exportToExcel({
        reportType,
        period,
        data,
        revenueType,
        isBreakdown: Boolean(isBreakdown),
      })
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `${filePrefix}-${period}.xlsx`
    } else if (format === 'pdf') {
      buffer = await exportToPDF({
        reportType,
        period,
        data,
        revenueType,
        isBreakdown: Boolean(isBreakdown),
      })
      contentType = 'application/pdf'
      filename = `${filePrefix}-${period}.pdf`
    } else {
      return NextResponse.json(
        { error: 'Invalid format' },
        { status: 400 }
      )
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
