'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Pencil, ShieldCheck, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label'

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
  global_allocation_percentage?: number
  allocated_amount: number | null
  status: 'draft' | 'approved' | 'distributed'
}

interface RevenueItem {
  id: string
  pool_id: string
  revenue_code: 'BPJS' | 'UMUM' | null
  revenue_type: 'BPJS Kesehatan' | 'Pendapatan Umum' | null
  description: string
  amount: number
  category: 'Rawat Jalan' | 'Rawat Inap' | 'AMHP' | 'Ambulance' | null
  patient_count: number | null
}

interface DeductionItem {
  id: string
  pool_id: string
  description: string
  amount: number
}

interface PoolDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pool: Pool | null
  onUpdate: () => void
  userRole?: string | null
}

export default function PoolDetailsDialog({
  open,
  onOpenChange,
  pool,
  onUpdate,
  userRole
}: PoolDetailsDialogProps) {
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([])
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Revenue form
  const [revenueForm, setRevenueForm] = useState({
    revenue_code: 'BPJS' as 'BPJS' | 'UMUM',
    revenue_type: 'BPJS Kesehatan' as 'BPJS Kesehatan' | 'Pendapatan Umum',
    description: '',
    amount: '',
    category: 'Rawat Jalan' as any,
    patient_count: ''
  })
  const [editingRevenue, setEditingRevenue] = useState<string | null>(null)

  // Deduction form
  const [deductionForm, setDeductionForm] = useState({ description: '', amount: '' })
  const [editingDeduction, setEditingDeduction] = useState<string | null>(null)

  // Separate allocations
  const [pctBpjs, setPctBpjs] = useState('100.00')
  const [pctUmum, setPctUmum] = useState('100.00')

  useEffect(() => {
    if (pool && open) {
      loadPoolItems()
      setPctBpjs((pool.allocation_percentage_bpjs ?? 100).toString())
      setPctUmum((pool.allocation_percentage_umum ?? 100).toString())
    }
  }, [pool, open])

  async function loadPoolItems() {
    if (!pool) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: revenueData, error: revenueError } = await supabase
        .from('t_pool_revenue')
        .select('*')
        .eq('pool_id', pool.id)
        .order('created_at')

      if (revenueError) throw revenueError
      setRevenueItems(revenueData || [])

      const { data: deductionData, error: deductionError } = await supabase
        .from('t_pool_deduction')
        .select('*')
        .eq('pool_id', pool.id)
        .order('created_at')

      if (deductionError) throw deductionError
      setDeductionItems(deductionData || [])
    } catch (error) {
      console.error('Error loading pool items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddRevenue() {
    if (!pool || !revenueForm.amount || (!revenueForm.description && !revenueForm.category)) return
    if (pool.status !== 'draft' || userRole !== 'superadmin') {
      alert('Anda tidak memiliki akses untuk mengubah data ini')
      return
    }

    const revCode = revenueForm.revenue_type === 'Pendapatan Umum' ? 'UMUM' : 'BPJS'

    try {
      const supabase = createClient()

      if (editingRevenue) {
        const { error } = await supabase
          .from('t_pool_revenue')
          .update({
            revenue_code: revCode,
            revenue_type: revenueForm.revenue_type,
            description: revenueForm.description || revenueForm.category,
            amount: parseFloat(revenueForm.amount),
            category: revenueForm.category || null,
            patient_count: revenueForm.patient_count ? parseInt(revenueForm.patient_count) : null
          })
          .eq('id', editingRevenue)

        if (error) throw error
        setEditingRevenue(null)
      } else {
        const { error } = await supabase
          .from('t_pool_revenue')
          .insert({
            pool_id: pool.id,
            revenue_code: revCode,
            revenue_type: revenueForm.revenue_type,
            description: revenueForm.description || revenueForm.category,
            amount: parseFloat(revenueForm.amount),
            category: revenueForm.category || null,
            patient_count: revenueForm.patient_count ? parseInt(revenueForm.patient_count) : null
          })

        if (error) throw error
      }

      await updatePoolTotals()
      setRevenueForm({ revenue_code: 'BPJS', revenue_type: 'BPJS Kesehatan', description: '', amount: '', category: 'Rawat Jalan', patient_count: '' })
      await loadPoolItems()
      onUpdate()
    } catch (error: any) {
      console.error('Error saving revenue:', error)
      alert(error.message || 'Gagal menyimpan pendapatan')
    }
  }

  function handleEditRevenue(item: RevenueItem) {
    setEditingRevenue(item.id)
    const revType = item.revenue_type || (item.revenue_code === 'UMUM' ? 'Pendapatan Umum' : 'BPJS Kesehatan')
    setRevenueForm({
      revenue_code: item.revenue_code || (revType === 'Pendapatan Umum' ? 'UMUM' : 'BPJS'),
      revenue_type: revType,
      description: item.description,
      amount: item.amount.toString(),
      category: item.category || 'Rawat Jalan',
      patient_count: item.patient_count?.toString() || ''
    })
  }

  function handleCancelEditRevenue() {
    setEditingRevenue(null)
    setRevenueForm({ revenue_code: 'BPJS', revenue_type: 'BPJS Kesehatan', description: '', amount: '', category: 'Rawat Jalan', patient_count: '' })
  }

  async function handleDeleteRevenue(id: string) {
    if (!pool || pool.status !== 'draft' || userRole !== 'superadmin') {
      alert('Anda tidak memiliki akses untuk mengubah data ini')
      return
    }

    if (!confirm('Hapus item pendapatan ini?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('t_pool_revenue')
        .delete()
        .eq('id', id)

      if (error) throw error

      await updatePoolTotals()
      await loadPoolItems()
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting revenue:', error)
      alert(error.message || 'Gagal menghapus pendapatan')
    }
  }

  async function handleAddDeduction() {
    if (!pool || !deductionForm.description || !deductionForm.amount) return
    if (pool.status !== 'draft' || userRole !== 'superadmin') {
      alert('Anda tidak memiliki akses untuk mengubah data ini')
      return
    }

    try {
      const supabase = createClient()

      if (editingDeduction) {
        const { error } = await supabase
          .from('t_pool_deduction')
          .update({
            description: deductionForm.description,
            amount: parseFloat(deductionForm.amount)
          })
          .eq('id', editingDeduction)

        if (error) throw error
        setEditingDeduction(null)
      } else {
        const { error } = await supabase
          .from('t_pool_deduction')
          .insert({
            pool_id: pool.id,
            description: deductionForm.description,
            amount: parseFloat(deductionForm.amount)
          })

        if (error) throw error
      }

      await updatePoolTotals()
      setDeductionForm({ description: '', amount: '' })
      await loadPoolItems()
      onUpdate()
    } catch (error: any) {
      console.error('Error saving deduction:', error)
      alert(error.message || 'Gagal menyimpan potongan')
    }
  }

  function handleEditDeduction(item: DeductionItem) {
    setEditingDeduction(item.id)
    setDeductionForm({
      description: item.description,
      amount: item.amount.toString()
    })
  }

  function handleCancelEditDeduction() {
    setEditingDeduction(null)
    setDeductionForm({ description: '', amount: '' })
  }

  async function handleDeleteDeduction(id: string) {
    if (!pool || pool.status !== 'draft' || userRole !== 'superadmin') {
      alert('Anda tidak memiliki akses untuk mengubah data ini')
      return
    }

    if (!confirm('Hapus item potongan ini?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('t_pool_deduction')
        .delete()
        .eq('id', id)

      if (error) throw error

      await updatePoolTotals()
      await loadPoolItems()
      onUpdate()
    } catch (error: any) {
      console.error('Error deleting deduction:', error)
      alert(error.message || 'Gagal menghapus potongan')
    }
  }

  async function updatePoolTotals() {
    if (!pool) return

    try {
      const supabase = createClient()
      const { data: revData } = await supabase
        .from('t_pool_revenue')
        .select('amount, revenue_code, revenue_type')
        .eq('pool_id', pool.id)

      const revenueBpjs = revData
        ?.filter(item => item.revenue_code === 'BPJS' || item.revenue_type === 'BPJS Kesehatan' || !item.revenue_code)
        .reduce((sum, item) => sum + Number(item.amount), 0) || 0

      const revenueUmum = revData
        ?.filter(item => item.revenue_code === 'UMUM' || item.revenue_type === 'Pendapatan Umum')
        .reduce((sum, item) => sum + Number(item.amount), 0) || 0

      const revenueTotal = revenueBpjs + revenueUmum

      const pBpjs = parseFloat(pctBpjs) || 100
      const pUmum = parseFloat(pctUmum) || 100

      const allocatedBpjs = (revenueBpjs * pBpjs) / 100
      const allocatedUmum = (revenueUmum * pUmum) / 100

      const { data: deductionData } = await supabase
        .from('t_pool_deduction')
        .select('amount')
        .eq('pool_id', pool.id)

      const deductionTotal = deductionData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0

      const { error } = await supabase
        .from('t_pool')
        .update({
          revenue_bpjs: revenueBpjs,
          revenue_umum: revenueUmum,
          allocation_percentage_bpjs: pBpjs,
          allocation_percentage_umum: pUmum,
          allocated_bpjs: allocatedBpjs,
          allocated_umum: allocatedUmum,
          revenue_total: revenueTotal,
          deduction_total: deductionTotal
        })
        .eq('id', pool.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating pool totals:', error)
    }
  }

  async function handleUpdatePercentages() {
    if (!pool) return
    if (pool.status !== 'draft') return

    const pBpjs = parseFloat(pctBpjs)
    const pUmum = parseFloat(pctUmum)

    if (isNaN(pBpjs) || pBpjs < 0 || pBpjs > 100 || isNaN(pUmum) || pUmum < 0 || pUmum > 100) {
      alert('Persentase alokasi harus antara 0 dan 100%')
      return
    }

    try {
      await updatePoolTotals()
      onUpdate()
    } catch (error: any) {
      console.error('Error updating percentages:', error)
      alert(error.message || 'Gagal memperbarui persentase')
    }
  }

  async function handleFinalSave() {
    if (isDraft && pool) {
      await handleUpdatePercentages()
    }
    onOpenChange(false)
  }

  if (!pool) return null

  const isDraft = pool.status === 'draft'
  const canEdit = isDraft && userRole === 'superadmin'

  const bpjsTotal = revenueItems
    .filter(i => (i.revenue_code || 'BPJS') === 'BPJS' || (i.revenue_type || 'BPJS Kesehatan') === 'BPJS Kesehatan')
    .reduce((sum, i) => sum + Number(i.amount), 0)

  const umumTotal = revenueItems
    .filter(i => i.revenue_code === 'UMUM' || i.revenue_type === 'Pendapatan Umum')
    .reduce((sum, i) => sum + Number(i.amount), 0)

  const curPctBpjs = parseFloat(pctBpjs) || 100
  const curPctUmum = parseFloat(pctUmum) || 100

  const curAllocBpjs = (bpjsTotal * curPctBpjs) / 100
  const curAllocUmum = (umumTotal * curPctUmum) / 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[880px] max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Detail Pool Pendapatan - {pool.period}</DialogTitle>
          <DialogDescription>
            Status: <span className="font-semibold uppercase px-2 py-0.5 rounded text-xs bg-slate-100">{pool.status}</span>
            {!isDraft && ' (Hanya Baca)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="px-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">Kode: BPJS</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-500">BPJS Kesehatan</p>
              <p className="text-xs font-bold text-slate-900">{formatCurrency(bpjsTotal)}</p>
              <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Alokasi ({curPctBpjs}%): {formatCurrency(curAllocBpjs)}</p>
            </div>
            <div className="px-2 border-l border-slate-200">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[8px] font-black uppercase bg-blue-100 text-blue-800 px-1 py-0.2 rounded">Kode: UMUM</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Pendapatan Umum</p>
              <p className="text-xs font-bold text-slate-900">{formatCurrency(umumTotal)}</p>
              <p className="text-[10px] font-bold text-blue-600 mt-0.5">Alokasi ({curPctUmum}%): {formatCurrency(curAllocUmum)}</p>
            </div>
            <div className="px-2 border-l border-slate-200">
              <p className="text-[10px] uppercase font-bold text-amber-600 mb-0.5">Total Potongan</p>
              <p className="text-xs font-bold text-slate-900">{formatCurrency(pool.deduction_total)}</p>
            </div>
            <div className="px-2 border-l border-slate-200">
              <p className="text-[10px] uppercase font-bold text-indigo-600 mb-0.5">Pool Bersih</p>
              <p className="text-xs font-bold text-indigo-700">{formatCurrency(pool.net_pool || 0)}</p>
            </div>
            <div className="px-2 border-l border-slate-200">
              <p className="text-[10px] uppercase font-bold text-emerald-600 mb-0.5">Total Dialokasikan</p>
              <p className="text-sm font-black text-emerald-700">{formatCurrency(curAllocBpjs + curAllocUmum)}</p>
            </div>
          </div>

          {/* Allocation Config Card if Editable */}
          {canEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded mr-2">BPJS</span>
                  <span className="text-xs font-bold text-slate-700">Alokasi Insentif BPJS (%):</span>
                </div>
                <div className="flex items-center w-24">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="h-8 text-xs font-bold text-right pr-5"
                    value={pctBpjs}
                    onChange={(e) => setPctBpjs(e.target.value)}
                  />
                  <span className="-ml-4 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded mr-2">UMUM</span>
                  <span className="text-xs font-bold text-slate-700">Alokasi Insentif Umum (%):</span>
                </div>
                <div className="flex items-center w-24">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="h-8 text-xs font-bold text-right pr-5"
                    value={pctUmum}
                    onChange={(e) => setPctUmum(e.target.value)}
                  />
                  <span className="-ml-4 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800">Rincian Pendapatan</h3>
            </div>

            {canEdit && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Jenis Pendapatan</Label>
                    <Select
                      value={revenueForm.revenue_type}
                      onValueChange={(val) => setRevenueForm({
                        ...revenueForm,
                        revenue_type: val as any,
                        revenue_code: val === 'Pendapatan Umum' ? 'UMUM' : 'BPJS'
                      })}
                    >
                      <SelectTrigger className="bg-white rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BPJS Kesehatan">BPJS Kesehatan (Kode: BPJS)</SelectItem>
                        <SelectItem value="Pendapatan Umum">Pendapatan Umum (Kode: UMUM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Kategori</Label>
                    <Select
                      value={revenueForm.category}
                      onValueChange={(val) => setRevenueForm({ ...revenueForm, category: val as any })}
                    >
                      <SelectTrigger className="bg-white rounded-lg">
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                        <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
                        <SelectItem value="AMHP">AMHP</SelectItem>
                        <SelectItem value="Ambulance">Ambulance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Deskripsi (Opsional)</Label>
                    <Input
                      placeholder="Keterangan"
                      value={revenueForm.description}
                      onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                      className="bg-white rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Jumlah Pendapatan (Rp)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={revenueForm.amount}
                      onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                      className="bg-white rounded-lg font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">Pasien (Opsional)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={revenueForm.patient_count}
                      onChange={(e) => setRevenueForm({ ...revenueForm, patient_count: e.target.value })}
                      className="bg-white rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  {editingRevenue && (
                    <Button onClick={handleCancelEditRevenue} variant="outline" size="sm" className="rounded-lg">
                      Batal
                    </Button>
                  )}
                  <Button onClick={handleAddRevenue} size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 font-bold text-xs">
                    <Plus className="h-4 w-4 mr-1" />
                    {editingRevenue ? 'Update Item' : 'Tambah Item'}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {revenueItems.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Belum ada item pendapatan</p>
              ) : (
                revenueItems.map(item => {
                  const isBpjs = (item.revenue_code || 'BPJS') === 'BPJS' || (item.revenue_type || 'BPJS Kesehatan') === 'BPJS Kesehatan'
                  return (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${isBpjs ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {isBpjs ? 'Kode: BPJS' : 'Kode: UMUM'}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {item.category || 'Lainnya'}
                          </span>
                          {item.patient_count && (
                            <span className="text-[10px] font-semibold text-slate-500">
                              {item.patient_count} Pasien
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-slate-800">{item.description || item.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-900 text-sm">{formatCurrency(item.amount)}</p>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditRevenue(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Pencil className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRevenue(item.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Deduction Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800">Rincian Potongan</h3>
            </div>

            {canEdit && (
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Deskripsi Potongan"
                  value={deductionForm.description}
                  onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                  className="rounded-lg text-xs"
                />
                <Input
                  type="number"
                  placeholder="Jumlah (Rp)"
                  value={deductionForm.amount}
                  onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                  className="w-40 rounded-lg text-xs font-semibold"
                />
                <Button onClick={handleAddDeduction} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold">
                  <Plus className="h-4 w-4 mr-1" />
                  {editingDeduction ? 'Simpan' : 'Tambah'}
                </Button>
                {editingDeduction && (
                  <Button onClick={handleCancelEditDeduction} size="sm" variant="outline" className="rounded-lg text-xs">
                    Batal
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              {deductionItems.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Belum ada item potongan</p>
              ) : (
                deductionItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl text-xs">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-amber-700 text-sm">{formatCurrency(item.amount)}</p>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDeduction(item)}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDeduction(item.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 px-2 pb-2">
          <div className="flex items-center justify-between w-full">
            <Button
              size="sm"
              onClick={handleFinalSave}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-8 rounded-xl shadow-md ml-auto"
            >
              {canEdit ? 'Simpan' : 'Tutup'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
