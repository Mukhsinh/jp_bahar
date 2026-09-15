import { NextRequest, NextResponse } from 'next/server'
import { generateSystemGuide } from '@/lib/export/guide-generator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId') || undefined
    const revenueType = searchParams.get('revenueType') || 'all'

    // Generate the comprehensive system guide with revenue type filter
    const pdfBuffer = await generateSystemGuide(unitId, revenueType)

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    const revTag = revenueType === 'bpjs' ? '_BPJS' : revenueType === 'umum' ? '_UMUM' : ''
    const filename = unitId
      ? `Petunjuk_KPI_Unit_${unitId}${revTag}_${new Date().toISOString().split('T')[0]}.pdf`
      : `Panduan_Sistem_JASPEL${revTag}_${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error('Error generating system guide:', error)
    return NextResponse.json(
      { error: 'Gagal menghasilkan panduan sistem' },
      { status: 500 }
    )
  }
}
