'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export default function ForbiddenPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">403 - Akses Ditolak</CardTitle>
          <CardDescription className="text-center">
            Anda tidak memiliki izin untuk mengakses halaman ini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Halaman ini dibatasi untuk pengguna dengan izin khusus. Jika Anda yakin seharusnya memiliki akses, silakan hubungi administrator sistem.
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex-1"
            >
              Ke Dashboard
            </Button>
            <Button
              onClick={() => router.push('/login')}
              className="flex-1"
            >
              Ke Halaman Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
