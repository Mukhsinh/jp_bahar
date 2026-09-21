'use client'

import { useState } from 'react'
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
            const response = await fetch('/api/kpi-config/copy-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitId })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Gagal menyalin struktur KPI')
            }

            alert(result.message || 'Struktur KPI dari BPJS Kesehatan berhasil disalin ke Pendapatan Umum!')
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Error copying BPJS structure to UMUM:', err)
            const errorMsg = err?.message || 'Gagal menyalin struktur KPI'
            setError(errorMsg)
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
