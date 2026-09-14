'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, ShieldCheck, Building2, Receipt, Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface PoolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface RevenueInputItem {
  id: string
  revenue_code: 'BPJS' | 'UMUM'
  revenue_type: 'BPJS Kesehatan' | 'Pendapatan Umum'
  category: 'Rawat Jalan' | 'Rawat Inap' | 'AMHP' | 'Ambulance' | string
  description: string
  amount: number
  patient_count?: number
}

interface DeductionInputItem {
  id: string
  description: string
  amount: number
}

export default function PoolFormDialog({
  open,
  onOpenChange,
  onSuccess
}: PoolFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    period: '',
    allocation_percentage_bpjs: '100.00',
    allocation_percentage_umum: '100.00'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Revenue & Deduction local state
  const [activeTab, setActiveTab] = useState<'bpjs' | 'umum' | 'potongan'>('bpjs')
  const [revenueItems, setRevenueItems] = useState<RevenueInputItem[]>([])
  const [deductionItems, setDeductionItems] = useState<DeductionInputItem[]>([])

  // Temporary forms for items
  const [bpjsForm, setBpjsForm] = useState({
    category: 'Rawat Jalan',
    description: '',
    amount: '',
    patient_count: ''
  })

  const [umumForm, setUmumForm] = useState({
    category: 'Rawat Jalan',
    description: '',
    amount: '',
    patient_count: ''
  })

  const [deductionForm, setDeductionForm] = useState({
    description: '',
    amount: ''
  })

  useEffect(() => {
    if (open) {
      const now = new Date()
      const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setFormData({
        period: defaultPeriod,
        allocation_percentage_bpjs: '100.00',
        allocation_percentage_umum: '100.00'
      })
      setErrors({})
      setRevenueItems([])
      setDeductionItems([])
      setBpjsForm({ category: 'Rawat Jalan', description: '', amount: '', patient_count: '' })
      setUmumForm({ category: 'Rawat Jalan', description: '', amount: '', patient_count: '' })
      setDeductionForm({ description: '', amount: '' })
      setActiveTab('bpjs')
    }
  }, [open])

  // Calculations per revenue type
  const totals = useMemo(() => {
    const revenue_bpjs = revenueItems
      .filter(item => item.revenue_code === 'BPJS')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

    const revenue_umum = revenueItems
      .filter(item => item.revenue_code === 'UMUM')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

    const pct_bpjs = parseFloat(formData.allocation_percentage_bpjs) || 0
    const pct_umum = parseFloat(formData.allocation_percentage_umum) || 0

    const allocated_bpjs = (revenue_bpjs * pct_bpjs) / 100
    const allocated_umum = (revenue_umum * pct_umum) / 100

    const revenue_total = revenue_bpjs + revenue_umum
    const deduction_total = deductionItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const net_pool = revenue_total - deduction_total
    const allocated_total = allocated_bpjs + allocated_umum

    return {
      revenue_bpjs,
      revenue_umum,
      allocated_bpjs,
      allocated_umum,
      revenue_total,
      deduction_total,
      net_pool,
      allocated_total
    }
  }, [revenueItems, deductionItems, formData.allocation_percentage_bpjs, formData.allocation_percentage_umum])

  // Handlers for adding items
  function handleAddBpjsRevenue() {
    if (!bpjsForm.amount || parseFloat(bpjsForm.amount) <= 0) return
    const newItem: RevenueInputItem = {
      id: Math.random().toString(36).substring(2, 9),
      revenue_code: 'BPJS',
      revenue_type: 'BPJS Kesehatan',
      category: bpjsForm.category,
      description: bpjsForm.description || bpjsForm.category,
      amount: parseFloat(bpjsForm.amount),
      patient_count: bpjsForm.patient_count ? parseInt(bpjsForm.patient_count) : undefined
    }
    setRevenueItems([...revenueItems, newItem])
    setBpjsForm({ category: 'Rawat Jalan', description: '', amount: '', patient_count: '' })
  }

  function handleAddUmumRevenue() {
    if (!umumForm.amount || parseFloat(umumForm.amount) <= 0) return
    const newItem: RevenueInputItem = {
      id: Math.random().toString(36).substring(2, 9),
      revenue_code: 'UMUM',
      revenue_type: 'Pendapatan Umum',
      category: umumForm.category,
      description: umumForm.description || umumForm.category,
      amount: parseFloat(umumForm.amount),
      patient_count: umumForm.patient_count ? parseInt(umumForm.patient_count) : undefined
    }
    setRevenueItems([...revenueItems, newItem])
    setUmumForm({ category: 'Rawat Jalan', description: '', amount: '', patient_count: '' })
  }

  function handleAddDeduction() {
    if (!deductionForm.description || !deductionForm.amount || parseFloat(deductionForm.amount) <= 0) return
    const newItem: DeductionInputItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: deductionForm.description,
      amount: parseFloat(deductionForm.amount)
    }
    setDeductionItems([...deductionItems, newItem])
    setDeductionForm({ description: '', amount: '' })
  }

  function handleRemoveRevenue(id: string) {
    setRevenueItems(revenueItems.filter(item => item.id !== id))
  }

  function handleRemoveDeduction(id: string) {
    setDeductionItems(deductionItems.filter(item => item.id !== id))
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}
    const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/

    if (!formData.period) {
      newErrors.period = 'Periode wajib diisi'
    } else if (!periodRegex.test(formData.period)) {
      newErrors.period = 'Periode harus dalam format YYYY-MM'
    }

    const pctBpjs = parseFloat(formData.allocation_percentage_bpjs)
    if (isNaN(pctBpjs) || pctBpjs < 0 || pctBpjs > 100) {
      newErrors.allocation_percentage_bpjs = 'Alokasi BPJS harus antara 0 dan 100%'
    }

    const pctUmum = parseFloat(formData.allocation_percentage_umum)
    if (isNaN(pctUmum) || pctUmum < 0 || pctUmum > 100) {
      newErrors.allocation_percentage_umum = 'Alokasi Umum harus antara 0 dan 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Check if period already exists
      const { data: existingPool, error: checkError } = await supabase
        .from('t_pool')
        .select('id')
        .eq('period', formData.period)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingPool) {
        setErrors({ period: 'Pool sudah ada untuk periode ini' })
        setIsSubmitting(false)
        return
      }

      // 1. Insert t_pool with separate allocation percentages & calculated amounts
      const { data: newPool, error: poolError } = await supabase
        .from('t_pool')
        .insert({
          period: formData.period,
          allocation_percentage_bpjs: parseFloat(formData.allocation_percentage_bpjs),
          allocation_percentage_umum: parseFloat(formData.allocation_percentage_umum),
          revenue_bpjs: totals.revenue_bpjs,
          revenue_umum: totals.revenue_umum,
          allocated_bpjs: totals.allocated_bpjs,
          allocated_umum: totals.allocated_umum,
          revenue_total: totals.revenue_total,
          deduction_total: totals.deduction_total,
          status: 'draft'
        })
        .select('id')
        .single()

      if (poolError || !newPool) throw poolError

      // 2. Insert revenue items with revenue_code ('BPJS' / 'UMUM')
      if (revenueItems.length > 0) {
        const revPayload = revenueItems.map(item => ({
          pool_id: newPool.id,
          revenue_code: item.revenue_code,
          revenue_type: item.revenue_type,
          category: item.category,
          description: item.description,
          amount: item.amount,
          patient_count: item.patient_count || null
        }))

        const { error: revErr } = await supabase
          .from('t_pool_revenue')
          .insert(revPayload)

        if (revErr) throw revErr
      }

      // 3. Insert deduction items
      if (deductionItems.length > 0) {
        const dedPayload = deductionItems.map(item => ({
          pool_id: newPool.id,
          description: item.description,
          amount: item.amount
        }))

        const { error: dedErr } = await supabase
          .from('t_pool_deduction')
          .insert(dedPayload)

        if (dedErr) throw dedErr
      }

      alert('Pool Pendapatan Berhasil Dibuat!')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error creating pool:', error)
      alert(error.message || 'Gagal membuat pool')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[92vh] overflow-y-auto rounded-3xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-blue-600" />
              Buat Pool Pendapatan
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              Input periode, rincian pendapatan BPJS Kesehatan (Kode: BPJS), Pendapatan Umum (Kode: UMUM), serta alokasi insentif masing-masing jenis pendapatan.
            </DialogDescription>
          </DialogHeader>

          {/* Top Form: Periode Only */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="period" className="text-xs font-bold uppercase text-slate-600">Periode (Bulan - Tahun) *</Label>
              <Input
                id="period"
                type="month"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="bg-white rounded-xl border-slate-300 font-semibold text-sm"
              />
              {errors.period && (
                <p className="text-xs text-red-600 font-medium">{errors.period}</p>
              )}
            </div>
          </div>

          {/* Live Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-md">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded">Kode: BPJS</span>
              </div>
              <p className="text-[10px] font-bold text-slate-300 uppercase">BPJS Kesehatan</p>
              <p className="text-xs font-bold text-slate-200">{formatCurrency(totals.revenue_bpjs)}</p>
              <p className="text-[10px] font-black text-emerald-400 mt-0.5">Alokasi: {formatCurrency(totals.allocated_bpjs)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black uppercase bg-blue-500 text-slate-950 px-1.5 py-0.5 rounded">Kode: UMUM</span>
              </div>
              <p className="text-[10px] font-bold text-slate-300 uppercase">Pendapatan Umum</p>
              <p className="text-xs font-bold text-slate-200">{formatCurrency(totals.revenue_umum)}</p>
              <p className="text-[10px] font-black text-blue-400 mt-0.5">Alokasi: {formatCurrency(totals.allocated_umum)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">Total Potongan</p>
              <p className="text-sm font-black text-amber-200">{formatCurrency(totals.deduction_total)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-1">Total Dialokasikan</p>
              <p className="text-base font-black text-emerald-400">{formatCurrency(totals.allocated_total)}</p>
            </div>
          </div>

          {/* Tabs for BPJS Kesehatan, Pendapatan Umum, Potongan */}
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl mb-4">
              <TabsTrigger value="bpjs" className="rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 py-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                1. BPJS Kesehatan (BPJS)
              </TabsTrigger>
              <TabsTrigger value="umum" className="rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 py-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                2. Pendapatan Umum (UMUM)
              </TabsTrigger>
              <TabsTrigger value="potongan" className="rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 py-2">
                <Receipt className="h-4 w-4 text-amber-600" />
                3. Potongan / Beban
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BPJS Kesehatan */}
            <TabsContent value="bpjs" className="space-y-4 focus:outline-none">
              {/* Allocation % for BPJS */}
              <div className="bg-emerald-100/60 border border-emerald-300 p-3.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-emerald-900 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    Alokasi Insentif BPJS Kesehatan (Kode: BPJS)
                  </h4>
                  <p className="text-[11px] text-emerald-800">Persentase pendapatan BPJS yang dialokasikan khusus untuk insentif</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="allocation_percentage_bpjs" className="text-xs font-bold text-emerald-950">Persentase Alokasi (%):</Label>
                  <div className="relative w-28">
                    <Input
                      id="allocation_percentage_bpjs"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.allocation_percentage_bpjs}
                      onChange={(e) => setFormData({ ...formData, allocation_percentage_bpjs: e.target.value })}
                      className="bg-white border-emerald-400 font-black text-right text-xs pr-6"
                      placeholder="100.00"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">%</span>
                  </div>
                </div>
              </div>

              {/* Form Input Item BPJS */}
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl space-y-3">
                <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Input Item Pendapatan BPJS Kesehatan
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Kategori</Label>
                    <Select value={bpjsForm.category} onValueChange={(v) => setBpjsForm({ ...bpjsForm, category: v })}>
                      <SelectTrigger className="bg-white rounded-lg border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                        <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
                        <SelectItem value="AMHP">AMHP</SelectItem>
                        <SelectItem value="Ambulance">Ambulance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Deskripsi / Keterangan</Label>
                    <Input
                      placeholder="Contoh: Klaim BPJS Rawat Jalan"
                      value={bpjsForm.description}
                      onChange={(e) => setBpjsForm({ ...bpjsForm, description: e.target.value })}
                      className="bg-white rounded-lg border-slate-300"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Jumlah Pendapatan (Rp) *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bpjsForm.amount}
                      onChange={(e) => setBpjsForm({ ...bpjsForm, amount: e.target.value })}
                      className="bg-white rounded-lg border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Jumlah Pasien (Opsional)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bpjsForm.patient_count}
                      onChange={(e) => setBpjsForm({ ...bpjsForm, patient_count: e.target.value })}
                      className="bg-white rounded-lg border-slate-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddBpjsRevenue}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 font-bold text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Tambah Item BPJS
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {revenueItems.filter(i => i.revenue_code === 'BPJS').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic border border-dashed rounded-xl">Belum ada item pendapatan BPJS Kesehatan yang ditambahkan</p>
                ) : (
                  revenueItems.filter(i => i.revenue_code === 'BPJS').map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-emerald-100 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mr-2">{item.category}</span>
                        <span className="font-semibold text-slate-800">{item.description}</span>
                        {item.patient_count && <span className="ml-2 text-slate-500">({item.patient_count} Pasien)</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveRevenue(item.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 2: Pendapatan Umum */}
            <TabsContent value="umum" className="space-y-4 focus:outline-none">
              {/* Allocation % for Pendapatan Umum */}
              <div className="bg-blue-100/60 border border-blue-300 p-3.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-blue-900 uppercase flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    Alokasi Insentif Pendapatan Umum (Kode: UMUM)
                  </h4>
                  <p className="text-[11px] text-blue-800">Persentase pendapatan umum yang dialokasikan khusus untuk insentif</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="allocation_percentage_umum" className="text-xs font-bold text-blue-950">Persentase Alokasi (%):</Label>
                  <div className="relative w-28">
                    <Input
                      id="allocation_percentage_umum"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.allocation_percentage_umum}
                      onChange={(e) => setFormData({ ...formData, allocation_percentage_umum: e.target.value })}
                      className="bg-white border-blue-400 font-black text-right text-xs pr-6"
                      placeholder="100.00"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-700">%</span>
                  </div>
                </div>
              </div>

              {/* Form Input Item Umum */}
              <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-2xl space-y-3">
                <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Input Item Pendapatan Umum
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Kategori</Label>
                    <Select value={umumForm.category} onValueChange={(v) => setUmumForm({ ...umumForm, category: v })}>
                      <SelectTrigger className="bg-white rounded-lg border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                        <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
                        <SelectItem value="AMHP">AMHP</SelectItem>
                        <SelectItem value="Ambulance">Ambulance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Deskripsi / Keterangan</Label>
                    <Input
                      placeholder="Contoh: Penerimaan Pasien Umum"
                      value={umumForm.description}
                      onChange={(e) => setUmumForm({ ...umumForm, description: e.target.value })}
                      className="bg-white rounded-lg border-slate-300"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Jumlah Pendapatan (Rp) *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={umumForm.amount}
                      onChange={(e) => setUmumForm({ ...umumForm, amount: e.target.value })}
                      className="bg-white rounded-lg border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Jumlah Pasien (Opsional)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={umumForm.patient_count}
                      onChange={(e) => setUmumForm({ ...umumForm, patient_count: e.target.value })}
                      className="bg-white rounded-lg border-slate-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddUmumRevenue}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 font-bold text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Tambah Item Umum
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {revenueItems.filter(i => i.revenue_code === 'UMUM').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic border border-dashed rounded-xl">Belum ada item pendapatan Umum yang ditambahkan</p>
                ) : (
                  revenueItems.filter(i => i.revenue_code === 'UMUM').map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-blue-100 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mr-2">{item.category}</span>
                        <span className="font-semibold text-slate-800">{item.description}</span>
                        {item.patient_count && <span className="ml-2 text-slate-500">({item.patient_count} Pasien)</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveRevenue(item.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 3: Potongan */}
            <TabsContent value="potongan" className="space-y-4 focus:outline-none">
              <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Input Potongan / Beban
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Deskripsi Potongan *</Label>
                    <Input
                      placeholder="Contoh: Operasional / Bahan Habis Pakai"
                      value={deductionForm.description}
                      onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                      className="bg-white rounded-lg border-slate-300"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600">Jumlah Potongan (Rp) *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={deductionForm.amount}
                      onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                      className="bg-white rounded-lg border-slate-300 font-semibold"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddDeduction}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-5 font-bold text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Tambah Potongan
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {deductionItems.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic border border-dashed rounded-xl">Belum ada item potongan yang ditambahkan</p>
                ) : (
                  deductionItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-amber-100 rounded-xl text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{item.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-700">{formatCurrency(item.amount)}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveDeduction(item.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl px-6"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 shadow-md shadow-blue-200"
            >
              {isSubmitting ? 'Memproses...' : 'Simpan Pool Pendapatan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
