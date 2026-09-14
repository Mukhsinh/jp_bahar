'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/useAuth'
import { changePassword } from '@/lib/services/password.service'
import { User, Lock } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Kata sandi baru tidak cocok')
      setLoading(false)
      return
    }
    
    const result = await changePassword(currentPassword, newPassword)
    
    if (result.success) {
      setSuccess('Kata sandi berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowChangePassword(false)
    } else {
      setError(result.error || 'Gagal mengubah kata sandi')
    }
    
    setLoading(false)
  }
  
  if (authLoading) {
    return (
      <div className="p-6">
        <p>Memuat...</p>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="p-6">
        <p>Tidak terautentikasi</p>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-gray-500">Kelola profil dan pengaturan Anda</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pribadi
            </CardTitle>
            <CardDescription>Detail akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <p className="text-lg">{user.full_name || '-'}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <Label>Role</Label>
              <p className="text-lg capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>Kelola kata sandi Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {!showChangePassword ? (
              <Button onClick={() => setShowChangePassword(true)}>
                Ubah Kata Sandi
              </Button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimal 8 karakter dengan 1 huruf besar, 1 angka, dan 1 karakter khusus
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                    {success}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowChangePassword(false)
                      setError('')
                      setSuccess('')
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Mengubah...' : 'Ubah Kata Sandi'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
