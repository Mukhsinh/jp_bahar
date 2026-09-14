# Requirements Document

## Introduction

Perbaikan UI dan struktur data untuk meningkatkan pengalaman pengguna dan memperbaiki error yang ada dalam sistem JASPEL. Perbaikan mencakup pemisahan tabel user management, penambahan halaman master pegawai, perbaikan icon, lokalisasi bahasa Indonesia, dan implementasi refresh manual.

## Glossary

- **System**: Aplikasi JASPEL KPI Management
- **User_Management**: Halaman untuk mengelola user yang memiliki akses login
- **Master_Pegawai**: Halaman untuk mengelola data pegawai organisasi
- **t_user**: Tabel baru untuk menyimpan data user dengan akses login
- **m_pegawai**: Tabel master untuk menyimpan data pegawai organisasi
- **Sidebar**: Menu navigasi samping aplikasi
- **Pool_Management**: Halaman untuk mengelola pool dana insentif
- **Refresh_Manual**: Tombol untuk memuat ulang data tanpa auto-refresh

## Requirements

### Requirement 1: Pemisahan User Management dan Master Pegawai

**User Story:** Sebagai superadmin, saya ingin memisahkan pengelolaan user login dengan data pegawai, sehingga struktur data lebih jelas dan terorganisir.

#### Acceptance Criteria

1. WHEN superadmin mengakses halaman User Management THEN THE System SHALL menampilkan data dari tabel t_user yang berisi user dengan akses login
2. WHEN superadmin mengakses halaman Master Pegawai THEN THE System SHALL menampilkan data dari tabel m_pegawai yang berisi semua pegawai organisasi
3. THE System SHALL membuat tabel t_user dengan kolom id, email, password_hash, role, employee_id, is_active, created_at, updated_at
4. THE System SHALL membuat tabel m_pegawai dengan kolom id, employee_code, full_name, unit_id, position, tax_status, phone, address, is_active, created_at, updated_at
5. WHEN data user dibuat THEN THE System SHALL menyimpan relasi ke m_pegawai melalui kolom employee_id
6. THE System SHALL menghapus error 403 pada endpoint auth/v1/admin/users dengan menggunakan tabel yang tepat

### Requirement 2: Halaman Master Pegawai Baru

**User Story:** Sebagai superadmin, saya ingin mengelola data pegawai secara lengkap, sehingga informasi pegawai tersimpan dengan baik.

#### Acceptance Criteria

1. WHEN superadmin mengakses menu Master Pegawai THEN THE System SHALL menampilkan halaman dengan tabel data pegawai
2. THE System SHALL menampilkan kolom employee_code, full_name, unit, position, tax_status, phone, status di tabel
3. WHEN superadmin klik tombol Tambah Pegawai THEN THE System SHALL menampilkan dialog form untuk input data pegawai baru
4. WHEN superadmin klik tombol Edit pada baris pegawai THEN THE System SHALL menampilkan dialog form dengan data pegawai yang dipilih
5. WHEN superadmin klik tombol Nonaktifkan THEN THE System SHALL mengubah status is_active menjadi false
6. THE System SHALL menyediakan fitur pencarian pegawai berdasarkan nama, kode pegawai, atau unit
7. THE System SHALL menampilkan pagination untuk data pegawai dengan 50 data per halaman

### Requirement 3: Implementasi Refresh Manual

**User Story:** Sebagai user, saya ingin memuat ulang data secara manual, sehingga beban aplikasi berkurang dan performa lebih baik.

#### Acceptance Criteria

1. WHEN user berada di halaman dengan data tabel THEN THE System SHALL menampilkan tombol Refresh
2. WHEN user klik tombol Refresh THEN THE System SHALL memuat ulang data dari server
3. THE System SHALL menghapus auto-refresh otomatis dari semua halaman
4. WHEN data sedang dimuat THEN THE System SHALL menampilkan loading indicator
5. THE System SHALL mempertahankan filter dan pagination saat refresh dilakukan

### Requirement 4: Lokalisasi Bahasa Indonesia

**User Story:** Sebagai user Indonesia, saya ingin semua teks aplikasi dalam bahasa Indonesia, sehingga lebih mudah dipahami.

#### Acceptance Criteria

1. THE System SHALL mengubah semua label menu sidebar ke bahasa Indonesia
2. THE System SHALL mengubah semua judul halaman ke bahasa Indonesia
3. THE System SHALL mengubah semua label form ke bahasa Indonesia
4. THE System SHALL mengubah semua pesan error ke bahasa Indonesia
5. THE System SHALL mengubah semua pesan sukses ke bahasa Indonesia
6. THE System SHALL mengubah semua label tombol ke bahasa Indonesia
7. THE System SHALL mengubah semua placeholder input ke bahasa Indonesia
8. THE System SHALL mengubah semua label tabel ke bahasa Indonesia

### Requirement 5: Perbaikan Icon Sidebar dan Pool Management

**User Story:** Sebagai user, saya ingin icon yang lebih jelas dan berwarna, sehingga navigasi lebih mudah dan menarik.

#### Acceptance Criteria

1. THE System SHALL memastikan sidebar selalu tampil konsisten di semua halaman
2. WHEN user navigasi antar halaman THEN THE System SHALL mempertahankan tampilan sidebar
3. WHEN user refresh halaman THEN THE System SHALL tetap menampilkan sidebar
4. THE System SHALL memperbesar ukuran icon di sidebar dari 4 ke 5 atau 6
5. THE System SHALL memberikan warna berbeda untuk setiap menu di sidebar
6. THE System SHALL menggunakan warna cerah dan kontras untuk icon sidebar
7. WHEN menu aktif THEN THE System SHALL menampilkan icon dengan warna yang lebih terang
8. THE System SHALL mengganti icon dollar ($) di Pool Management dengan icon Wallet atau Coins
9. THE System SHALL mengganti icon dollar ($) di Tax Configuration dengan icon Receipt atau FileText
10. THE System SHALL memastikan semua icon dari lucide-react library

### Requirement 6: Perbaikan Error ReferenceError getEmployees

**User Story:** Sebagai superadmin, saya ingin halaman User Management berfungsi tanpa error, sehingga dapat mengelola user dengan lancar.

#### Acceptance Criteria

1. WHEN halaman User Management dimuat THEN THE System SHALL tidak menampilkan error "getEmployees is not defined"
2. THE System SHALL menggunakan fungsi yang benar untuk memuat data user dari tabel t_user
3. WHEN data user dimuat THEN THE System SHALL menampilkan email, role, dan unit dengan benar
4. THE System SHALL menghapus dependency ke tabel m_employees untuk data user login
