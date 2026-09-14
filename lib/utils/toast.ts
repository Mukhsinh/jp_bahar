/**
 * Toast Notification Utility
 * Wrapper untuk sonner dengan pesan Bahasa Indonesia
 * 
 * Install: npm install sonner
 */

import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message)
  },
  
  error: (message: string) => {
    sonnerToast.error(message)
  },
  
  info: (message: string) => {
    sonnerToast.info(message)
  },
  
  warning: (message: string) => {
    sonnerToast.warning(message)
  },
  
  loading: (message: string) => {
    return sonnerToast.loading(message)
  },
  
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  }
}

// Common toast messages dalam Bahasa Indonesia
export const toastMessages = {
  // Success messages
  saveSuccess: 'Data berhasil disimpan',
  deleteSuccess: 'Data berhasil dihapus',
  updateSuccess: 'Data berhasil diperbarui',
  createSuccess: 'Data berhasil ditambahkan',
  
  // Error messages
  saveError: 'Gagal menyimpan data',
  deleteError: 'Gagal menghapus data',
  updateError: 'Gagal memperbarui data',
  createError: 'Gagal menambahkan data',
  loadError: 'Gagal memuat data',
  
  // Loading messages
  saving: 'Menyimpan data...',
  deleting: 'Menghapus data...',
  updating: 'Memperbarui data...',
  loading: 'Memuat data...',
  
  // Auth messages
  loginSuccess: 'Berhasil masuk',
  loginError: 'Gagal masuk',
  logoutSuccess: 'Berhasil keluar',
  
  // Generic
  success: 'Berhasil',
  error: 'Terjadi kesalahan',
  networkError: 'Koneksi terputus'
}
