'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Unit {
  id: string
  code: string
  name: string
  employees?: { count: number }[]
}

interface DeleteUnitDialogProps {
  unit: Unit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteUnitDialog({ unit, open, onOpenChange }: DeleteUnitDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const employeeCount = unit?.employees?.[0]?.count || 0
  
  const handleDelete = async () => {
    if (!unit) return
    
    if (employeeCount > 0) {
      setError('Cannot delete unit with assigned employees. Please reassign employees first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      const { error: deleteError } = await supabase
        .from('m_units')
        .delete()
        .eq('id', unit.id)
      
      if (deleteError) throw deleteError
      
      router.refresh()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Unit</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this unit?
          </DialogDescription>
        </DialogHeader>
        
        {unit && (
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div>
                <span className="font-medium">Code:</span> {unit.code}
              </div>
              <div>
                <span className="font-medium">Name:</span> {unit.name}
              </div>
              <div>
                <span className="font-medium">Employees:</span> {employeeCount}
              </div>
            </div>
            
            {error && (
              <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {employeeCount > 0 && (
              <div className="mt-4 bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
                This unit has {employeeCount} assigned employee(s). Please reassign them before deleting.
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || employeeCount > 0}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
