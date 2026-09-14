# Design Document

## Overview

Dokumen ini menjelaskan design untuk perbaikan UI dan struktur data sistem JASPEL. Perbaikan mencakup pemisahan tabel user management dengan master pegawai, implementasi refresh manual, lokalisasi bahasa Indonesia, dan perbaikan visual icon.

## Architecture

### Database Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  auth.users     │         │   t_user         │
│  (Supabase)     │◄────────│   (New Table)    │
│                 │         │                  │
│  - id           │         │  - id (PK)       │
│  - email        │         │  - email         │
│  - password     │         │  - role          │
│  - metadata     │         │  - employee_id   │
└─────────────────┘         │  - is_active     │
                            └──────────────────┘
                                     │
                                     │ FK
                                     ▼
                            ┌──────────────────┐
                            │   m_pegawai      │
                            │   (New Table)    │
                            │                  │
                            │  - id (PK)       │
                            │  - employee_code │
                            │  - full_name     │
                            │  - unit_id       │
                            │  - position      │
                            │  - tax_status    │
                            │  - phone         │
                            │  - address       │
                            │  - is_active     │
                            └──────────────────┘
```

### Component Architecture

```
app/admin/
├── users/                    # User Management (t_user)
│   ├── page.tsx             # Main page
│   ├── actions.ts           # Server actions
│   └── components/
│       ├── UserTable.tsx
│       └── UserFormDialog.tsx
│
└── pegawai/                  # Master Pegawai (m_pegawai) - NEW
    ├── page.tsx             # Main page
    ├── actions.ts           # Server actions
    └── components/
        ├── PegawaiTable.tsx
        └── PegawaiFormDialog.tsx
```

## Components and Interfaces

### 1. Database Tables

#### t_user (New Table)
```sql
CREATE TABLE t_user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'unit_manager', 'employee')),
  employee_id UUID REFERENCES m_pegawai(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### m_pegawai (New Table)
```sql
CREATE TABLE m_pegawai (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  unit_id UUID NOT NULL REFERENCES m_units(id) ON DELETE RESTRICT,
  position VARCHAR(255),
  tax_status VARCHAR(10) DEFAULT 'TK/0' CHECK (tax_status IN ('TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3')),
  phone VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. TypeScript Interfaces

```typescript
// User Management Types
export interface User {
  id: string
  email: string
  role: 'superadmin' | 'unit_manager' | 'employee'
  employee_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  pegawai?: Pegawai
}

// Master Pegawai Types
export interface Pegawai {
  id: string
  employee_code: string
  full_name: string
  unit_id: string
  position: string | null
  tax_status: string
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  m_units?: {
    name: string
  }
}

// Form Input Types
export interface CreateUserInput {
  email: string
  password: string
  role: 'superadmin' | 'unit_manager' | 'employee'
  employee_id: string | null
}

export interface CreatePegawaiInput {
  employee_code: string
  full_name: string
  unit_id: string
  position?: string
  tax_status?: string
  phone?: string
  address?: string
}
```

### 3. Server Actions

```typescript
// app/admin/users/actions.ts
export async function getUsers(
  page: number,
  pageSize: number,
  searchTerm: string
): Promise<{ data: User[]; count: number; error?: string }>

export async function createUser(
  input: CreateUserInput
): Promise<{ success: boolean; error?: string }>

export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<{ success: boolean; error?: string }>

// app/admin/pegawai/actions.ts
export async function getPegawai(
  page: number,
  pageSize: number,
  searchTerm: string
): Promise<{ data: Pegawai[]; count: number; error?: string }>

export async function createPegawai(
  input: CreatePegawaiInput
): Promise<{ success: boolean; error?: string }>

export async function updatePegawai(
  id: string,
  updates: Partial<Pegawai>
): Promise<{ success: boolean; error?: string }>
```

### 4. Sidebar Navigation

```typescript
// components/navigation/Sidebar.tsx
const menuItems = [
  {
    label: 'Dasbor',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
    color: 'text-blue-500',
    size: 'h-5 w-5'
  },
  {
    label: 'Manajemen Unit',
    icon: Building2,
    href: '/admin/units',
    color: 'text-green-500',
    size: 'h-5 w-5'
  },
  {
    label: 'Manajemen User',
    icon: Users,
    href: '/admin/users',
    color: 'text-purple-500',
    size: 'h-5 w-5'
  },
  {
    label: 'Master Pegawai',
    icon: UserCheck,
    href: '/admin/pegawai',
    color: 'text-orange-500',
    size: 'h-5 w-5'
  },
  {
    label: 'Konfigurasi KPI',
    icon: Target,
    href: '/admin/kpi-config',
    color: 'text-red-500',
    size: 'h-5 w-5'
  },
  {
    label: 'Manajemen Pool',
    icon: Wallet, // Changed from DollarSign
    href: '/admin/pool',
    color: 'text-emerald-500',
    size: 'h-5 w-5'
  },
  {
    label: 'Laporan',
    icon: FileText,
    href: '/admin/reports',
    color: 'text-indigo-500',
    size: 'h-5 w-5'
  },
  {
    label: 'Audit Log',
    icon: Shield,
    href: '/admin/audit',
    color: 'text-amber-500',
    size: 'h-5 w-5'
  },
  {
    label: 'Pengaturan',
    icon: Settings,
    href: '/admin/settings',
    color: 'text-gray-500',
    size: 'h-5 w-5'
  }
]
```

### 5. Refresh Manual Pattern

```typescript
// Pattern untuk semua halaman dengan data
export default function DataPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  
  const loadData = useCallback(async () => {
    setLoading(true)
    const result = await fetchData()
    setData(result.data)
    setLoading(false)
  }, [])
  
  // Load data hanya saat mount, tidak auto-refresh
  useEffect(() => {
    loadData()
  }, [loadData])
  
  return (
    <div>
      <Button onClick={loadData} disabled={loading}>
        <RefreshCw className={loading ? 'animate-spin' : ''} />
        Muat Ulang
      </Button>
      {/* Table component */}
    </div>
  )
}
```

## Data Models

### User Model
- Menyimpan informasi login dan akses
- Relasi optional ke pegawai (employee_id nullable)
- Tidak semua user harus punya data pegawai
- Tidak semua pegawai harus punya akses login

### Pegawai Model
- Menyimpan informasi lengkap pegawai organisasi
- Independen dari user login
- Bisa digunakan untuk referensi di berbagai modul
- Mendukung data pegawai yang tidak memiliki akses sistem

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: User-Pegawai Relationship Integrity
*For any* user record in t_user, if employee_id is not null, then there must exist a corresponding pegawai record in m_pegawai with that id
**Validates: Requirements 1.5**

### Property 2: Unique Email Constraint
*For any* two user records in t_user, their email addresses must be different
**Validates: Requirements 1.3**

### Property 3: Unique Employee Code Constraint
*For any* two pegawai records in m_pegawai, their employee_code values must be different
**Validates: Requirements 2.3**

### Property 4: Search Result Consistency
*For any* search term, all returned results must contain the search term in at least one searchable field (name, code, email, or unit)
**Validates: Requirements 2.6**

### Property 5: Refresh Preserves State
*For any* page state (filters, pagination, sort), performing a refresh operation should maintain the same state and return consistent results
**Validates: Requirements 3.5**

### Property 6: Indonesian Localization Completeness
*For any* UI element (label, button, message, placeholder), the displayed text must be in Indonesian language
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**

### Property 7: Sidebar Visibility Consistency
*For any* page navigation or refresh operation, the sidebar must remain visible and functional
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 8: Icon Visibility
*For any* sidebar menu item, the icon size must be at least h-5 w-5 and have a distinct color
**Validates: Requirements 5.4, 5.5, 5.6**

### Property 9: No Auth Admin API Calls from Client
*For any* client-side component, there should be no direct calls to auth.admin API endpoints
**Validates: Requirements 6.1, 6.2**

## Error Handling

### Database Errors
- Foreign key violations: Return user-friendly message "Data terkait tidak ditemukan"
- Unique constraint violations: Return "Data sudah ada"
- Connection errors: Return "Gagal terhubung ke database"

### Validation Errors
- Empty required fields: "Field [nama] wajib diisi"
- Invalid email format: "Format email tidak valid"
- Invalid phone format: "Format nomor telepon tidak valid"

### Permission Errors
- Unauthorized access: Redirect to /forbidden
- Invalid role: "Anda tidak memiliki akses ke halaman ini"

## Testing Strategy

### Unit Tests
- Test database table creation and constraints
- Test TypeScript interface validation
- Test server action error handling
- Test form validation logic
- Test search and filter functions

### Property-Based Tests
- Test user-pegawai relationship integrity across random data
- Test unique constraints with generated data
- Test search functionality with random search terms
- Test refresh state preservation with random filters
- Test localization completeness across all components

### Integration Tests
- Test complete user creation flow (t_user + m_pegawai)
- Test user management CRUD operations
- Test pegawai management CRUD operations
- Test sidebar navigation and routing
- Test refresh functionality across all pages

### Manual Testing
- Verify all text is in Indonesian
- Verify icon sizes and colors in sidebar
- Verify no 403 errors in browser console
- Verify refresh button works on all pages
- Verify user and pegawai pages are separate and functional

## Migration Strategy

### Phase 1: Create New Tables
1. Create t_user table
2. Create m_pegawai table
3. Add indexes for performance

### Phase 2: Migrate Data
1. Copy data from m_employees to m_pegawai
2. Create t_user records for users with auth.users entries
3. Link t_user.employee_id to m_pegawai.id

### Phase 3: Update Application
1. Update server actions to use new tables
2. Update components to use new interfaces
3. Create new pegawai management pages
4. Update user management to use t_user

### Phase 4: Cleanup
1. Verify all functionality works
2. Remove references to old m_employees structure
3. Update RLS policies for new tables
4. Archive old data if needed

## Localization Mapping

### Common Terms
- User → Pengguna
- Employee → Pegawai
- Unit → Unit
- Role → Peran
- Status → Status
- Active → Aktif
- Inactive → Tidak Aktif
- Create → Tambah
- Edit → Ubah
- Delete → Hapus
- Save → Simpan
- Cancel → Batal
- Search → Cari
- Filter → Filter
- Refresh → Muat Ulang
- Loading → Memuat
- Success → Berhasil
- Error → Gagal
- Dashboard → Dasbor
- Settings → Pengaturan
- Reports → Laporan
- Management → Manajemen
- Master → Master
- Configuration → Konfigurasi
- Pool → Pool
- Audit → Audit
- Tax → Pajak
- Email → Email
- Password → Kata Sandi
- Phone → Telepon
- Address → Alamat
- Position → Jabatan
- Code → Kode
- Name → Nama
- Description → Deskripsi
- Actions → Aksi
- View → Lihat
- Details → Detail
- Total → Total
- Period → Periode
- Revenue → Pendapatan
- Deduction → Potongan
- Allocation → Alokasi
- Approve → Setujui
- Approved → Disetujui
- Draft → Draf
- Distributed → Didistribusikan

### Menu Labels
- Dashboard → Dasbor
- Unit Management → Manajemen Unit
- User Management → Manajemen User
- Master Employee → Master Pegawai
- KPI Configuration → Konfigurasi KPI
- Pool Management → Manajemen Pool
- Reports → Laporan
- Audit Log → Log Audit
- Settings → Pengaturan
- Profile → Profil
- Notifications → Notifikasi
- Logout → Keluar

### Form Labels
- Employee Code → Kode Pegawai
- Full Name → Nama Lengkap
- Email Address → Alamat Email
- Phone Number → Nomor Telepon
- Tax Status → Status Pajak
- Select Unit → Pilih Unit
- Select Role → Pilih Peran
- Enter password → Masukkan kata sandi
- Confirm password → Konfirmasi kata sandi

### Messages
- "Data saved successfully" → "Data berhasil disimpan"
- "Failed to save data" → "Gagal menyimpan data"
- "Are you sure?" → "Apakah Anda yakin?"
- "Data deleted successfully" → "Data berhasil dihapus"
- "No data found" → "Tidak ada data"
- "Loading data..." → "Memuat data..."
- "Search by name, code, or unit" → "Cari berdasarkan nama, kode, atau unit"
- "Page X of Y" → "Halaman X dari Y"
- "Previous" → "Sebelumnya"
- "Next" → "Selanjutnya"
