'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Footer } from '@/components/layout/Footer'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  
  const validatePassword = (pwd: string): { valid: boolean; error?: string } => {
    if (pwd.length < 8) {
      return { valid: false, error: 'Kata sandi harus minimal 8 karakter' }
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, error: 'Kata sandi harus mengandung minimal 1 huruf besar' }
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, error: 'Kata sandi harus mengandung minimal 1 angka' }
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return { valid: false, error: 'Kata sandi harus mengandung minimal 1 karakter khusus' }
    }
    return { valid: true }
  }
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Validate password
    const validation = validatePassword(password)
    if (!validation.valid) {
      setError(validation.error || 'Kata sandi tidak valid')
      setLoading(false)
      return
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok')
      setLoading(false)
      return
    }
    
    try {
      const supabase = createClient()
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        setError('Gagal mereset kata sandi. Silakan coba lagi.')
        setLoading(false)
        return
      }
      
      setSuccess(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (err) {
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.')
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Reset Kata Sandi</CardTitle>
            <CardDescription className="text-center">
              Masukkan kata sandi baru Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                  Kata sandi berhasil direset! Mengalihkan ke halaman login...
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Kata Sandi Baru</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-gray-500">
                    Minimal 8 karakter dengan 1 huruf besar, 1 angka, dan 1 karakter khusus
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********"
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Mereset...' : 'Reset Kata Sandi'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
