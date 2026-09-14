'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, AlertCircle } from 'lucide-react'

interface KPICategory {
  id: string
  category: 'P1' | 'P2' | 'P3'
  category_name: string
  weight_percentage: number
}

interface KPIIndicator {
  id: string
  category_id: string
  code: string
  name: string
  target_value: number
  weight_percentage: number
  measurement_unit: string | null
}

interface Realization {
  indicator_id: string
  realization_value: number
  achievement_percentage: number
  notes: string
}

interface RealizationFormProps {
  employeeId: string
  period: string
  unitId: string
}

export default function RealizationForm({ employeeId, period, unitId }: RealizationFormProps) {
  const supabase = createClient()
  const { user } = useAuth()
  const [categories, setCategories] = useState<KPICategory[]>([])
  const [indicators, setIndicators] = useState<KPIIndicator[]>([])
  const [realizations, setRealizations] = useState<Record<string, Realization>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadKPIStructure()
  }, [unitId, employeeId, period])

  async function loadKPIStructure() {
    setIsLoading(true)
    try {
      // Load categories for the unit
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('m_kpi_categories')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .order('category')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Load indicators
      const categoryIds = categoriesData?.map(c => c.id) || []
      if (categoryIds.length > 0) {
        const { data: indicatorsData, error: indicatorsError } = await supabase
          .from('m_kpi_indicators')
          .select('*')
          .in('category_id', categoryIds)
          .eq('is_active', true)
          .order('code')

        if (indicatorsError) throw indicatorsError
        setIndicators(indicatorsData || [])

        // Load existing realizations
        const indicatorIds = indicatorsData?.map(i => i.id) || []
        if (indicatorIds.length > 0) {
          const { data: realizationsData, error: realizationsError } = await supabase
            .from('t_realization')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('period', period)
            .in('indicator_id', indicatorIds)

          if (realizationsError) throw realizationsError

          // Convert to map
          const realizationsMap: Record<string, Realization> = {}
          realizationsData?.forEach(r => {
            realizationsMap[r.indicator_id] = {
              indicator_id: r.indicator_id,
              realization_value: r.realization_value,
              achievement_percentage: r.achievement_percentage || 0,
              notes: r.notes || ''
            }
          })
          setRealizations(realizationsMap)
        }
      }
    } catch (error) {
      console.error('Error loading KPI structure:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function calculateAchievement(realizationValue: number, targetValue: number): number {
    if (targetValue === 0) return 0
    return Math.round((realizationValue / targetValue) * 100 * 100) / 100 // Round to 2 decimal places
  }

  function handleRealizationChange(indicatorId: string, value: string, targetValue: number) {
    const realizationValue = parseFloat(value) || 0
    const achievementPercentage = calculateAchievement(realizationValue, targetValue)

    setRealizations(prev => ({
      ...prev,
      [indicatorId]: {
        indicator_id: indicatorId,
        realization_value: realizationValue,
        achievement_percentage: achievementPercentage,
        notes: prev[indicatorId]?.notes || ''
      }
    }))
  }

  function handleNotesChange(indicatorId: string, notes: string) {
    setRealizations(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        indicator_id: indicatorId,
        realization_value: prev[indicatorId]?.realization_value || 0,
        achievement_percentage: prev[indicatorId]?.achievement_percentage || 0,
        notes
      }
    }))
  }

  async function handleSave() {
    // Validate that all indicators have values
    const missingIndicators = indicators.filter(ind => !realizations[ind.id] || realizations[ind.id].realization_value === undefined)
    
    if (missingIndicators.length > 0) {
      alert(`Please fill in all indicator values. Missing: ${missingIndicators.length} indicators`)
      return
    }

    setIsSaving(true)
    try {
      // Prepare data for upsert
      const realizationData = indicators.map(indicator => ({
        employee_id: employeeId,
        indicator_id: indicator.id,
        period: period,
        realization_value: realizations[indicator.id]?.realization_value || 0,
        achievement_percentage: realizations[indicator.id]?.achievement_percentage || 0,
        notes: realizations[indicator.id]?.notes || null,
        created_by: user?.id
      }))

      // Upsert realizations
      const { error } = await supabase
        .from('t_realization')
        .upsert(realizationData, {
          onConflict: 'employee_id,indicator_id,period'
        })

      if (error) throw error

      alert('Realization data saved successfully!')
    } catch (error: any) {
      console.error('Error saving realizations:', error)
      alert(error.message || 'Failed to save realization data')
    } finally {
      setIsSaving(false)
    }
  }

  function getCategoryIndicators(categoryId: string) {
    return indicators.filter(i => i.category_id === categoryId)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No KPI structure configured for this unit.</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator to configure KPI categories and indicators.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const categoryIndicators = getCategoryIndicators(category.id)
        
        if (categoryIndicators.length === 0) return null

        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>
                {category.category} - {category.category_name}
                <span className="ml-2 text-sm font-normal text-gray-600">
                  (Weight: {category.weight_percentage}%)
                </span>
              </CardTitle>
              <CardDescription>
                Input realization values for {categoryIndicators.length} indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryIndicators.map(indicator => {
                  const realization = realizations[indicator.id]
                  const realizationValue = realization?.realization_value || 0
                  const achievementPct = realization?.achievement_percentage || 0

                  return (
                    <div key={indicator.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Indicator Info */}
                        <div className="md:col-span-4">
                          <p className="font-medium">{indicator.name}</p>
                          <p className="text-sm text-gray-600">Code: {indicator.code}</p>
                          <p className="text-sm text-gray-600">
                            Target: {indicator.target_value.toFixed(2)}
                            {indicator.measurement_unit && ` ${indicator.measurement_unit}`}
                          </p>
                          <p className="text-xs text-gray-500">Weight: {indicator.weight_percentage}%</p>
                        </div>

                        {/* Realization Input */}
                        <div className="md:col-span-3">
                          <label className="text-sm font-medium">Realization Value</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={realizationValue || ''}
                            onChange={(e) => handleRealizationChange(indicator.id, e.target.value, indicator.target_value)}
                            placeholder="0.00"
                          />
                        </div>

                        {/* Achievement */}
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium">Achievement</label>
                          <div className="flex items-center h-10">
                            <span className={`text-lg font-semibold ${achievementPct >= 100 ? 'text-green-600' : achievementPct >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {achievementPct.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-3">
                          <label className="text-sm font-medium">Notes</label>
                          <Input
                            value={realization?.notes || ''}
                            onChange={(e) => handleNotesChange(indicator.id, e.target.value)}
                            placeholder="Optional notes"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-5 w-5 mr-2" />
          {isSaving ? 'Saving...' : 'Save All Realizations'}
        </Button>
      </div>
    </div>
  )
}
