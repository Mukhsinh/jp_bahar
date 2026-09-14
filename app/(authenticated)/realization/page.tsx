'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, Download, AlertCircle } from 'lucide-react'
import RealizationForm from '@/components/realization/RealizationForm'
interface Employee {
  id: string
  employee_code: string
  full_name: string
  unit_id: string
}

interface ImportError {
  row: number
  field: string
  message: string
}

export default function RealizationInputPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadEmployees()
    }
  }, [user])

  useEffect(() => {
    // Set default period to current month
    const now = new Date()
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedPeriod(defaultPeriod)
  }, [])

  async function loadEmployees() {
    if (!user?.unit_id) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      // Load employees from the same unit (RLS will filter automatically)
      const { data, error } = await supabase
        .from('m_employees')
        .select('id, employee_code, full_name, unit_id')
        .eq('unit_id', user.unit_id)
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setEmployees(data || [])

      if (data && data.length > 0 && !selectedEmployee) {
        setSelectedEmployee(data[0].id)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file import
  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportErrors([])
    setImportSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/realization', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setImportSuccess(result.message)
        // Reload data if needed
        if (selectedEmployee) {
          // Trigger reload of realization form
          window.location.reload()
        }
      } else if (result.errors) {
        setImportErrors(result.errors)
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportErrors([{
        row: 0,
        field: 'general',
        message: (error as Error).message,
      }])
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  // Download template
  async function handleDownloadTemplate() {
    try {
      const response = await fetch('/api/import/template?type=realization')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'realization-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Template download error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-600">No employees found in your unit.</p>
                <p className="text-sm text-gray-500 mt-2">Contact your administrator to add employees.</p>
              </div>
            </CardContent>
          </Card>
        </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Realization Input</h1>
          <p className="text-gray-600 mt-1">Input KPI realization data for employees in your unit</p>
        </div>

        {/* Bulk Import Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import</CardTitle>
            <CardDescription>Import realization data from Excel file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Button disabled={isImporting}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Excel'}
                </Button>
              </div>
            </div>

            {/* Import Success Message */}
            {importSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
                {importSuccess}
              </div>
            )}

            {/* Import Errors */}
            {importErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">Import Errors</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Found {importErrors.length} error(s) in the import file:
                    </p>
                  </div>
                </div>
                <div className="mt-3 max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-red-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Field</th>
                        <th className="px-3 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importErrors.map((error, idx) => (
                        <tr key={idx} className="border-t border-red-200">
                          <td className="px-3 py-2">{error.row}</td>
                          <td className="px-3 py-2">{error.field}</td>
                          <td className="px-3 py-2">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selection Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Select Employee and Period</CardTitle>
            <CardDescription>Choose an employee and period to input realization data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} - {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Realization Form */}
        {selectedEmployee && selectedPeriod && (
          <RealizationForm
            employeeId={selectedEmployee}
            period={selectedPeriod}
            unitId={user?.unit_id || ''}
          />
        )}
      </div>
  )
}
