# Requirements Document: Comprehensive System Refactoring

## Introduction

Dokumen ini mendefinisikan requirements untuk refactoring komprehensif sistem JASPEL guna mengatasi masalah performa, duplikasi database, fitur yang hilang, dan mempersiapkan deployment ke Vercel. Refactoring ini akan meningkatkan responsivitas, stabilitas, dan user experience secara keseluruhan.

## Glossary

- **System**: Aplikasi JASPEL KPI Management
- **Database**: PostgreSQL database yang dikelola oleh Supabase
- **Vercel**: Platform deployment untuk Next.js applications
- **RLS**: Row Level Security policies di PostgreSQL
- **HMR**: Hot Module Replacement untuk development
- **Console_Log**: Browser console logging
- **Sidebar**: Menu navigasi samping aplikasi
- **Template**: File Excel template untuk import data
- **Export**: Fitur untuk mengunduh data dalam format Excel atau PDF
- **Unit_Management**: Halaman untuk mengelola unit organisasi
- **Employee_Management**: Halaman untuk mengelola data pegawai
- **User_Management**: Halaman untuk mengelola user dengan akses login
- **Superadmin**: User dengan role superadmin yang memiliki akses penuh
- **Unit_Manager**: User dengan role unit_manager yang mengelola unit tertentu
- **Employee**: User dengan role employee yang hanya melihat data sendiri

## Requirements

### Requirement 1: Fix Runtime Chunk Loading Error

**User Story:** Sebagai user, saya ingin aplikasi dapat dimuat tanpa error, sehingga saya dapat mengakses aplikasi dengan lancar.

#### Acceptance Criteria

1. WHEN aplikasi dimuat di browser THEN THE System SHALL tidak menampilkan error "Loading chunk app/layout failed"
2. WHEN aplikasi dimuat THEN THE System SHALL tidak menampilkan error "SyntaxError: Invalid or unexpected token"
3. THE System SHALL menggunakan konfigurasi webpack yang optimal untuk code splitting
4. THE System SHALL menggunakan dynamic imports dengan error boundaries yang tepat
5. WHEN chunk loading gagal THEN THE System SHALL menampilkan error message yang user-friendly dan menyediakan retry mechanism

### Requirement 2: Eliminate Database Table Duplication

**User Story:** Sebagai database administrator, saya ingin menghilangkan duplikasi tabel di database, sehingga data konsisten dan maintenance lebih mudah.

#### Acceptance Criteria

1. THE System SHALL menggunakan satu tabel `m_employees` untuk semua employee data
2. THE System SHALL tidak memiliki tabel duplikat seperti `m_pegawai`
3. WHEN tabel `m_pegawai` ditemukan THEN THE System SHALL melakukan migration untuk menggabungkan data ke `m_employees`
4. THE System SHALL memperbarui semua foreign key references dari `m_pegawai` ke `m_employees`
5. THE System SHALL memperbarui semua query di codebase yang menggunakan `m_pegawai` menjadi `m_employees`
6. WHEN migration selesai THEN THE System SHALL menghapus tabel `m_pegawai`
7. THE System SHALL memverifikasi bahwa semua relasi database tetap berfungsi setelah migration

### Requirement 3: Add Excel Template Download Feature

**User Story:** Sebagai superadmin, saya ingin mengunduh template Excel untuk import data, sehingga saya dapat mempersiapkan data dengan format yang benar.

#### Acceptance Criteria

1. WHEN superadmin mengakses Unit Management page THEN THE System SHALL menampilkan tombol "Download Template"
2. WHEN superadmin mengakses Employee Management page THEN THE System SHALL menampilkan tombol "Download Template"
3. WHEN superadmin mengakses User Management page THEN THE System SHALL menampilkan tombol "Download Template"
4. WHEN tombol "Download Template" diklik THEN THE System SHALL mengunduh file Excel dengan format yang sesuai
5. THE Template SHALL berisi header columns yang sesuai dengan struktur tabel
6. THE Template SHALL berisi contoh data di baris pertama sebagai panduan
7. THE Template SHALL berisi validation rules di Excel (dropdown untuk enum values)

### Requirement 4: Add Data Import Feature

**User Story:** Sebagai superadmin, saya ingin mengimport data dari Excel, sehingga saya dapat menambahkan banyak data sekaligus dengan efisien.

#### Acceptance Criteria

1. WHEN superadmin mengakses Unit Management page THEN THE System SHALL menampilkan tombol "Import Data"
2. WHEN superadmin mengakses Employee Management page THEN THE System SHALL menampilkan tombol "Import Data"
3. WHEN superadmin mengakses User Management page THEN THE System SHALL menampilkan tombol "Import Data"
4. WHEN tombol "Import Data" diklik THEN THE System SHALL membuka dialog untuk upload file Excel
5. WHEN file Excel diupload THEN THE System SHALL memvalidasi format dan struktur file
6. WHEN file valid THEN THE System SHALL memproses dan menyimpan data ke database
7. WHEN import selesai THEN THE System SHALL menampilkan summary (berapa data berhasil, berapa gagal)
8. IF ada data yang gagal THEN THE System SHALL menampilkan detail error untuk setiap baris yang gagal
9. THE System SHALL melakukan validation sebelum insert (unique constraints, foreign keys, data types)

### Requirement 5: Add Report Export Feature

**User Story:** Sebagai superadmin atau unit manager, saya ingin mengunduh laporan dalam format Excel atau PDF, sehingga saya dapat menganalisis dan membagikan data dengan mudah.

#### Acceptance Criteria

1. WHEN user mengakses Unit Management page THEN THE System SHALL menampilkan tombol "Export"
2. WHEN user mengakses Employee Management page THEN THE System SHALL menampilkan tombol "Export"
3. WHEN user mengakses User Management page THEN THE System SHALL menampilkan tombol "Export"
4. WHEN tombol "Export" diklik THEN THE System SHALL menampilkan pilihan format (Excel atau PDF)
5. WHEN format Excel dipilih THEN THE System SHALL mengunduh data dalam format Excel (.xlsx)
6. WHEN format PDF dipilih THEN THE System SHALL mengunduh data dalam format PDF
7. THE Export SHALL berisi semua data yang terlihat di tabel (dengan filter yang aktif)
8. THE Export SHALL berisi header yang jelas dan formatting yang rapi
9. THE Export SHALL berisi timestamp dan user yang melakukan export

### Requirement 6: Ensure Employee Management Page Exists and Functions

**User Story:** Sebagai superadmin, saya ingin mengakses halaman Employee Management yang berfungsi dengan baik, sehingga saya dapat mengelola data pegawai.

#### Acceptance Criteria

1. THE System SHALL menyediakan route `/admin/pegawai` untuk Employee Management page
2. WHEN superadmin mengakses `/admin/pegawai` THEN THE System SHALL menampilkan halaman Employee Management
3. THE Employee_Management page SHALL menampilkan tabel dengan data pegawai
4. THE Employee_Management page SHALL menyediakan fitur search dan filter
5. THE Employee_Management page SHALL menyediakan tombol "Add Employee"
6. THE Employee_Management page SHALL menyediakan tombol "Edit" untuk setiap row
7. THE Employee_Management page SHALL menyediakan tombol "Delete" untuk setiap row
8. WHEN tombol "Add Employee" diklik THEN THE System SHALL membuka dialog form untuk menambah pegawai
9. WHEN form disubmit THEN THE System SHALL menyimpan data ke tabel `m_employees`
10. THE Employee_Management page SHALL terintegrasi dengan Sidebar navigation

### Requirement 7: Eliminate Unnecessary Rebuilding and Auto-Refresh

**User Story:** Sebagai user, saya ingin aplikasi tidak melakukan rebuilding dan auto-refresh yang tidak perlu, sehingga aplikasi berjalan lebih cepat dan responsif.

#### Acceptance Criteria

1. WHEN user berpindah antar halaman THEN THE System SHALL tidak menampilkan console log "rebuilding"
2. WHEN user berpindah antar halaman THEN THE System SHALL tidak melakukan auto-refresh yang tidak perlu
3. THE System SHALL menggunakan Next.js App Router dengan optimal caching strategy
4. THE System SHALL menggunakan React Server Components untuk mengurangi client-side JavaScript
5. THE System SHALL menggunakan `revalidatePath` hanya ketika data berubah
6. THE System SHALL tidak menggunakan `router.refresh()` secara berlebihan
7. THE System SHALL menggunakan `useTransition` untuk smooth navigation
8. THE System SHALL menggunakan proper loading states tanpa full page refresh

### Requirement 8: Optimize Application for Vercel Deployment

**User Story:** Sebagai developer, saya ingin aplikasi dioptimalkan untuk deployment di Vercel, sehingga aplikasi dapat berjalan dengan baik di production.

#### Acceptance Criteria

1. THE System SHALL menggunakan Next.js configuration yang optimal untuk Vercel
2. THE System SHALL menggunakan environment variables yang sesuai untuk production
3. THE System SHALL menggunakan proper caching headers untuk static assets
4. THE System SHALL menggunakan Image Optimization dari Next.js
5. THE System SHALL menggunakan proper error handling untuk production
6. THE System SHALL tidak menggunakan console.log di production code
7. THE System SHALL menggunakan proper build optimization (tree shaking, minification)
8. THE System SHALL memiliki build size yang sesuai dengan Vercel free tier limits
9. THE System SHALL menggunakan proper serverless function configuration

### Requirement 9: Improve Application Responsiveness

**User Story:** Sebagai user, saya ingin aplikasi berjalan dengan sangat responsif, sehingga saya dapat bekerja dengan efisien tanpa delay.

#### Acceptance Criteria

1. WHEN user melakukan action THEN THE System SHALL memberikan feedback dalam waktu < 100ms
2. WHEN data loading THEN THE System SHALL menampilkan loading indicator yang jelas
3. THE System SHALL menggunakan optimistic updates untuk user actions
4. THE System SHALL menggunakan data caching untuk mengurangi database queries
5. THE System SHALL menggunakan pagination untuk large datasets
6. THE System SHALL menggunakan debouncing untuk search inputs
7. THE System SHALL menggunakan lazy loading untuk components yang tidak immediately visible
8. THE System SHALL menggunakan proper memoization untuk expensive computations

### Requirement 10: Fix Sidebar Disappearing Issue

**User Story:** Sebagai user, saya ingin sidebar selalu terlihat saat navigasi, sehingga saya tidak perlu refresh halaman untuk melihat menu.

#### Acceptance Criteria

1. WHEN user login THEN THE Sidebar SHALL terlihat di semua halaman yang memerlukan
2. WHEN user berpindah antar halaman THEN THE Sidebar SHALL tetap terlihat tanpa hilang
3. THE Sidebar SHALL tidak memerlukan page refresh untuk muncul kembali
4. THE Sidebar SHALL menggunakan proper layout structure di Next.js App Router
5. THE Sidebar SHALL menggunakan client component hanya untuk interactive parts
6. THE Sidebar SHALL menggunakan proper state management untuk active menu
7. WHEN error terjadi THEN THE Sidebar SHALL tetap terlihat dan functional

### Requirement 11: Fix Authentication and Access Errors

**User Story:** Sebagai user, saya ingin dapat login dan mengakses aplikasi tanpa error, sehingga saya dapat menggunakan aplikasi dengan lancar.

#### Acceptance Criteria

1. WHEN user login dengan credentials yang valid THEN THE System SHALL memberikan akses tanpa error
2. THE System SHALL tidak menampilkan error 500 saat user mencoba login
3. THE System SHALL tidak menampilkan error 403 saat user mengakses halaman yang authorized
4. THE System SHALL menggunakan proper session management dengan Supabase Auth
5. THE System SHALL menggunakan proper middleware untuk auth checking
6. THE System SHALL menggunakan proper error handling untuk auth failures
7. WHEN session expired THEN THE System SHALL redirect ke login page dengan message yang jelas
8. THE System SHALL menggunakan proper RLS policies yang tidak conflict dengan auth logic

### Requirement 12: Comprehensive Application Testing

**User Story:** Sebagai developer, saya ingin melakukan testing komprehensif dari login sampai semua fitur, sehingga saya dapat memastikan aplikasi berfungsi dengan baik.

#### Acceptance Criteria

1. THE System SHALL memiliki test script untuk login flow
2. THE System SHALL memiliki test script untuk setiap role (superadmin, unit_manager, employee)
3. THE System SHALL memiliki test script untuk setiap halaman utama
4. THE System SHALL memiliki test script untuk CRUD operations
5. THE System SHALL memiliki test script untuk import/export features
6. THE System SHALL memiliki test script untuk RLS policies
7. WHEN test dijalankan THEN THE System SHALL memberikan report yang jelas
8. THE System SHALL memiliki automated test yang dapat dijalankan sebelum deployment

### Requirement 13: Code Refactoring for Best Practices

**User Story:** Sebagai developer, saya ingin codebase mengikuti best practices, sehingga code mudah di-maintain dan di-scale.

#### Acceptance Criteria

1. THE System SHALL menggunakan TypeScript dengan proper type definitions
2. THE System SHALL menggunakan proper error handling di semua async operations
3. THE System SHALL menggunakan proper component structure (separation of concerns)
4. THE System SHALL menggunakan proper naming conventions
5. THE System SHALL tidak memiliki duplicate code (DRY principle)
6. THE System SHALL menggunakan proper comments untuk complex logic
7. THE System SHALL menggunakan proper file organization
8. THE System SHALL menggunakan ESLint rules yang strict
9. THE System SHALL tidak memiliki unused imports atau variables
10. THE System SHALL menggunakan proper security practices (no hardcoded secrets, proper input validation)
