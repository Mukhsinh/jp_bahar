'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'

interface AddAssessmentPeriodDialogProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (period: string) => void
    existingPeriods: string[]
}

const AddAssessmentPeriodDialog: React.FC<AddAssessmentPeriodDialogProps> = ({
    isOpen,
    onClose,
    onSelect,
    existingPeriods,
}) => {
    const [availablePools, setAvailablePools] = useState<string[]>([])
    const [selectedPool, setSelectedPool] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            loadAvailablePools()
        }
    }, [isOpen])

    const loadAvailablePools = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/assessment/reports?action=periods')
            const data = await response.json()

            if (data.periods) {
                // Filter out periods that are already in the assessment list
                const filtered = data.periods.filter((p: string) => !existingPeriods.includes(p))
                setAvailablePools(filtered)
            } else {
                setError('Gagal memuat data pool')
            }
        } catch (err) {
            console.error('Error loading pools:', err)
            setError('Terjadi kesalahan saat memuat data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = () => {
        if (selectedPool) {
            onSelect(selectedPool)
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tambah Periode Penilaian</DialogTitle>
                    <DialogDescription>
                        Pilih periode dari data Pool yang tersedia untuk mulai melakukan penilaian.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="period-select" className="text-sm font-medium">
                                Pilih Periode
                            </label>
                            <Select
                                value={selectedPool}
                                onValueChange={setSelectedPool}
                                disabled={isLoading || availablePools.length === 0}
                            >
                                <SelectTrigger id="period-select">
                                    <SelectValue placeholder={
                                        isLoading ? 'Memuat...' :
                                            availablePools.length === 0 ? 'Tidak ada periode baru' :
                                                'Pilih bulan/tahun'
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePools.map((period) => (
                                        <SelectItem key={period} value={period}>
                                            {period}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {availablePools.length === 0 && !isLoading && !error && (
                                <p className="text-xs text-yellow-600 mt-1">
                                    Semua periode pool yang tersedia sudah ditambahkan ke daftar penilaian.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedPool || isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Tambah Ke Daftar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddAssessmentPeriodDialog
