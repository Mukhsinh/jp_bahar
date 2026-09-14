'use client'

import { useState } from 'react'
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
import { Copy, AlertTriangle } from 'lucide-react'

interface CopyBPJSStructureDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    unitId: string | null
    unitName?: string
    onSuccess: () => void
}

export default function CopyBPJSStructureDialog({
    open,
    onOpenChange,
    unitId,
    unitName,
    onSuccess
}: CopyBPJSStructureDialogProps) {
    const supabase = createClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string>('')

    async function handleCopy() {
        if (!unitId) {
            setError('Unit belum dipilih')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            // 1. Get BPJS categories for this unit (revenue_type 'bpjs' or 'all')
            const { data: bpjsCategories, error: catError } = await supabase
                .from('m_kpi_categories')
                .select('*')
                .eq('unit_id', unitId)
                .in('revenue_type', ['bpjs', 'all'])

            if (catError) throw catError

            if (!bpjsCategories || bpjsCategories.length === 0) {
                setError('Unit ini belum memiliki struktur KPI BPJS Kesehatan untuk disalin.')
                setIsSubmitting(false)
                return
            }

            // 2. Remove any existing 'umum' categories for this unit to ensure clean overwrite
            const { data: existingUmumCats } = await supabase
                .from('m_kpi_categories')
                .select('id')
                .eq('unit_id', unitId)
                .eq('revenue_type', 'umum')

            if (existingUmumCats && existingUmumCats.length > 0) {
                const umumCatIds = existingUmumCats.map(c => c.id)
                await supabase.from('m_kpi_categories').delete().in('id', umumCatIds)
            }

            // 3. Copy categories with revenue_type = 'umum'
            const categoryMapping: Record<string, string> = {}

            for (const category of bpjsCategories) {
                const { data: newCat, error: insertCatError } = await supabase
                    .from('m_kpi_categories')
                    .insert({
                        unit_id: unitId,
                        category: category.category,
                        category_name: category.category_name,
                        weight_percentage: category.weight_percentage,
                        description: category.description,
                        configuration_style: category.configuration_style,
                        is_weighted: category.is_weighted,
                        is_active: category.is_active,
                        revenue_type: 'umum'
                    })
                    .select()
                    .single()

                if (insertCatError) throw insertCatError
                categoryMapping[category.id] = newCat.id
            }

            // 4. Get BPJS indicators
            const bpjsCategoryIds = bpjsCategories.map(c => c.id)
            const { data: bpjsIndicators, error: indError } = await supabase
                .from('m_kpi_indicators')
                .select('*')
                .in('category_id', bpjsCategoryIds)

            if (indError) throw indError

            const indicatorMapping: Record<string, string> = {}

            if (bpjsIndicators && bpjsIndicators.length > 0) {
                for (const indicator of bpjsIndicators) {
                    const { data: newInd, error: insertIndError } = await supabase
                        .from('m_kpi_indicators')
                        .insert({
                            category_id: categoryMapping[indicator.category_id],
                            code: indicator.code,
                            name: indicator.name,
                            target_value: indicator.target_value,
                            weight_percentage: indicator.weight_percentage,
                            measurement_unit: indicator.measurement_unit,
                            description: indicator.description,
                            calculation_method: indicator.calculation_method,
                            base_index_value: indicator.base_index_value,
                            is_active: indicator.is_active,
                            measurement_type: indicator.measurement_type,
                            unit_tariff: indicator.unit_tariff,
                            basic_index_value: indicator.basic_index_value,
                            service_types: indicator.service_types
                        })
                        .select()
                        .single()

                    if (insertIndError) throw insertIndError
                    indicatorMapping[indicator.id] = newInd.id
                }

                // 5. Get BPJS sub-indicators
                const bpjsIndicatorIds = bpjsIndicators.map(i => i.id)
                const { data: bpjsSubIndicators } = await supabase
                    .from('m_kpi_sub_indicators')
                    .select('*')
                    .in('indicator_id', bpjsIndicatorIds)

                if (bpjsSubIndicators && bpjsSubIndicators.length > 0) {
                    const subToInsert = bpjsSubIndicators.map(sub => ({
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
                        .insert(subToInsert)

                    if (insertSubError) throw insertSubError
                }
            }

            alert('Struktur KPI dari BPJS Kesehatan berhasil disalin ke Pendapatan Umum!')
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Error copying BPJS structure to UMUM:', err)
            setError(err.message || 'Gagal menyalin struktur KPI')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-900">
                        <Copy className="h-5 w-5 text-blue-600" />
                        Salin KPI dari BPJS Kesehatan
                    </DialogTitle>
                    <DialogDescription>
                        Duplikasi seluruh struktur KPI (P1, P2, P3, indikator, dan sub-indikator) dari skema BPJS Kesehatan ke skema Pendapatan Umum untuk unit <strong>{unitName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                        <div className="flex items-center gap-2 font-bold text-amber-800">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Perhatian:
                        </div>
                        <p>
                            Tindakan ini akan membuat salinan identik dari seluruh indikator KPI BPJS Kesehatan untuk Pendapatan Umum.
                            Jika sudah ada indikator KPI Pendapatan Umum sebelumnya pada unit ini, struktur tersebut akan diperbarui.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
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
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting ? 'Menyalin...' : 'Salin KPI Sekarang'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
