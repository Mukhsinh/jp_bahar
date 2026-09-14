'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TrendingDown } from 'lucide-react'

interface Performer {
    id: string
    name: string
    unit: string
    score: number
    rank: number
}

interface WorstPerformersProps {
    performers: Performer[]
}

export function WorstPerformers({ performers }: WorstPerformersProps) {
    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return 'text-red-700 bg-red-100'
            case 2: return 'text-red-600 bg-red-50'
            case 3: return 'text-orange-600 bg-orange-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Needs Improvement
                </CardTitle>
                <CardDescription>Pegawai dengan performa terendah bulan ini</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {performers.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Belum ada data performa</p>
                    ) : (
                        performers.map((performer, index) => (
                            <div key={performer.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(index + 1)}`}>
                                        {performer.rank}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                                        <p className="text-xs text-gray-500">{performer.unit}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 justify-end">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                        <span className="text-lg font-bold text-gray-900">{performer.score.toFixed(1)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Skor KPI</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
