'use client'

import { useState, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'

interface Unit {
  id: string
  code: string
  name: string
}

interface CopyStructureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  units: Unit[]
  sourceUnitId: string | null
  onSuccess: () => void
}

export default function CopyStructureDialog({
  open,
  onOpenChange,
  units,
  sourceUnitId,
  onSuccess
}: CopyStructureDialogProps) {
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSourceUnit, setSelectedSourceUnit] = useState<string>('')
  const [selectedTargetUnit, setSelectedTargetUnit] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (sourceUnitId) {
      setSelectedSourceUnit(sourceUnitId)
    }
    setSelectedTargetUnit('')
    setError('')
  }, [sourceUnitId, open])

  async function handleCopy() {
    if (!selectedSourceUnit || !selectedTargetUnit) {
      setError('Silakan pilih unit sumber dan tujuan')
      return
    }

    if (selectedSourceUnit === selectedTargetUnit) {
      setError('Unit sumber dan tujuan harus berbeda')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Check if target unit already has KPI structure
      const { data: existingCategories, error: checkError } = await supabase
        .from('m_kpi_categories')
        .select('id')
        .eq('unit_id', selectedTargetUnit)
        .limit(1)

      if (checkError) throw checkError

      if (existingCategories && existingCategories.length > 0) {
        if (!confirm('Unit tujuan sudah memiliki struktur KPI. Struktur ini akan diganti. Lanjutkan?')) {
          setIsSubmitting(false)
          return
        }

        // Delete existing structure
        const { error: deleteError } = await supabase
          .from('m_kpi_categories')
          .delete()
          .eq('unit_id', selectedTargetUnit)

        if (deleteError) throw deleteError
      }

      // Get source categories
      const { data: sourceCategories, error: categoriesError } = await supabase
        .from('m_kpi_categories')
        .select('*')
        .eq('unit_id', selectedSourceUnit)

      if (categoriesError) throw categoriesError

      if (!sourceCategories || sourceCategories.length === 0) {
        setError('Unit sumber tidak memiliki struktur KPI untuk disalin')
        setIsSubmitting(false)
        return
      }

      // Copy categories
      const categoryMapping: Record<string, string> = {}

      for (const category of sourceCategories) {
        const { data: newCategory, error: insertError } = await supabase
          .from('m_kpi_categories')
          .insert({
            unit_id: selectedTargetUnit,
            category: category.category,
            category_name: category.category_name,
            weight_percentage: category.weight_percentage,
            description: category.description,
            is_active: category.is_active
          })
          .select()
          .single()

        if (insertError) throw insertError
        categoryMapping[category.id] = newCategory.id
      }

      // Get source indicators
      const sourceCategoryIds = sourceCategories.map(c => c.id)
      const { data: sourceIndicators, error: indicatorsError } = await supabase
        .from('m_kpi_indicators')
        .select('*')
        .in('category_id', sourceCategoryIds)

      if (indicatorsError) throw indicatorsError

      // Copy indicators and track mapping
      const indicatorMapping: Record<string, string> = {}

      if (sourceIndicators && sourceIndicators.length > 0) {
        for (const indicator of sourceIndicators) {
          const { data: newIndicator, error: insertError } = await supabase
            .from('m_kpi_indicators')
            .insert({
              category_id: categoryMapping[indicator.category_id],
              code: indicator.code,
              name: indicator.name,
              target_value: indicator.target_value,
              weight_percentage: indicator.weight_percentage,
              measurement_unit: indicator.measurement_unit,
              description: indicator.description,
              is_active: indicator.is_active
            })
            .select()
            .single()

          if (insertError) throw insertError
          indicatorMapping[indicator.id] = newIndicator.id
        }

        // Get source sub indicators
        const sourceIndicatorIds = sourceIndicators.map(i => i.id)
        const { data: sourceSubIndicators, error: subIndicatorsError } = await supabase
          .from('m_kpi_sub_indicators')
          .select('*')
          .in('indicator_id', sourceIndicatorIds)

        if (subIndicatorsError) throw subIndicatorsError

        // Copy sub indicators
        if (sourceSubIndicators && sourceSubIndicators.length > 0) {
          const subIndicatorsToInsert = sourceSubIndicators.map(sub => ({
            indicator_id: indicatorMapping[sub.indicator_id],
            code: sub.code,
            name: sub.name,
            target_value: sub.target_value,
            weight_percentage: sub.weight_percentage,
            scoring_criteria: sub.scoring_criteria,
            measurement_unit: sub.measurement_unit,
            description: sub.description,
            is_active: sub.is_active
          }))

          const { error: insertSubError } = await supabase
            .from('m_kpi_sub_indicators')
            .insert(subIndicatorsToInsert)

          if (insertSubError) throw insertSubError
        }
      }

      alert('Struktur KPI berhasil disalin (termasuk sub indikator)!')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error copying KPI structure:', error)
      setError(error.message || 'Gagal menyalin struktur KPI')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Salin Struktur KPI</DialogTitle>
          <DialogDescription>
            Salin semua kategori dan indikator dari satu unit ke unit lain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Unit */}
          <div className="space-y-2">
            <Label htmlFor="source_unit">Unit Sumber *</Label>
            <select
              id="source_unit"
              value={selectedSourceUnit}
              onChange={(e) => setSelectedSourceUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Pilih unit sumber</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} - {unit.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Unit */}
          <div className="space-y-2">
            <Label htmlFor="target_unit">Unit Tujuan *</Label>
            <select
              id="target_unit"
              value={selectedTargetUnit}
              onChange={(e) => setSelectedTargetUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Pilih unit tujuan</option>
              {units
                .filter(unit => unit.id !== selectedSourceUnit)
                .map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Ini akan menyalin semua kategori (P1, P2, P3), indikator, dan sub indikator (beserta nilai skor) dari unit sumber ke unit tujuan.
              Jika unit tujuan sudah memiliki struktur KPI, struktur tersebut akan diganti.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleCopy}
            disabled={isSubmitting || !selectedSourceUnit || !selectedTargetUnit}
          >
            {isSubmitting ? 'Menyalin...' : 'Salin Struktur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
