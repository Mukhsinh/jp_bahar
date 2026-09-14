'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Unit {
  id: string
  code: string
  name: string
  proportion_percentage: number
  proportion_umum_percentage?: number | null
  use_same_proportion?: boolean
  is_active: boolean
}

interface UnitFormDialogProps {
  unit: Unit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UnitFormDialog({ unit, open, onOpenChange }: UnitFormDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    proportion_percentage: '0',
    proportion_umum_percentage: '0',
    use_same_proportion: true,
  })

  useEffect(() => {
    if (unit) {
      setFormData({
        code: unit.code,
        name: unit.name,
        proportion_percentage: unit.proportion_percentage.toString(),
        proportion_umum_percentage: (unit.proportion_umum_percentage ?? unit.proportion_percentage).toString(),
        use_same_proportion: unit.use_same_proportion ?? true,
      })
    } else {
      setFormData({
        code: '',
        name: '',
        proportion_percentage: '0',
        proportion_umum_percentage: '0',
        use_same_proportion: true,
      })
    }
    setError(null)
  }, [unit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const proportionBPJS = parseFloat(formData.proportion_percentage)
      const proportionUMUM = formData.use_same_proportion ? proportionBPJS : parseFloat(formData.proportion_umum_percentage)

      if (isNaN(proportionBPJS) || proportionBPJS < 0 || proportionBPJS > 100) {
        setError('Proporsi BPJS Kesehatan harus antara 0 dan 100')
        setLoading(false)
        return
      }

      if (isNaN(proportionUMUM) || proportionUMUM < 0 || proportionUMUM > 100) {
        setError('Proporsi Pendapatan Umum harus antara 0 dan 100')
        setLoading(false)
        return
      }

      const updateData = {
        code: formData.code,
        name: formData.name,
        proportion_percentage: proportionBPJS,
        proportion_umum_percentage: proportionUMUM,
        use_same_proportion: formData.use_same_proportion,
        updated_at: new Date().toISOString(),
      }

      if (unit) {
        // Update existing unit
        const { error: updateError } = await supabase
          .from('m_units')
          .update(updateData)
          .eq('id', unit.id)

        if (updateError) throw updateError
      } else {
        // Create new unit
        // First check if code already exists
        const { data: existing } = await supabase
          .from('m_units')
          .select('id')
          .eq('code', formData.code)
          .single()

        if (existing) {
          setError('Kode unit sudah ada')
          setLoading(false)
          return
        }

        const { error: insertError } = await supabase
          .from('m_units')
          .insert({
            code: formData.code,
            name: formData.name,
            proportion_percentage: proportionBPJS,
            proportion_umum_percentage: proportionUMUM,
            use_same_proportion: formData.use_same_proportion,
            is_active: true,
          })

        if (insertError) throw insertError
      }

      router.refresh()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] w-[95vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{unit ? 'Ubah Unit' : 'Tambah Unit'}</DialogTitle>
          <DialogDescription>
            {unit ? 'Perbarui informasi dan proporsi alokasi unit' : 'Buat unit organisasi baru'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6 pt-2 pb-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-semibold">Kode Unit *</Label>
              <Input
                id="code"
                placeholder="Contoh: UN001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                disabled={!!unit || loading}
                className="bg-gray-50/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Nama Unit *</Label>
              <Input
                id="name"
                placeholder="Nama unit kerja"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {/* Proporsi BPJS */}
            <div className="space-y-2">
              <Label htmlFor="proportion" className="text-sm font-semibold text-blue-900">
                Proporsi BPJS Kesehatan (%) *
              </Label>
              <div className="relative">
                <Input
                  id="proportion"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.proportion_percentage}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData(prev => ({
                      ...prev,
                      proportion_percentage: val,
                      proportion_umum_percentage: prev.use_same_proportion ? val : prev.proportion_umum_percentage
                    }))
                  }}
                  required
                  disabled={loading}
                  className="pr-10 border-blue-200 focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 font-medium">%</span>
              </div>
            </div>

            {/* Checkbox Same as BPJS for UMUM */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="use_same_proportion"
                  checked={formData.use_same_proportion}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setFormData(prev => ({
                      ...prev,
                      use_same_proportion: checked,
                      proportion_umum_percentage: checked ? prev.proportion_percentage : prev.proportion_umum_percentage
                    }))
                  }}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <Label htmlFor="use_same_proportion" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Proporsi Pendapatan UMUM sama dengan BPJS
                </Label>
              </div>

              {!formData.use_same_proportion && (
                <div className="space-y-2 pt-1 border-t border-slate-200 animate-in fade-in duration-200">
                  <Label htmlFor="proportion_umum" className="text-xs font-semibold text-amber-900">
                    Proporsi Pendapatan UMUM (%) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="proportion_umum"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.proportion_umum_percentage}
                      onChange={(e) => setFormData({ ...formData, proportion_umum_percentage: e.target.value })}
                      required={!formData.use_same_proportion}
                      disabled={loading}
                      className="pr-10 border-amber-200 focus:border-amber-500 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 font-medium">%</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-blue-600 bg-blue-50/50 p-2.5 rounded-lg leading-relaxed border border-blue-100">
              Tip: Distribusi pendapatan BPJS Kesehatan dan Pendapatan UMUM kini dapat dikonfigurasi secara mandiri per unit.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 p-6 pt-4 bg-gray-50/50 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              {loading ? 'Menyimpan...' : unit ? 'Simpan Perubahan' : 'Buat Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

