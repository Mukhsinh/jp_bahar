# Requirements Document

## Introduction

Sistem JASPEL saat ini mengalami masalah dimana sidebar navigasi tidak terlihat di aplikasi dan tombol logout tidak berfungsi dengan normal. Dokumen ini mendefinisikan requirements untuk memperbaiki masalah tersebut tanpa mengubah sistem yang sudah berjalan baik.

## Glossary

- **Sidebar**: Komponen navigasi samping yang menampilkan menu navigasi aplikasi
- **Layout**: Komponen wrapper yang mengatur tata letak halaman
- **Auth_System**: Sistem autentikasi Supabase yang sudah berjalan normal
- **Logout_Flow**: Proses keluar dari sistem yang membersihkan session dan redirect ke login
- **Menu_Items**: Daftar item navigasi yang ditampilkan berdasarkan role user
- **RLS**: Row Level Security policies di Supabase

## Requirements

### Requirement 1: Sidebar Visibility

**User Story:** Sebagai user yang sudah login, saya ingin melihat sidebar navigasi, sehingga saya dapat mengakses menu-menu aplikasi.

#### Acceptance Criteria

1. WHEN user mengakses halaman admin/manager/employee dashboard THEN the system SHALL menampilkan sidebar navigasi di sisi kiri layar
2. WHEN sidebar ditampilkan THEN the system SHALL menampilkan logo JASPEL, informasi user, dan menu navigasi sesuai role
3. WHEN user menggunakan desktop (>= 1024px) THEN the system SHALL menampilkan sidebar dalam mode expanded secara default
4. WHEN user menggunakan mobile (< 1024px) THEN the system SHALL menampilkan tombol hamburger menu untuk membuka sidebar
5. WHEN sidebar dimuat THEN the system SHALL memuat data user dan unit name dari database tanpa error

### Requirement 2: Sidebar Layout Integration

**User Story:** Sebagai developer, saya ingin sidebar terintegrasi dengan baik di semua layout, sehingga tidak ada konflik CSS atau rendering.

#### Acceptance Criteria

1. WHEN layout component dirender THEN the system SHALL menggunakan flexbox layout dengan sidebar di kiri dan content di kanan
2. WHEN sidebar memiliki fixed positioning THEN the system SHALL memastikan z-index yang tepat agar tidak tertutup elemen lain
3. WHEN main content dirender THEN the system SHALL memberikan margin/padding yang cukup agar tidak tertutup sidebar
4. WHEN multiple layouts (admin/manager/employee) digunakan THEN the system SHALL menggunakan komponen Sidebar yang sama tanpa duplikasi
5. WHEN sidebar collapsed/expanded THEN the system SHALL menyesuaikan lebar main content secara responsif

### Requirement 3: Logout Functionality

**User Story:** Sebagai user yang sudah login, saya ingin dapat logout dengan normal, sehingga session saya dibersihkan dan saya diarahkan ke halaman login.

#### Acceptance Criteria

1. WHEN user mengklik tombol "Keluar" THEN the system SHALL menampilkan dialog konfirmasi logout
2. WHEN user mengkonfirmasi logout THEN the system SHALL memanggil authService.logout() untuk membersihkan session
3. WHEN logout berhasil THEN the system SHALL membersihkan localStorage, sessionStorage, dan cookies
4. WHEN logout berhasil THEN the system SHALL redirect user ke halaman /login menggunakan window.location.replace()
5. WHEN logout gagal THEN the system SHALL tetap membersihkan storage dan redirect ke login sebagai fallback
6. WHEN user sudah logout THEN the system SHALL memastikan middleware mendeteksi session kosong dan tidak mengizinkan akses ke halaman protected

### Requirement 4: Menu Items Display

**User Story:** Sebagai user dengan role tertentu, saya ingin melihat menu navigasi yang sesuai dengan role saya, sehingga saya hanya melihat menu yang relevan.

#### Acceptance Criteria

1. WHEN user dengan role superadmin login THEN the system SHALL menampilkan semua menu admin (dashboard, units, users, kpi-config, pool, reports, audit, settings)
2. WHEN user dengan role unit_manager login THEN the system SHALL menampilkan menu manager (dashboard, realization)
3. WHEN user dengan role employee login THEN the system SHALL menampilkan menu employee (dashboard)
4. WHEN menu items dimuat THEN the system SHALL menggunakan useMenuItems hook yang mengambil data dari rbac.service
5. WHEN menu item diklik THEN the system SHALL navigate ke path yang sesuai tanpa error

### Requirement 5: Sidebar Styling and Responsiveness

**User Story:** Sebagai user, saya ingin sidebar terlihat dengan baik di berbagai ukuran layar, sehingga pengalaman navigasi saya optimal.

#### Acceptance Criteria

1. WHEN sidebar dirender di desktop THEN the system SHALL menggunakan fixed positioning dengan width 288px (w-72) saat expanded
2. WHEN sidebar collapsed THEN the system SHALL menggunakan width 80px (w-20) dan menampilkan tooltip saat hover
3. WHEN sidebar dirender di mobile THEN the system SHALL menggunakan overlay dengan backdrop blur dan width 320px (w-80)
4. WHEN mobile sidebar dibuka THEN the system SHALL menampilkan backdrop yang dapat diklik untuk menutup sidebar
5. WHEN sidebar styling diterapkan THEN the system SHALL menggunakan gradient colors dan shadow sesuai design system

### Requirement 6: Error Handling and Loading States

**User Story:** Sebagai user, saya ingin sidebar tetap berfungsi meskipun ada error dalam memuat data, sehingga saya tetap dapat navigasi.

#### Acceptance Criteria

1. WHEN gagal memuat unit name THEN the system SHALL menampilkan sidebar tanpa unit name dan log error ke console
2. WHEN gagal memuat unread notifications count THEN the system SHALL menampilkan sidebar tanpa badge notifikasi
3. WHEN user data belum dimuat THEN the system SHALL menampilkan loading state atau skeleton
4. WHEN navigation sedang berlangsung THEN the system SHALL menampilkan loading indicator dan disable tombol navigasi
5. WHEN terjadi error di sidebar component THEN the system SHALL di-catch oleh ErrorBoundary tanpa crash seluruh aplikasi

### Requirement 7: Compatibility with Existing Systems

**User Story:** Sebagai developer, saya ingin perbaikan sidebar tidak mengubah sistem yang sudah berjalan baik, sehingga tidak ada regression.

#### Acceptance Criteria

1. WHEN sidebar diperbaiki THEN the system SHALL tidak mengubah auth system yang sudah berjalan normal
2. WHEN sidebar diperbaiki THEN the system SHALL tidak mengubah middleware yang sudah berfungsi
3. WHEN sidebar diperbaiki THEN the system SHALL tidak mengubah RLS policies di database
4. WHEN sidebar diperbaiki THEN the system SHALL tidak mengubah routing dan page components yang sudah ada
5. WHEN sidebar diperbaiki THEN the system SHALL tetap kompatibel dengan deployment ke Vercel free tier
