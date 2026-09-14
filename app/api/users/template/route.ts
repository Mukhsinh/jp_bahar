import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated and is superadmin
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }
    
    const userRole = authUser.user_metadata?.role
    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { error: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }
    
    // Get units for reference
    const { data: units } = await supabase
      .from('m_units')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    // Create template data
    const templateData = [
      {
        'Kode Pegawai': 'P001',
        'Nama Lengkap': 'John Doe',
        'Email': 'john.doe@example.com',
        'Password': 'password123',
        'Peran': 'employee',
        'Unit ID': units?.[0]?.id || '',
        'Status Pajak': 'TK/0'
      },
      {
        'Kode Pegawai': 'P002',
        'Nama Lengkap': 'Jane Smith',
        'Email': 'jane.smith@example.com',
        'Password': 'password456',
        'Peran': 'unit_manager',
        'Unit ID': units?.[0]?.id || '',
        'Status Pajak': 'K/1'
      }
    ]
    
    // Create reference sheet for units
    const unitsData = units?.map(u => ({
      'Unit ID': u.id,
      'Nama Unit': u.name
    })) || []
    
    // Create reference sheet for roles
    const rolesData = [
      { 'Kode Peran': 'superadmin', 'Nama Peran': 'Superadmin' },
      { 'Kode Peran': 'unit_manager', 'Nama Peran': 'Manajer Unit' },
      { 'Kode Peran': 'employee', 'Nama Peran': 'Pegawai' }
    ]
    
    // Create reference sheet for tax status
    const taxStatusData = [
      { 'Kode': 'TK/0', 'Keterangan': 'Tidak Kawin, 0 Tanggungan' },
      { 'Kode': 'TK/1', 'Keterangan': 'Tidak Kawin, 1 Tanggungan' },
      { 'Kode': 'K/0', 'Keterangan': 'Kawin, 0 Tanggungan' },
      { 'Kode': 'K/1', 'Keterangan': 'Kawin, 1 Tanggungan' },
      { 'Kode': 'K/2', 'Keterangan': 'Kawin, 2 Tanggungan' },
      { 'Kode': 'K/3', 'Keterangan': 'Kawin, 3 Tanggungan' }
    ]
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Add template sheet
    const ws1 = XLSX.utils.json_to_sheet(templateData)
    XLSX.utils.book_append_sheet(wb, ws1, 'Template')
    
    // Add reference sheets
    const ws2 = XLSX.utils.json_to_sheet(unitsData)
    XLSX.utils.book_append_sheet(wb, ws2, 'Referensi Unit')
    
    const ws3 = XLSX.utils.json_to_sheet(rolesData)
    XLSX.utils.book_append_sheet(wb, ws3, 'Referensi Peran')
    
    const ws4 = XLSX.utils.json_to_sheet(taxStatusData)
    XLSX.utils.book_append_sheet(wb, ws4, 'Referensi Status Pajak')
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=template-pengguna.xlsx'
      }
    })
  } catch (error: any) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
