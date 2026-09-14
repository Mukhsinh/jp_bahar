'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error)
    
    // Check if it's a chunk loading error and auto-reload
    const isChunkLoadError = 
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed')
    
    if (isChunkLoadError) {
      console.log('Chunk load error detected in error.tsx, reloading...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }, [error])

  // Check if it's a chunk loading error
  const isChunkLoadError = 
    error.message.includes('Loading chunk') ||
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')

  if (isChunkLoadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <CardTitle>Memuat Pembaruan...</CardTitle>
            </div>
            <CardDescription>
              Aplikasi sedang diperbarui. Mohon tunggu sebentar...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Halaman ini akan dimuat ulang secara otomatis dalam beberapa saat.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>Terjadi Kesalahan</CardTitle>
          </div>
          <CardDescription>
            {error.message || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              Coba Lagi
            </Button>
            <Button
              onClick={() => window.location.href = '/login'}
              variant="outline"
              className="flex-1"
            >
              Ke Halaman Login
            </Button>
          </div>
          {error.digest && (
            <p className="text-xs text-gray-500 text-center">
              ID Kesalahan: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
