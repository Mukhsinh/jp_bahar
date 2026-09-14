# Requirements Document

## Introduction

Sistem routing aplikasi JASPEL saat ini menggunakan prefix berbasis role (`/admin/*`, `/manager/*`, `/employee/*`) yang menyebabkan verifikasi berulang di setiap halaman. Requirement ini bertujuan untuk menyederhanakan struktur routing dengan menghilangkan prefix role dan memindahkan verifikasi akses ke satu titik di middleware.

## Glossary

- **System**: Aplikasi JASPEL KPI Management
- **Middleware**: Next.js middleware yang menangani autentikasi dan routing
- **Role**: Peran pengguna (superadmin, manager, employee)
- **Protected_Route**: Halaman yang memerlukan autentikasi
- **Public_Route**: Halaman yang dapat diakses tanpa autentikasi (login, reset-password)
- **RBAC**: Role-Based Access Control
- **URL_Path**: Path URL tanpa domain (contoh: `/dashboard`, `/units`)

## Requirements

### Requirement 1: Simplified URL Structure

**User Story:** Sebagai pengguna sistem, saya ingin mengakses halaman dengan URL yang sederhana tanpa prefix role, sehingga navigasi lebih intuitif dan cepat.

#### Acceptance Criteria

1. WHEN pengguna mengakses halaman dashboard THEN the System SHALL menggunakan URL `/dashboard` bukan `/admin/dashboard` atau `/manager/dashboard`
2. WHEN pengguna mengakses halaman units THEN the System SHALL menggunakan URL `/units` bukan `/admin/units`
3. WHEN pengguna mengakses halaman users THEN the System SHALL menggunakan URL `/users` bukan `/admin/users`
4. WHEN pengguna mengakses halaman pegawai THEN the System SHALL menggunakan URL `/pegawai` bukan `/admin/pegawai`
5. WHEN pengguna mengakses halaman kpi-config THEN the System SHALL menggunakan URL `/kpi-config` bukan `/admin/kpi-config`
6. WHEN pengguna mengakses halaman pool THEN the System SHALL menggunakan URL `/pool` bukan `/admin/pool`
7. WHEN pengguna mengakses halaman reports THEN the System SHALL menggunakan URL `/reports` bukan `/admin/reports`
8. WHEN pengguna mengakses halaman audit THEN the System SHALL menggunakan URL `/audit` bukan `/admin/audit`
9. WHEN pengguna mengakses halaman settings THEN the System SHALL menggunakan URL `/settings` bukan `/admin/settings`
10. WHEN pengguna mengakses halaman realization THEN the System SHALL menggunakan URL `/realization` bukan `/manager/realization`

### Requirement 2: Centralized Authentication and Authorization

**User Story:** Sebagai sistem, saya ingin melakukan verifikasi autentikasi dan otorisasi hanya sekali di middleware, sehingga performa aplikasi meningkat dan tidak ada verifikasi berulang.

#### Acceptance Criteria

1. WHEN pengguna belum login dan mengakses Protected_Route THEN the Middleware SHALL redirect ke `/login`
2. WHEN pengguna sudah login dan mengakses Public_Route THEN the Middleware SHALL redirect ke halaman sesuai role
3. WHEN pengguna login sebagai superadmin THEN the Middleware SHALL mengizinkan akses ke semua halaman
4. WHEN pengguna login sebagai manager THEN the Middleware SHALL mengizinkan akses ke `/dashboard`, `/realization`, `/profile`, `/notifications`
5. WHEN pengguna login sebagai employee THEN the Middleware SHALL mengizinkan akses ke `/dashboard`, `/profile`, `/notifications`
6. WHEN pengguna mengakses halaman yang tidak sesuai role THEN the Middleware SHALL redirect ke `/forbidden`
7. WHEN session pengguna expired THEN the Middleware SHALL redirect ke `/login`

### Requirement 3: Role-Based Page Access Control

**User Story:** Sebagai sistem, saya ingin mengontrol akses halaman berdasarkan role di middleware, sehingga tidak perlu verifikasi di setiap halaman.

#### Acceptance Criteria

1. THE System SHALL mendefinisikan mapping halaman dan role yang diizinkan di middleware
2. WHEN superadmin mengakses halaman apapun THEN the System SHALL mengizinkan akses
3. WHEN manager mengakses halaman admin-only (units, users, pegawai, kpi-config, pool, reports, audit, settings) THEN the System SHALL redirect ke `/forbidden`
4. WHEN employee mengakses halaman selain dashboard, profile, notifications THEN the System SHALL redirect ke `/forbidden`
5. THE System SHALL memvalidasi role hanya sekali per request di middleware

### Requirement 4: Backward Compatibility and Migration

**User Story:** Sebagai developer, saya ingin sistem tetap berfungsi selama migrasi routing, sehingga tidak ada downtime atau error.

#### Acceptance Criteria

1. WHEN pengguna mengakses URL lama dengan prefix role THEN the System SHALL redirect ke URL baru tanpa prefix
2. WHEN redirect terjadi THEN the System SHALL menggunakan HTTP 301 (permanent redirect)
3. WHEN komponen internal menggunakan link lama THEN the System SHALL tetap berfungsi dengan redirect otomatis
4. THE System SHALL memperbarui semua internal links ke format baru

### Requirement 5: Sidebar and Navigation Updates

**User Story:** Sebagai pengguna, saya ingin navigasi sidebar menggunakan URL baru, sehingga konsisten dengan perubahan routing.

#### Acceptance Criteria

1. WHEN Sidebar merender menu items THEN the System SHALL menggunakan URL tanpa prefix role
2. WHEN pengguna klik menu item THEN the System SHALL navigate ke URL baru
3. WHEN active route detection berjalan THEN the System SHALL mendeteksi berdasarkan URL tanpa prefix
4. THE System SHALL memperbarui semua OptimizedLink components ke URL baru

### Requirement 6: API Routes Consistency

**User Story:** Sebagai sistem, saya ingin API routes tetap konsisten dan tidak terpengaruh perubahan routing halaman, sehingga backend logic tidak berubah.

#### Acceptance Criteria

1. THE System SHALL mempertahankan struktur API routes di `/api/*`
2. WHEN frontend memanggil API THEN the System SHALL menggunakan path yang sama seperti sebelumnya
3. THE System SHALL tidak mengubah API authentication logic
4. THE System SHALL tidak mengubah API authorization logic

### Requirement 7: Performance Optimization

**User Story:** Sebagai pengguna, saya ingin aplikasi merespon lebih cepat setelah perubahan routing, sehingga pengalaman pengguna meningkat.

#### Acceptance Criteria

1. WHEN middleware melakukan verifikasi THEN the System SHALL menyelesaikan dalam waktu < 50ms
2. WHEN halaman di-load THEN the System SHALL tidak melakukan verifikasi role tambahan di page level
3. THE System SHALL mengurangi jumlah database queries untuk verifikasi role
4. THE System SHALL menggunakan session cache untuk mempercepat verifikasi

### Requirement 8: Error Handling and User Feedback

**User Story:** Sebagai pengguna, saya ingin mendapat feedback yang jelas ketika akses ditolak, sehingga saya tahu alasan dan tindakan yang harus dilakukan.

#### Acceptance Criteria

1. WHEN akses ditolak karena role THEN the System SHALL menampilkan halaman `/forbidden` dengan pesan yang jelas
2. WHEN session expired THEN the System SHALL redirect ke `/login` dengan pesan session expired
3. WHEN error terjadi di middleware THEN the System SHALL log error dan redirect ke halaman error yang sesuai
4. THE System SHALL memberikan pesan error dalam bahasa Indonesia

### Requirement 9: Testing and Validation

**User Story:** Sebagai developer, saya ingin memastikan semua routing berfungsi dengan benar setelah perubahan, sehingga tidak ada regression bugs.

#### Acceptance Criteria

1. THE System SHALL memiliki test untuk setiap route dan role combination
2. WHEN test dijalankan THEN the System SHALL memvalidasi redirect behavior
3. WHEN test dijalankan THEN the System SHALL memvalidasi access control
4. THE System SHALL memiliki test untuk backward compatibility redirects

### Requirement 10: Documentation Updates

**User Story:** Sebagai developer, saya ingin dokumentasi yang update tentang struktur routing baru, sehingga mudah untuk maintenance di masa depan.

#### Acceptance Criteria

1. THE System SHALL memperbarui dokumentasi routing di README.md
2. THE System SHALL memperbarui dokumentasi struktur di structure.md
3. THE System SHALL mendokumentasikan mapping role-to-pages
4. THE System SHALL mendokumentasikan migration guide dari URL lama ke baru
