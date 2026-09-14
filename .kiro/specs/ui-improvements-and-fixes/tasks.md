# Implementation Plan: UI Improvements and Fixes

## Overview

Implementasi perbaikan UI dan struktur data sistem JASPEL dengan pendekatan bertahap: migrasi database, update komponen, lokalisasi, dan perbaikan visual.

## Tasks

- [x] 1. Buat migrasi database untuk tabel baru
  - Buat file migration untuk tabel t_user dan m_pegawai
  - Tambahkan indexes untuk performa
  - Tambahkan RLS policies untuk keamanan
  - Buat fungsi migrasi data dari m_employees
  - _Requirements: 1.3, 1.4, 2.3_

- [x] 2. Update TypeScript types untuk struktur baru
  - Tambahkan interface User dan Pegawai di database.types.ts
  - Tambahkan CreateUserInput dan CreatePegawaiInput
  - Tambahkan UpdateUserInput dan UpdatePegawaiInput
  - _Requirements: 1.3, 1.4, 2.3_

- [x] 3. Buat service layer untuk User Management
  - Buat file lib/services/user-management.service.ts
  - Implementasi getUsers dengan pagination dan search
  - Implementasi createUser dengan validasi
  - Implementasi updateUser dengan validasi
  - Implementasi deactivateUser
  - _Requirements: 1.1, 1.5, 6.2_

- [x] 4. Buat service layer untuk Master Pegawai
  - Buat file lib/services/pegawai.service.ts
  - Implementasi getPegawai dengan pagination dan search
  - Implementasi createPegawai dengan validasi
  - Implementasi updatePegawai dengan validasi
  - Implementasi deactivatePegawai
  - _Requirements: 2.1, 2.2, 2.6_

- [x] 5. Buat halaman Master Pegawai
  - [x] 5.1 Buat struktur folder app/admin/pegawai
    - Buat file page.tsx untuk halaman utama
    - Buat file actions.ts untuk server actions
    - _Requirements: 2.1_
  
  - [x] 5.2 Buat komponen PegawaiTable
    - Buat file components/pegawai/PegawaiTable.tsx
    - Implementasi tabel dengan kolom lengkap
    - Tambahkan tombol Edit dan Nonaktifkan
    - _Requirements: 2.2, 2.5_
  
  - [x] 5.3 Buat komponen PegawaiFormDialog
    - Buat file components/pegawai/PegawaiFormDialog.tsx
    - Implementasi form untuk create dan edit
    - Tambahkan validasi form
    - _Requirements: 2.3, 2.4_
  
  - [x] 5.4 Implementasi fitur pencarian dan pagination
    - Tambahkan search input dengan debounce
    - Implementasi pagination dengan 50 data per halaman
    - _Requirements: 2.6, 2.7_

- [x] 6. Update halaman User Management
  - [x] 6.1 Update app/admin/users/actions.ts
    - Ganti getEmployeesWithAuth dengan getUsers
    - Update untuk menggunakan tabel t_user
    - Hapus dependency ke auth.admin API dari client
    - _Requirements: 1.1, 6.1, 6.2_
  
  - [x] 6.2 Update app/admin/users/page.tsx
    - Ganti referensi getEmployees dengan getUsers
    - Update interface dan types
    - Perbaiki error "getEmployees is not defined"
    - _Requirements: 1.1, 6.1, 6.3_
  
  - [x] 6.3 Update components/users/UserTable.tsx
    - Update untuk menggunakan interface User baru
    - Update kolom tabel sesuai struktur baru
    - _Requirements: 1.1, 6.3_
  
  - [x] 6.4 Update components/users/UserFormDialog.tsx
    - Update form untuk struktur t_user
    - Tambahkan dropdown untuk memilih pegawai
    - _Requirements: 1.5_

- [ ] 7. Implementasi refresh manual di semua halaman
  - [ ] 7.1 Update halaman User Management
    - Tambahkan tombol Muat Ulang
    - Hapus auto-refresh
    - Implementasi loading state
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 7.2 Update halaman Master Pegawai
    - Tambahkan tombol Muat Ulang
    - Implementasi loading state
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ] 7.3 Update halaman Units
    - Tambahkan tombol Muat Ulang
    - Hapus auto-refresh
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 7.4 Update halaman Pool Management
    - Tambahkan tombol Muat Ulang
    - Hapus auto-refresh
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 7.5 Update halaman KPI Configuration
    - Tambahkan tombol Muat Ulang
    - Hapus auto-refresh
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 7.6 Pastikan refresh mempertahankan state
    - Test filter preservation
    - Test pagination preservation
    - _Requirements: 3.5_

- [-] 8. Lokalisasi bahasa Indonesia
  - [x] 8.1 Update Sidebar menu labels
    - Ubah semua label menu ke bahasa Indonesia
    - Update tooltips jika ada
    - _Requirements: 4.1_
  
  - [ ] 8.2 Update halaman User Management
    - Ubah judul halaman
    - Ubah label form
    - Ubah label tabel
    - Ubah label tombol
    - Ubah pesan error dan sukses
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [ ] 8.3 Update halaman Master Pegawai
    - Ubah judul halaman
    - Ubah label form
    - Ubah label tabel
    - Ubah label tombol
    - Ubah pesan error dan sukses
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [ ] 8.4 Update halaman Units
    - Ubah semua teks ke bahasa Indonesia
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [ ] 8.5 Update halaman Pool Management
    - Ubah semua teks ke bahasa Indonesia
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [ ] 8.6 Update halaman KPI Configuration
    - Ubah semua teks ke bahasa Indonesia
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [ ] 8.7 Update halaman Reports
    - Ubah semua teks ke bahasa Indonesia
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [ ] 8.8 Update halaman Audit
    - Ubah semua teks ke bahasa Indonesia
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [x] 8.9 Update halaman Settings
    - Ubah semua teks ke bahasa Indonesia
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [ ] 8.10 Update halaman Dashboard (Admin, Manager, Employee)
    - Ubah semua teks ke bahasa Indonesia
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_
  
  - [ ] 8.11 Update halaman Login dan Profile
    - Ubah semua teks ke bahasa Indonesia
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 9. Perbaikan icon Sidebar dan Pool Management
  - [x] 9.1 Perbaiki stabilitas Sidebar
    - Identifikasi penyebab sidebar kadang muncul/hilang
    - Perbaiki state management sidebar
    - Pastikan sidebar konsisten di semua halaman
    - Test navigasi antar halaman
    - _Requirements: 5.1_
  
  - [x] 9.2 Update Sidebar icons
    - Perbesar ukuran icon dari h-4 w-4 ke h-5 w-5
    - Tambahkan warna berbeda untuk setiap menu
    - Gunakan warna cerah dan kontras
    - Update active state dengan warna lebih terang
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 9.3 Update Pool Management icons
    - Ganti DollarSign dengan Wallet di menu sidebar
    - Ganti DollarSign dengan Wallet di halaman pool
    - _Requirements: 5.5_
  
  - [x] 9.4 Update Settings Tax Configuration icons
    - Ganti DollarSign dengan Receipt di Tax Configuration section
    - _Requirements: 5.6_
  
  - [x] 9.5 Verifikasi semua icon dari lucide-react
    - Pastikan semua icon yang digunakan tersedia
    - _Requirements: 5.7_

- [x] 10. Jalankan migrasi database
  - Jalankan migration file menggunakan Supabase MCP tools
  - Verifikasi tabel t_user dan m_pegawai terbuat
  - Verifikasi indexes dan RLS policies
  - Jalankan fungsi migrasi data
  - Verifikasi data ter-migrate dengan benar
  - _Requirements: 1.3, 1.4, 2.3_

- [ ] 11. Testing dan verifikasi
  - [ ] 11.1 Test User Management
    - Test create user baru
    - Test edit user
    - Test deactivate user
    - Test search dan pagination
    - Verifikasi tidak ada error 403
    - _Requirements: 1.1, 1.5, 6.1, 6.2, 6.3_
  
  - [ ] 11.2 Test Master Pegawai
    - Test create pegawai baru
    - Test edit pegawai
    - Test deactivate pegawai
    - Test search dan pagination
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [ ] 11.3 Test refresh manual
    - Test tombol refresh di semua halaman
    - Verifikasi state preservation
    - Verifikasi loading indicator
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [ ] 11.4 Test lokalisasi
    - Verifikasi semua teks dalam bahasa Indonesia
    - Test di semua halaman
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [ ] 11.5 Test sidebar stability
    - Test sidebar muncul konsisten di semua halaman
    - Test navigasi antar halaman tidak membuat sidebar hilang
    - Test refresh halaman tidak membuat sidebar hilang
    - _Requirements: 5.1_
  
  - [ ] 11.6 Test icon changes
    - Verifikasi ukuran icon di sidebar
    - Verifikasi warna icon berbeda
    - Verifikasi icon Pool dan Tax sudah diganti
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 12. Checkpoint - Verifikasi semua perbaikan
  - Pastikan tidak ada error di console browser
  - Pastikan semua halaman berfungsi normal
  - Pastikan performa aplikasi baik
  - Tanyakan ke user jika ada pertanyaan

## Notes

- Implementasi dilakukan secara bertahap untuk meminimalkan downtime
- Migrasi database harus dilakukan dengan hati-hati
- Backup data sebelum menjalankan migrasi
- Test setiap perubahan sebelum melanjutkan ke task berikutnya
- Fokus pada perbaikan yang diminta, jangan ubah sistem yang sudah berjalan baik
- Gunakan Supabase MCP tools untuk operasi database
