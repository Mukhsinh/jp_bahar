/**
 * Translation constants for Indonesian localization
 */

export const translations = {
  auth: {
    login: 'Masuk',
    logout: 'Keluar',
    email: 'Email',
    password: 'Kata Sandi',
    forgotPassword: 'Lupa Kata Sandi?',
    loginButton: 'Masuk ke Sistem',
    loginError: 'Email atau kata sandi salah',
    sessionExpired: 'Sesi Anda telah berakhir, silakan masuk kembali',
    accountInactive: 'Akun Anda tidak aktif',
    userNotFound: 'Data pengguna tidak ditemukan',
    processing: 'Memproses...',
  },

  nav: {
    dashboard: 'Dashboard',
    units: 'Manajemen Unit',
    users: 'Manajemen Pengguna',
    employees: 'Manajemen Pegawai',
    kpiConfig: 'Konfigurasi KPI',
    pool: 'Manajemen Pool',
    reports: 'Laporan',
    audit: 'Audit Log',
    settings: 'Pengaturan',
    realization: 'Input Realisasi',
    profile: 'Profil',
    notifications: 'Notifikasi',
  },

  common: {
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Ubah',
    add: 'Tambah',
    search: 'Cari',
    filter: 'Filter',
    export: 'Ekspor',
    import: 'Impor',
    loading: 'Memuat...',
    noData: 'Tidak ada data',
    error: 'Terjadi kesalahan',
    success: 'Berhasil',
    confirm: 'Konfirmasi',
    yes: 'Ya',
    no: 'Tidak',
    close: 'Tutup',
    back: 'Kembali',
    submit: 'Kirim',
    reset: 'Reset',
    view: 'Lihat',
    download: 'Unduh',
    refresh: 'Muat Ulang',
    tryAgain: 'Coba Lagi',
    goHome: 'Kembali ke Beranda',
  },

  errors: {
    generic: 'Terjadi kesalahan, silakan coba lagi',
    network: 'Koneksi terputus, periksa internet Anda',
    unauthorized: 'Anda tidak memiliki akses ke halaman ini',
    notFound: 'Halaman tidak ditemukan',
    serverError: 'Terjadi kesalahan pada server',
  },

  validation: {
    required: 'Field ini wajib diisi',
    email: 'Format email tidak valid',
    minLength: 'Minimal {min} karakter',
    maxLength: 'Maksimal {max} karakter',
    number: 'Harus berupa angka',
    positive: 'Harus berupa angka positif',
  },
} as const

export function t(key: string, params?: Record<string, any>): string {
  const keys = key.split('.')
  let value: any = translations

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match
    })
  }

  return value
}
