'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Filter, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AuditLog {
  id: string
  timestamp: string
  user_name: string
  table_name: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS'
  record_id: string
  ip_address?: string
  details: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    user: '',
    table: '',
    operation: '',
  })
  
  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.user) params.append('user', filters.user)
      if (filters.table) params.append('table', filters.table)
      if (filters.operation) params.append('operation', filters.operation)
      
      const response = await fetch(`/api/audit?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setLogs(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    }
    setLoading(false)
  }
  
  useEffect(() => {
    loadLogs()
  }, [filters])
  
  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.user) params.append('user', filters.user)
      if (filters.table) params.append('table', filters.table)
      if (filters.operation) params.append('operation', filters.operation)
      params.append('export', 'true')
      
      const response = await fetch(`/api/audit?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // Convert to CSV and download
        const csv = convertToCSV(data)
        downloadCSV(csv, 'audit-logs.csv')
      }
    } catch (error) {
      console.error('Failed to export audit logs:', error)
    }
  }
  
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ''
    
    const headers = ['Timestamp', 'User', 'Table', 'Operation', 'Record ID', 'IP Address', 'Details']
    const rows = data.map(log => [
      log.timestamp,
      log.user_name || '',
      log.table_name,
      log.operation,
      log.record_id || '',
      log.ip_address || '',
      log.details || ''
    ])
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
  }
  
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }
  
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      user: '',
      table: '',
      operation: '',
    })
  }
  
  const hasActiveFilters = Object.values(filters).some(v => v !== '')
  
  return (
    <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Audit Trail</h1>
            <p className="text-gray-500">View system activity logs</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter audit logs by criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="user">User</Label>
                <Input
                  id="user"
                  placeholder="Search user..."
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="table">Table</Label>
                <Input
                  id="table"
                  placeholder="Table name..."
                  value={filters.table}
                  onChange={(e) => setFilters({ ...filters, table: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="operation">Operation</Label>
                <select
                  id="operation"
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  value={filters.operation}
                  onChange={(e) => setFilters({ ...filters, operation: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="ACCESS">ACCESS</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>Total: {logs.length} records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">{log.timestamp}</TableCell>
                        <TableCell>{log.user_name}</TableCell>
                        <TableCell>{log.table_name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            log.operation === 'CREATE' ? 'bg-green-100 text-green-800' :
                            log.operation === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                            log.operation === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.operation}
                          </span>
                        </TableCell>
                        <TableCell>{log.record_id}</TableCell>
                        <TableCell>{log.ip_address || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
