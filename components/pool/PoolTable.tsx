'use client'

import { Button } from '@/components/ui/button'
import { Eye, Check, Printer, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { exportPoolReportToPDF } from '@/app/(authenticated)/pool/actions'
import { useState } from 'react'

interface Pool {
  id: string
  period: string
  revenue_bpjs?: number
  revenue_umum?: number
  allocation_percentage_bpjs?: number
  allocation_percentage_umum?: number
  allocated_bpjs?: number
  allocated_umum?: number
  revenue_total: number
  deduction_total: number
  net_pool: number | null
  allocated_amount: number | null
  status: 'draft' | 'approved' | 'distributed'
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

interface PoolTableProps {
  pools: Pool[]
  onView: (pool: Pool) => void
  onApprove: (poolId: string) => void
  userRole?: string | null
}

export default function PoolTable({ pools, onView, onApprove, userRole }: PoolTableProps) {
  const [printingId, setPrintingId] = useState<string | null>(null)

  async function handlePrint(pool: Pool) {
    setPrintingId(pool.id)
    try {
      const result = await exportPoolReportToPDF(pool.id)
      if (result.success && result.data) {
        const linkSource = `data:application/pdf;base64,${result.data}`
        const downloadLink = document.createElement('a')
        downloadLink.href = linkSource
        downloadLink.download = result.filename || `Pool_${pool.period}.pdf`
        downloadLink.click()
      } else {
        alert('Gagal mengunduh PDF: ' + result.error)
      }
    } catch (error) {
      console.error('Print error:', error)
      alert('Terjadi kesalahan saat mencetak')
    } finally {
      setPrintingId(null)
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      draft: 'bg-slate-100 text-slate-800 border-slate-200',
      approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      distributed: 'bg-blue-50 text-blue-800 border-blue-200'
    }

    const labels = {
      draft: 'Draft',
      approved: 'Disetujui',
      distributed: 'Terdistribusi'
    }

    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (pools.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Belum ada pool yang dibuat.</p>
        <p className="text-sm mt-2">Klik "Buat Pool Pendapatan" untuk membuat pool pendapatan baru.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-slate-50/80 text-slate-600 uppercase font-black tracking-wider text-[11px]">
            <th className="text-left p-3">Periode</th>
            <th className="text-left p-3">Status</th>
            <th className="text-right p-3 text-emerald-700">BPJS Kesehatan (BPJS)</th>
            <th className="text-right p-3 text-blue-700">Pendapatan Umum (UMUM)</th>
            <th className="text-right p-3">Total Pendapatan</th>
            <th className="text-right p-3 text-amber-700">Total Potongan</th>
            <th className="text-right p-3">Pool Bersih</th>
            <th className="text-right p-3 text-emerald-700">Total Dialokasikan</th>
            <th className="text-center p-3">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {pools.map(pool => {
            const pBpjs = pool.allocation_percentage_bpjs ?? 100
            const pUmum = pool.allocation_percentage_umum ?? 100
            const allocBpjs = pool.allocated_bpjs ?? ((pool.revenue_bpjs || 0) * pBpjs / 100)
            const allocUmum = pool.allocated_umum ?? ((pool.revenue_umum || 0) * pUmum / 100)
            const totalAlloc = pool.allocated_amount ?? (allocBpjs + allocUmum)

            return (
              <tr key={pool.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 font-bold text-slate-800 text-sm">{pool.period}</td>
                <td className="p-3">{getStatusBadge(pool.status)}</td>
                <td className="p-3 text-right font-semibold text-emerald-700">
                  <div>{formatCurrency(pool.revenue_bpjs || 0)}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Alokasi ({pBpjs}%): {formatCurrency(allocBpjs)}</div>
                </td>
                <td className="p-3 text-right font-semibold text-blue-700">
                  <div>{formatCurrency(pool.revenue_umum || 0)}</div>
                  <div className="text-[10px] text-blue-600 font-medium">Alokasi ({pUmum}%): {formatCurrency(allocUmum)}</div>
                </td>
                <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(pool.revenue_total)}</td>
                <td className="p-3 text-right font-semibold text-amber-700">{formatCurrency(pool.deduction_total)}</td>
                <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(pool.net_pool || 0)}</td>
                <td className="p-3 text-right font-black text-emerald-600 text-sm">
                  {formatCurrency(totalAlloc)}
                </td>
                <td className="p-3">
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(pool)}
                      className="rounded-lg h-8 text-[11px] font-bold uppercase tracking-tight"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                      Detail
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrint(pool)}
                      disabled={printingId === pool.id}
                      className="rounded-lg h-8 text-[11px] font-bold uppercase tracking-tight border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      {printingId === pool.id ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Cetak
                    </Button>
                    {pool.status === 'draft' && userRole === 'superadmin' && (
                      <Button
                        size="sm"
                        onClick={() => onApprove(pool.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 text-[11px] font-bold uppercase tracking-tight shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Setujui
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
