'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Filter, RefreshCw, BarChart3, AlertCircle, Copy, Loader2, ShieldCheck, Lock, RotateCcw, CheckCheck, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import AssessmentTable from './AssessmentTable'
import AssessmentReports from './AssessmentReports'
import AddAssessmentPeriodDialog from './AddAssessmentPeriodDialog'
import type { AssessmentStatus } from '@/lib/types/assessment.types'

interface AssessmentPageContentProps {
  currentEmployee: {
    id: string
    role: string
    unit_id: string
    full_name: string
  }
  availablePeriods: string[]
}

export default function AssessmentPageContent({
  currentEmployee,
  availablePeriods: availablePeriodsProp
}: AssessmentPageContentProps) {
  const [activeRevenueType, setActiveRevenueType] = useState<'bpjs' | 'umum'>('bpjs')
  const [availablePeriods, setAvailablePeriods] = useState<string[]>(availablePeriodsProp || [])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [isApproved, setIsApproved] = useState(false)
  const [approvalData, setApprovalData] = useState<any>(null)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [employees, setEmployees] = useState<AssessmentStatus[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<AssessmentStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [availableUnits, setAvailableUnits] = useState<{ id: string, name: string }[]>([])
  const [unitFilter, setUnitFilter] = useState<string>(
    currentEmployee.role === 'unit_manager' ? currentEmployee.unit_id : 'all'
  )
  const [isAddPeriodDialogOpen, setIsAddPeriodDialogOpen] = useState(false)
  const [summary, setSummary] = useState({
    total_employees: 0,
    completed: 0,
    started: 0,
    partial: 0,
    not_started: 0,
    completion_rate: 0
  })
  const [copyingUnit, setCopyingUnit] = useState(false)

  // Load periods and units sequentially to avoid rate limits
  const loadInitialData = async () => {
    try {
      // Load periods first
      const periodsRes = await fetch('/api/assessment/reports?action=periods')
      if (periodsRes.ok) {
        const periodsData = await periodsRes.json()
        if (periodsData.success && periodsData.periods) {
          setAvailablePeriods(periodsData.periods)
        }
      }

      // Then load units (sequential to avoid auth rate limit)
      const unitsRes = await fetch('/api/assessment/reports?action=units')
      if (unitsRes.ok) {
        const unitsData = await unitsRes.json()
        if (unitsData.success && unitsData.units) {
          setAvailableUnits(unitsData.units)
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  // Load employees for assessment
  const loadEmployees = async (retryCount = 0) => {
    if (!selectedPeriod) return

    setLoading(true)
    setError(null)

    try {
      const unitParam = unitFilter !== 'all' ? `&unit_id=${unitFilter}` : ''
      const response = await fetch(`/api/assessment/employees?period=${selectedPeriod}${unitParam}&revenue_type=${activeRevenueType}`)
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Gagal memuat data' }))

        // Handle temporary 401 race condition with a silent retry
        if (response.status === 401 && retryCount < 2) {
          console.warn(`[loadEmployees] 401 received, retrying (${retryCount + 1}/2)...`)
          await new Promise(res => setTimeout(res, 500))
          return loadEmployees(retryCount + 1)
        }

        setError(errorData.error || 'Gagal memuat data pegawai')
        setEmployees([])
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      if (retryCount < 2) {
        await new Promise(res => setTimeout(res, 500))
        return loadEmployees(retryCount + 1)
      }
      setError('Terjadi kesalahan saat memuat data')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  // Load assessment status summary
  const loadSummary = async (retryCount = 0) => {
    if (!selectedPeriod) return

    try {
      const unitParam = unitFilter !== 'all' ? `&unit_id=${unitFilter}` : ''
      const response = await fetch(`/api/assessment/status?period=${selectedPeriod}${unitParam}&revenue_type=${activeRevenueType}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary || {
          total_employees: 0,
          completed: 0,
          started: 0,
          partial: 0,
          not_started: 0,
          completion_rate: 0
        })
      } else if (response.status === 401 && retryCount < 3) {
        await new Promise(res => setTimeout(res, 600))
        return loadSummary(retryCount + 1)
      }
    } catch (error) {
      console.error('Error loading summary:', error)
    }
  }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter employees based on search and status
  useEffect(() => {
    let filtered = employees

    // Apply search filter
    if (debouncedSearchTerm) {
      const lowerSearch = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(emp =>
        emp.full_name.toLowerCase().includes(lowerSearch) ||
        emp.unit_name.toLowerCase().includes(lowerSearch)
      )
    }

    // Apply unit filter (additional safety for unit managers)
    if (unitFilter && unitFilter !== 'all') {
      filtered = filtered.filter(emp => emp.unit_id === unitFilter)
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.status === statusFilter)
    }

    setFilteredEmployees(filtered)
  }, [employees, debouncedSearchTerm, statusFilter, unitFilter])

  // Load all initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load approval status for selected period & revenue type
  const loadApprovalStatus = async (period: string, revenueType: string) => {
    if (!period) {
      setIsApproved(false)
      setApprovalData(null)
      return
    }
    try {
      const res = await fetch(`/api/assessment/approval?period=${period}&revenue_type=${revenueType}`)
      if (res.ok) {
        const data = await res.json()
        setIsApproved(data.isApproved || false)
        setApprovalData(data.approval || null)
      } else {
        setIsApproved(false)
        setApprovalData(null)
      }
    } catch (err) {
      console.error('Error loading approval status:', err)
      setIsApproved(false)
      setApprovalData(null)
    }
  }

  // Load data when period or unit filter changes - stagger calls to avoid auth rate limit
  useEffect(() => {
    if (selectedPeriod && selectedPeriod !== 'null' && selectedPeriod !== 'undefined') {
      const loadData = async () => {
        await loadEmployees()
        // Small delay to avoid concurrent auth.getUser() calls hitting rate limit
        await loadSummary()
        await loadApprovalStatus(selectedPeriod, activeRevenueType)
      }
      loadData()
    } else {
      setLoading(false)
      setEmployees([])
      setFilteredEmployees([])
      setSummary({
        total_employees: 0,
        completed: 0,
        started: 0,
        partial: 0,
        not_started: 0,
        completion_rate: 0
      })
      setIsApproved(false)
      setApprovalData(null)
    }
  }, [selectedPeriod, unitFilter, activeRevenueType])

  // Handle refresh
  const handleRefresh = () => {
    if (!selectedPeriod) return
    loadEmployees()
    loadSummary()
    loadApprovalStatus(selectedPeriod, activeRevenueType)
  }

  // Handle assessment completion (callback from table)
  const handleAssessmentComplete = () => {
    loadEmployees()
    loadSummary()
    loadApprovalStatus(selectedPeriod, activeRevenueType)
  }

  // Handle approve period
  const handleApprovePeriod = async () => {
    if (!selectedPeriod) return
    if (summary.completion_rate < 100 || summary.total_employees === 0) {
      alert('Persetujuan tidak dapat dilakukan: Penilaian belum mencapai 100% selesai.')
      return
    }

    if (!confirm(`Konfirmasi Persetujuan Penilaian:\n\nApakah Anda yakin ingin MENYETUJUI dan MENGUNCI periode penilaian ${selectedPeriod} (${activeRevenueType.toUpperCase()})?\n\nSetelah disetujui:\n- Penilaian KPI periode ini akan dikunci dan berstatus FINAL\n- Penilaian tidak dapat diedit, ditambah, atau dihapus\n- Preview laporan hasil penilaian akan ditampilkan resmi.`)) {
      return
    }

    setApprovalLoading(true)
    try {
      const response = await fetch('/api/assessment/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: selectedPeriod,
          revenue_type: activeRevenueType,
          action: 'approve'
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Periode penilaian berhasil disetujui & dikunci!')
        await loadApprovalStatus(selectedPeriod, activeRevenueType)
        await loadEmployees()
        await loadSummary()
      } else {
        alert('Gagal menyetujui: ' + (data.error || 'Terjadi kesalahan sistem'))
      }
    } catch (err) {
      console.error('Approve period error:', err)
      alert('Terjadi kesalahan saat melakukan persetujuan periode')
    } finally {
      setApprovalLoading(false)
    }
  }

  // Handle unapprove period
  const handleUnapprovePeriod = async () => {
    if (!selectedPeriod) return
    if (!confirm(`Konfirmasi Pembatalan Persetujuan:\n\nApakah Anda yakin ingin MEMBATALKAN persetujuan periode ${selectedPeriod} (${activeRevenueType.toUpperCase()})?\n\nSetelah persetujuan dibatalkan:\n- Kunci penilaian akan dibuka kembali\n- Penilaian KPI dapat diedit atau diperbarui kembali.`)) {
      return
    }

    setApprovalLoading(true)
    try {
      const response = await fetch('/api/assessment/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: selectedPeriod,
          revenue_type: activeRevenueType,
          action: 'unapprove'
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message || 'Persetujuan berhasil dibatalkan. Penilaian kini dapat diedit kembali.')
        await loadApprovalStatus(selectedPeriod, activeRevenueType)
        await loadEmployees()
        await loadSummary()
      } else {
        alert('Gagal membatalkan persetujuan: ' + (data.error || 'Terjadi kesalahan sistem'))
      }
    } catch (err) {
      console.error('Unapprove period error:', err)
      alert('Terjadi kesalahan saat membatalkan persetujuan periode')
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleBulkCopy = async () => {
    if (!selectedPeriod) return
    if (isApproved) {
      alert('Periode penilaian ini telah disetujui dan terkunci. Tidak dapat menyalin data penilaian.')
      return
    }

    // 1. Identify unit_id
    let unitId = ''
    let unitName = ''

    if (currentEmployee.role === 'unit_manager') {
      unitId = currentEmployee.unit_id
      unitName = 'unit Anda'
    } else {
      // For superadmin, check if the current view is focused on one unit
      const uniqueUnits = Array.from(new Set(filteredEmployees.map(e => JSON.stringify({ id: e.unit_id, name: e.unit_name }))))
      if (uniqueUnits.length === 0) {
        alert('Tidak ada pegawai untuk disalin.')
        return
      }
      if (uniqueUnits.length !== 1) {
        alert('Mohon filter pencarian berdasarkan unit spesifik terlebih dahulu agar sistem dapat melakukan penyalinan massal untuk unit tersebut.')
        return
      }
      const unitData = JSON.parse(uniqueUnits[0])
      unitId = unitData.id
      unitName = unitData.name
    }

    // 2. Identify previous period (assuming descending sort)
    const currentIndex = availablePeriods.indexOf(selectedPeriod)
    if (currentIndex === -1 || currentIndex === availablePeriods.length - 1) {
      alert('Tidak ditemukan periode sebelumnya (prioritas periode di bawah pilihan saat ini) untuk disalin.')
      return
    }
    const previousPeriod = availablePeriods[currentIndex + 1]

    if (!confirm(`Konfirmasi: Salin penilaian SELURUH pegawai di ${unitName} dari periode ${previousPeriod} ke periode ${selectedPeriod}?\n\nPeringatan: Data penilaian yang sudah ada di periode ${selectedPeriod} untuk pegawai tersebut akan diperbarui/ditimpa.`)) {
      return
    }

    setCopyingUnit(true)
    try {
      const response = await fetch('/api/assessment/bulk-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          current_period: selectedPeriod,
          previous_period: previousPeriod
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message || 'Penyalinan massal berhasil!')
        handleRefresh()
      } else {
        alert('Gagal: ' + (data.error || 'Terjadi kesalahan'))
      }
    } catch (error) {
      console.error('Bulk copy error:', error)
      alert('Terjadi kesalahan sistem saat melakukan penyalinan massal.')
    } finally {
      setCopyingUnit(false)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue Stream Switcher */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-2 border shadow-sm max-w-md">
        <button
          onClick={() => setActiveRevenueType('bpjs')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeRevenueType === 'bpjs'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-200/60'
            }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          BPJS Kesehatan
        </button>
        <button
          onClick={() => setActiveRevenueType('umum')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeRevenueType === 'umum'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-200/60'
            }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300 animate-pulse" />
          Pendapatan UMUM
        </button>
      </div>

      {/* Period Selection and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="border-blue-100 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Periode Penilaian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full font-medium">
                  <SelectValue placeholder="-- Pilih Periode Penilaian --" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(period => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setIsAddPeriodDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Tambah Periode
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedPeriod ? summary.total_employees : <span className="text-gray-400 font-normal">-</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod ? 'Pegawai aktif' : 'Pilih periode dahulu'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Selesai Dinilai</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPeriod ? (
              <div className="text-2xl font-bold text-green-600">
                {summary.completed} <span className="text-sm text-muted-foreground font-normal">dari {summary.total_employees}</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-400 font-normal">-</div>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedPeriod ? `${summary.started} orang telah mulai dinilai` : 'Pilih periode dahulu'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tingkat Penyelesaian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {selectedPeriod ? `${summary.completion_rate}%` : <span className="text-gray-400 font-normal">-</span>}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: selectedPeriod ? `${summary.completion_rate}%` : '0%' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Status & Preview Banner for Selected Period */}
      {selectedPeriod && isApproved && (
        <div className="bg-emerald-50/90 border-2 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-600 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md mt-0.5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
                    Periode Penilaian {selectedPeriod} Telah Disetujui
                  </h3>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 font-semibold text-xs shadow-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Terkunci & Final
                  </Badge>
                  <Badge variant="outline" className="border-emerald-400 text-emerald-800 bg-emerald-100/60 text-xs font-semibold uppercase">
                    {activeRevenueType === 'bpjs' ? 'BPJS Kesehatan' : 'Pendapatan UMUM'}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                  Disetujui oleh <span className="font-semibold">{approvalData?.approved_by_name || 'Administrator'}</span> pada{' '}
                  {approvalData?.approved_at ? new Date(approvalData.approved_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'}.
                  Data penilaian KPI periode ini terkunci permanen dan tidak dapat diedit atau dihapus.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnapprovePeriod}
              disabled={approvalLoading}
              className="border-red-200 text-red-700 bg-white hover:bg-red-50 hover:border-red-300 shadow-sm shrink-0 self-start sm:self-auto font-medium"
            >
              {approvalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Batalkan Persetujuan
            </Button>
          </div>

          {/* Preview Ringkasan Periode Disetujui */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/80 text-xs">
            <div className="bg-white/90 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-200/60 shadow-xs">
              <span className="text-slate-500 block mb-0.5">Total Pegawai</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{summary.total_employees} Pegawai Aktif</span>
            </div>
            <div className="bg-white/90 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-200/60 shadow-xs">
              <span className="text-slate-500 block mb-0.5">Status Penilaian</span>
              <span className="font-bold text-emerald-700 text-sm">100% Selesai Dinilai</span>
            </div>
            <div className="bg-white/90 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-200/60 shadow-xs">
              <span className="text-slate-500 block mb-0.5">Akses Form</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Hanya-Lihat (Read-Only)
              </span>
            </div>
            <div className="bg-white/90 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-200/60 shadow-xs">
              <span className="text-slate-500 block mb-0.5">Skema Pendapatan</span>
              <span className="font-bold text-blue-700 text-sm uppercase">{activeRevenueType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Ready to Approve Banner (when 100% completed but not yet approved) */}
      {selectedPeriod && !isApproved && summary.completion_rate === 100 && summary.total_employees > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border-2 border-blue-300 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md mt-0.5">
              <CheckCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-blue-950 dark:text-blue-100">
                  Penilaian Periode {selectedPeriod} Telah Selesai 100%!
                </h3>
                <Badge className="bg-blue-600 text-white text-xs shadow-xs">
                  Siap Disetujui
                </Badge>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                Seluruh {summary.total_employees} pegawai telah selesai dinilai. Silakan lakukan persetujuan penilaian untuk mengunci periode ini secara resmi.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleApprovePeriod}
            disabled={approvalLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shrink-0 self-start sm:self-auto px-5 py-2.5"
          >
            {approvalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Setujui Periode Penilaian
          </Button>
        </div>
      )}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="assessment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessment">Penilaian</TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            Laporan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Daftar Pegawai</CardTitle>
                  <CardDescription>
                    {selectedPeriod
                      ? `Kelola penilaian KPI untuk pegawai di periode ${selectedPeriod}`
                      : 'Silakan pilih periode penilaian terlebih dahulu di atas'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleBulkCopy}
                    variant="outline"
                    size="sm"
                    disabled={!selectedPeriod || isApproved || loading || copyingUnit}
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    title={isApproved ? 'Periode telah disetujui & terkunci' : 'Salin penilaian dari periode sebelumnya'}
                  >
                    {copyingUnit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
                    Salin Penilaian Unit
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    disabled={!selectedPeriod || loading || copyingUnit}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedPeriod ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl my-4">
                  <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-600">
                    <CalendarClock className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Pilih Periode Penilaian Terlebih Dahulu
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                    Daftar pegawai yang akan dinilai tidak ditampilkan sebelum periode penilaian dipilih. Silakan pilih salah satu periode penilaian di atas untuk mulai melakukan penilaian KPI.
                  </p>
                  {availablePeriods.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                      {availablePeriods.slice(0, 4).map(p => (
                        <Button
                          key={p}
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPeriod(p)}
                          className="border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold"
                        >
                          Pilih Periode {p}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Cari nama pegawai atau unit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Unit Filter - Only for Superadmin */}
                      {currentEmployee.role === 'superadmin' && (
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-gray-400" />
                          <Select value={unitFilter} onValueChange={setUnitFilter}>
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Pilih Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Semua Unit</SelectItem>
                              {availableUnits.map(unit => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="Belum Dinilai">Belum Dinilai</SelectItem>
                            <SelectItem value="Sebagian">Sebagian</SelectItem>
                            <SelectItem value="Selesai">Selesai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Status Legend */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="destructive" className="text-xs">
                      Belum Dinilai
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      Sebagian
                    </Badge>
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      Selesai
                    </Badge>
                    {isApproved && (
                      <Badge className="text-xs bg-emerald-600 text-white font-semibold">
                        <Lock className="h-3 w-3 mr-1" />
                        Periode Terkunci (Disetujui)
                      </Badge>
                    )}
                  </div>

                  {/* Employee Table */}
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p>Memuat data pegawai...</p>
                    </div>
                  ) : filteredEmployees.length > 0 ? (
                    <AssessmentTable
                      employees={filteredEmployees}
                      period={selectedPeriod}
                      revenueType={activeRevenueType}
                      loading={loading}
                      isApproved={isApproved}
                      onAssessmentComplete={handleAssessmentComplete}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="bg-yellow-50 p-3 rounded-full mb-4">
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || unitFilter !== 'all' || statusFilter !== 'all'
                          ? 'Tidak ada pegawai yang sesuai dengan filter'
                          : `Tidak ada data untuk periode ${selectedPeriod}`}
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                        {searchTerm || unitFilter !== 'all' || statusFilter !== 'all'
                          ? 'Coba ubah kata kunci pencarian atau reset filter untuk melihat data lainnya.'
                          : `Daftar pegawai tidak muncul? Pastikan periode ${selectedPeriod} sudah dikonfigurasi di menu Pengaturan Pool dan karyawan sudah terdaftar di unit yang dipilih.`}
                      </p>
                      {(searchTerm || unitFilter !== 'all' || statusFilter !== 'all') && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('');
                            setUnitFilter(currentEmployee.role === 'unit_manager' ? currentEmployee.unit_id : 'all');
                            setStatusFilter('all');
                          }}
                        >
                          Reset Filter
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <AssessmentReports
            availablePeriods={availablePeriods}
            selectedPeriod={selectedPeriod}
          />
        </TabsContent>
      </Tabs>

      <AddAssessmentPeriodDialog
        isOpen={isAddPeriodDialogOpen}
        onClose={() => setIsAddPeriodDialogOpen(false)}
        onSelect={(period) => {
          if (!availablePeriods.includes(period)) {
            const newList = [period, ...availablePeriods].sort((a, b) => b.localeCompare(a))
            setAvailablePeriods(newList)
          }
          setSelectedPeriod(period)
        }}
        existingPeriods={availablePeriods}
      />
    </div>
  )
}