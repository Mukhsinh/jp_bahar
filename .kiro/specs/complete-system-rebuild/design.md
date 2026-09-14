# Design Document

## Overview

Dokumen ini menjelaskan desain teknis untuk perombakan total sistem JASPEL KPI Management. Perombakan ini akan mempertahankan alur bisnis dan struktur database yang ada, namun dengan implementasi yang lebih stabil, performant, dan user-friendly. Fokus utama adalah mengatasi masalah autentikasi, navigasi sidebar, lokalisasi Bahasa Indonesia, dan memastikan semua fitur berfungsi dengan baik.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Login Page   │  │  Dashboard   │  │  Other Pages │      │
│  │ (Client)     │  │  (Server)    │  │  (Server)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Middleware    │
                    │ (Auth Check &   │
                    │ Session Refresh)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│ Server Actions │  │  API Routes     │  │  Services      │
│ (Business      │  │  (Minimal)      │  │  (Business     │
│  Logic)        │  │                 │  │   Logic)       │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Supabase       │
                    │  - Auth         │
                    │  - PostgreSQL   │
                    │  - RLS Policies │
                    └─────────────────┘
```

### Component Architecture

```
app/
├── (authenticated)/          # Layout wrapper dengan auth check
│   ├── layout.tsx           # Shared layout dengan Sidebar
│   ├── admin/               # Superadmin routes
│   ├── manager/             # Manager routes
│   └── employee/            # Employee routes
├── login/                   # Public login page
├── middleware.ts            # Session refresh & auth check
└── error.tsx                # Global error boundary

components/
├── navigation/
│   └── Sidebar.tsx          # Sidebar dengan error boundary
├── ui/                      # Shadcn components (tidak diubah)
└── [feature]/               # Feature-specific components

lib/
├── supabase/
│   ├── client.ts            # Browser client
│   └── server.ts            # Server client dengan cookies
├── services/                # Business logic layer
├── hooks/                   # React hooks
└── utils/                   # Utility functions
```

## Components and Interfaces

### 1. Authentication System

#### Auth Service (`lib/services/auth.service.ts`)

```typescript
interface AuthService {
  // Login dengan email dan password
  signIn(email: string, password: string): Promise<AuthResult>
  
  // Logout dan clear session
  signOut(): Promise<void>
  
  // Get current user dengan role
  getCurrentUser(): Promise<UserWithRole | null>
  
  // Check apakah user sudah authenticated
  isAuthenticated(): Promise<boolean>
  
  // Get user role untuk authorization
  getUserRole(userId: string): Promise<UserRole>
}

interface AuthResult {
  success: boolean
  user?: UserWithRole
  error?: string
}

interface UserWithRole {
  id: string
  email: string
  role: 'superadmin' | 'unit_manager' | 'employee'
  unit_id?: string
  employee_id?: string
}
```

**Implementation Strategy:**
- Menggunakan `@supabase/ssr` untuk server-side auth
- Session disimpan di cookies dengan secure flags
- Middleware refresh session otomatis setiap request
- Error handling yang jelas dengan pesan Bahasa Indonesia

#### Login Page (`app/login/page.tsx`)

```typescript
'use client'

interface LoginFormData {
  email: string
  password: string
}

interface LoginPageState {
  loading: boolean
  error: string | null
}

// Component menggunakan React Hook Form untuk validasi
// Submit menggunakan Server Action
// Error ditampilkan dalam Bahasa Indonesia
// Loading state dengan spinner
```

**Key Features:**
- Form validation dengan pesan Bahasa Indonesia
- Loading state yang jelas
- Error handling tanpa infinite loop
- Auto-redirect jika sudah login
- Remember me functionality (optional)

#### Middleware (`middleware.ts`)

```typescript
// Middleware untuk:
// 1. Refresh session otomatis
// 2. Check authentication untuk protected routes
// 3. Redirect ke login jika tidak authenticated
// 4. Redirect ke dashboard jika sudah login dan akses /login

export async function middleware(request: NextRequest) {
  // 1. Create supabase client dengan cookies
  // 2. Refresh session
  // 3. Check authentication
  // 4. Handle redirects
  // 5. Return response dengan updated cookies
}

// Matcher untuk protected routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/manager/:path*',
    '/employee/:path*',
    '/profile/:path*',
    '/notifications/:path*'
  ]
}
```

### 2. Navigation System

#### Sidebar Component (`components/navigation/Sidebar.tsx`)

```typescript
'use client'

interface SidebarProps {
  userRole: 'superadmin' | 'unit_manager' | 'employee'
  currentPath: string
}

interface MenuItem {
  label: string          // Bahasa Indonesia
  href: string
  icon: LucideIcon
  roles: UserRole[]      // Roles yang boleh akses
  badge?: number         // Optional notification badge
}

// Component dengan:
// - Error Boundary internal
// - Loading state
// - Active state highlighting
// - Responsive (collapsible di mobile)
// - Smooth transitions
```

**Menu Structure:**

```typescript
const menuItems: Record<UserRole, MenuItem[]> = {
  superadmin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manajemen Unit', href: '/admin/units', icon: Building2 },
    { label: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
    { label: 'Manajemen Pegawai', href: '/admin/pegawai', icon: UserCog },
    { label: 'Konfigurasi KPI', href: '/admin/kpi-config', icon: Settings },
    { label: 'Manajemen Pool', href: '/admin/pool', icon: DollarSign },
    { label: 'Laporan', href: '/admin/reports', icon: FileText },
    { label: 'Audit Log', href: '/admin/audit', icon: Shield },
    { label: 'Pengaturan', href: '/admin/settings', icon: Cog }
  ],
  unit_manager: [
    { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Input Realisasi', href: '/manager/realization', icon: Edit }
  ],
  employee: [
    { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard }
  ]
}
```

**Error Handling:**
- Sidebar wrapped dalam Error Boundary
- Jika error, tampilkan minimal navigation
- Log error untuk debugging
- Tidak crash seluruh aplikasi

#### Authenticated Layout (`app/(authenticated)/layout.tsx`)

```typescript
// Server Component
export default async function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode
}) {
  // 1. Get current user dari server
  // 2. Check authentication
  // 3. Get user role
  // 4. Render layout dengan Sidebar
  
  return (
    <div className="flex h-screen">
      <Sidebar userRole={user.role} currentPath={pathname} />
      <main className="flex-1 overflow-auto">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}
```

### 3. Localization System

#### Translation Constants (`lib/constants/translations.ts`)

```typescript
export const translations = {
  // Auth
  auth: {
    login: 'Masuk',
    logout: 'Keluar',
    email: 'Email',
    password: 'Kata Sandi',
    forgotPassword: 'Lupa Kata Sandi?',
    loginButton: 'Masuk ke Sistem',
    loginError: 'Email atau kata sandi salah',
    sessionExpired: 'Sesi Anda telah berakhir, silakan masuk kembali'
  },
  
  // Navigation
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
    profile: 'Profil'
  },
  
  // Common
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
    no: 'Tidak'
  },
  
  // Errors
  errors: {
    generic: 'Terjadi kesalahan, silakan coba lagi',
    network: 'Koneksi terputus, periksa internet Anda',
    unauthorized: 'Anda tidak memiliki akses ke halaman ini',
    notFound: 'Halaman tidak ditemukan',
    serverError: 'Terjadi kesalahan pada server'
  },
  
  // Validation
  validation: {
    required: 'Field ini wajib diisi',
    email: 'Format email tidak valid',
    minLength: 'Minimal {min} karakter',
    maxLength: 'Maksimal {max} karakter',
    number: 'Harus berupa angka',
    positive: 'Harus berupa angka positif'
  }
}

// Helper function untuk get translation
export function t(key: string, params?: Record<string, any>): string {
  // Implementation
}
```

#### Number and Date Formatting (`lib/utils/format.ts`)

```typescript
// Format angka dengan konvensi Indonesia
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

// Format currency (Rupiah)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

// Format tanggal dengan konvensi Indonesia
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

// Format tanggal dan waktu
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}
```

### 4. Performance Optimization

#### Data Caching Hook (`lib/hooks/useDataCache.ts`)

```typescript
interface CacheOptions {
  ttl?: number          // Time to live in milliseconds
  key: string          // Cache key
  fetcher: () => Promise<any>
}

export function useDataCache<T>(options: CacheOptions) {
  // Implementation dengan:
  // - In-memory cache
  // - TTL support
  // - Automatic refetch on stale
  // - Loading states
  // - Error handling
}
```

#### Server Component Strategy

```typescript
// Default: Server Component
export default async function Page() {
  // Fetch data di server
  const data = await fetchData()
  
  return <ServerComponent data={data} />
}

// Client Component hanya untuk interactivity
'use client'
export function InteractiveComponent() {
  // State dan event handlers
}
```

#### Bundle Optimization

```javascript
// next.config.js
module.exports = {
  // Optimize imports
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}'
    }
  },
  
  // Compression
  compress: true,
  
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}
```

### 5. Error Handling System

#### Global Error Boundary (`app/error.tsx`)

```typescript
'use client'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error untuk debugging
    console.error('Global error:', error)
  }, [error])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Terjadi Kesalahan</h2>
      <p>Maaf, terjadi kesalahan pada aplikasi.</p>
      <button onClick={reset}>Coba Lagi</button>
      <Link href="/">Kembali ke Beranda</Link>
    </div>
  )
}
```

#### Component Error Boundary

```typescript
'use client'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  // Implementation dengan:
  // - Catch errors
  // - Log errors
  // - Show fallback UI
  // - Reset functionality
}
```

#### API Error Handling

```typescript
// Standardized error response
interface ApiError {
  message: string        // User-friendly message (Bahasa Indonesia)
  code: string          // Error code untuk debugging
  details?: any         // Additional details
}

// Error handler utility
export function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: translateError(error.message),
      code: 'UNKNOWN_ERROR',
      details: error
    }
  }
  
  return {
    message: 'Terjadi kesalahan yang tidak diketahui',
    code: 'UNKNOWN_ERROR'
  }
}
```

## Data Models

### User and Authentication

```typescript
// Menggunakan Supabase Auth users table
interface AuthUser {
  id: string              // UUID dari auth.users
  email: string
  created_at: string
  updated_at: string
}

// Extended user data di public.users
interface User {
  id: string              // FK ke auth.users.id
  email: string
  role: 'superadmin' | 'unit_manager' | 'employee'
  unit_id?: string        // FK ke m_unit (untuk manager)
  employee_id?: string    // FK ke m_pegawai (untuk employee)
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### Existing Tables (Tidak Diubah)

Semua tabel existing tetap dipertahankan:
- `m_unit` - Master unit
- `m_pegawai` - Master pegawai
- `m_kpi_kategori` - KPI categories
- `m_kpi_indikator` - KPI indicators
- `t_pool` - Monthly pools
- `t_realisasi` - Realization data
- `t_perhitungan` - Calculation results
- `t_audit_log` - Audit logs
- `t_notification` - Notifications
- `m_settings` - System settings

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication State Consistency

*For any* authenticated user session, the user's authentication state should remain consistent across all components and pages until explicit logout or session expiration.

**Validates: Requirements 1.1, 1.6**

### Property 2: Role-Based Access Control

*For any* user with a specific role, accessing a page should only succeed if that page is authorized for their role, otherwise redirect to forbidden page.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 3: Sidebar Menu Consistency

*For any* user role, the sidebar should display exactly the menu items defined for that role, with no missing or extra items.

**Validates: Requirements 2.1, 2.2**

### Property 4: Translation Completeness

*For any* UI text element, the displayed text should be in Bahasa Indonesia and should not contain English text (except for technical terms that don't have Indonesian equivalents).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

### Property 5: Number Format Consistency

*For any* numeric value displayed in the UI, the format should follow Indonesian conventions (dot for thousands separator, comma for decimal separator).

**Validates: Requirements 3.9**

### Property 6: Date Format Consistency

*For any* date displayed in the UI, the format should follow Indonesian conventions (DD/MM/YYYY).

**Validates: Requirements 3.8**

### Property 7: Error Boundary Protection

*For any* component error, the error should be caught by an error boundary and should not crash the entire application.

**Validates: Requirements 5.1, 5.7**

### Property 8: Loading State Feedback

*For any* asynchronous operation, a loading indicator should be displayed within 200ms of operation start.

**Validates: Requirements 4.2, 4.3**

### Property 9: RLS Data Isolation

*For any* unit manager, querying data should only return records where the unit_id matches their assigned unit.

**Validates: Requirements 7.2**

### Property 10: Session Refresh Reliability

*For any* valid session, the middleware should successfully refresh the session without causing authentication errors or redirects.

**Validates: Requirements 1.6**

### Property 11: Form Validation Completeness

*For any* form submission, all required fields should be validated before submission, with error messages in Bahasa Indonesia.

**Validates: Requirements 6.3**

### Property 12: Button Functionality

*For any* visible button in the UI, clicking it should either execute its intended function or display a "Coming Soon" message, never resulting in no action or error.

**Validates: Requirements 6.1, 6.2**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid credentials → "Email atau kata sandi salah"
   - Session expired → "Sesi Anda telah berakhir, silakan masuk kembali"
   - Unauthorized access → Redirect to /forbidden

2. **Network Errors**
   - Connection timeout → "Koneksi terputus, periksa internet Anda"
   - Server unreachable → "Tidak dapat terhubung ke server"

3. **Validation Errors**
   - Required field → "Field ini wajib diisi"
   - Invalid format → Specific message per field type

4. **Database Errors**
   - Query failed → "Gagal mengambil data, silakan coba lagi"
   - Insert/Update failed → "Gagal menyimpan data, silakan coba lagi"
   - RLS violation → "Anda tidak memiliki akses ke data ini"

5. **Component Errors**
   - Render error → Show Error Boundary fallback
   - State error → Reset component state

### Error Handling Strategy

```typescript
// 1. Try-Catch di Server Actions
export async function serverAction() {
  try {
    // Business logic
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: translateError(error)
    }
  }
}

// 2. Error Boundary untuk Component Errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>

// 3. Toast Notifications untuk User Feedback
toast.error('Gagal menyimpan data')
toast.success('Data berhasil disimpan')

// 4. Logging untuk Debugging
if (process.env.NODE_ENV === 'development') {
  console.error('Detailed error:', error)
}
```

## Testing Strategy

### Unit Testing

**Focus Areas:**
- Utility functions (formatting, validation)
- Service layer functions
- Error handling functions
- Translation helpers

**Example Tests:**
```typescript
describe('formatCurrency', () => {
  it('should format number as Indonesian Rupiah', () => {
    expect(formatCurrency(1000000)).toBe('Rp1.000.000')
  })
  
  it('should handle decimal values', () => {
    expect(formatCurrency(1500.50)).toBe('Rp1.501')
  })
})

describe('AuthService', () => {
  it('should return user with role on successful login', async () => {
    const result = await authService.signIn('test@example.com', 'password')
    expect(result.success).toBe(true)
    expect(result.user).toHaveProperty('role')
  })
  
  it('should return error on invalid credentials', async () => {
    const result = await authService.signIn('test@example.com', 'wrong')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Email atau kata sandi salah')
  })
})
```

### Integration Testing

**Focus Areas:**
- Authentication flow (login → dashboard)
- Navigation flow (sidebar → pages)
- CRUD operations with RLS
- Form submission with validation

**Example Tests:**
```typescript
describe('Authentication Flow', () => {
  it('should redirect to dashboard after successful login', async () => {
    // Test login flow
  })
  
  it('should show error message on failed login', async () => {
    // Test error handling
  })
  
  it('should redirect to login when session expires', async () => {
    // Test session expiration
  })
})

describe('Sidebar Navigation', () => {
  it('should display correct menu items for superadmin', async () => {
    // Test menu rendering
  })
  
  it('should highlight active menu item', async () => {
    // Test active state
  })
  
  it('should navigate to correct page on menu click', async () => {
    // Test navigation
  })
})
```

### Manual Testing Checklist

1. **Authentication**
   - [ ] Login dengan kredensial valid
   - [ ] Login dengan kredensial invalid
   - [ ] Logout
   - [ ] Session persistence
   - [ ] Session expiration handling

2. **Navigation**
   - [ ] Sidebar muncul di semua halaman authenticated
   - [ ] Menu items sesuai role
   - [ ] Active state highlighting
   - [ ] Navigation ke semua halaman
   - [ ] Responsive di mobile

3. **Localization**
   - [ ] Semua teks dalam Bahasa Indonesia
   - [ ] Format angka sesuai konvensi Indonesia
   - [ ] Format tanggal sesuai konvensi Indonesia
   - [ ] Pesan error dalam Bahasa Indonesia

4. **Performance**
   - [ ] Halaman load < 2 detik
   - [ ] Feedback visual < 200ms
   - [ ] No unnecessary re-renders
   - [ ] Smooth transitions

5. **Error Handling**
   - [ ] Error boundary menangkap component errors
   - [ ] API errors ditampilkan dengan jelas
   - [ ] Network errors ditangani dengan baik
   - [ ] Tidak ada unhandled promise rejections

6. **Features**
   - [ ] Semua button berfungsi
   - [ ] Semua form dapat disubmit
   - [ ] CRUD operations berfungsi
   - [ ] Export/Import berfungsi
   - [ ] Search dan filter berfungsi

7. **Security**
   - [ ] RLS policies berfungsi
   - [ ] Unauthorized access ditolak
   - [ ] Data isolation antar unit
   - [ ] No sensitive data di client

### Testing Tools

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Playwright atau Cypress
- **Manual Tests**: Browser DevTools + Checklist
- **Performance**: Lighthouse + Chrome DevTools
- **Accessibility**: axe DevTools

## Implementation Notes

### Phase 1: Core Infrastructure (Priority: Critical)

1. **Authentication System**
   - Fix middleware untuk session refresh
   - Implement proper error handling
   - Add Bahasa Indonesia messages
   - Test login/logout flow

2. **Navigation System**
   - Refactor Sidebar dengan error boundary
   - Implement proper loading states
   - Add Bahasa Indonesia labels
   - Test menu rendering dan navigation

3. **Error Handling**
   - Implement global error boundary
   - Add component-level error boundaries
   - Standardize error messages
   - Add error logging

### Phase 2: Localization (Priority: High)

1. **Translation System**
   - Create translation constants
   - Implement translation helper
   - Replace all English text
   - Add format utilities

2. **Number and Date Formatting**
   - Implement format utilities
   - Replace all number displays
   - Replace all date displays
   - Test formatting consistency

### Phase 3: Performance (Priority: High)

1. **Component Optimization**
   - Convert to Server Components where possible
   - Implement data caching
   - Add loading states
   - Optimize bundle size

2. **Database Optimization**
   - Review and optimize queries
   - Add indexes where needed
   - Optimize RLS policies
   - Test query performance

### Phase 4: Feature Completion (Priority: Medium)

1. **Missing Features**
   - Audit all buttons and forms
   - Implement missing functionality
   - Add proper validation
   - Test all features

2. **UI/UX Improvements**
   - Add loading spinners
   - Improve error messages
   - Add success notifications
   - Improve responsive design

### Phase 5: Testing and Deployment (Priority: Medium)

1. **Testing**
   - Write unit tests
   - Write integration tests
   - Manual testing checklist
   - Performance testing

2. **Deployment**
   - Optimize for Vercel
   - Test production build
   - Deploy to staging
   - Deploy to production

### Development Guidelines

1. **Always use TypeScript** - No any types
2. **Server Components by default** - Use 'use client' only when needed
3. **Bahasa Indonesia everywhere** - No English in UI
4. **Error boundaries everywhere** - Protect against crashes
5. **Loading states everywhere** - User feedback is critical
6. **Test before commit** - No broken code in main branch
7. **Follow existing structure** - Consistency is key
8. **Document complex logic** - Help future developers

### Migration Strategy

1. **No Breaking Changes** - Existing database schema tetap
2. **Incremental Updates** - Update per module, bukan sekaligus
3. **Backward Compatible** - Existing data tetap berfungsi
4. **Rollback Plan** - Siap rollback jika ada masalah
5. **Testing at Each Step** - Test setelah setiap perubahan

### Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings resolved
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Manual testing completed
- [ ] Performance acceptable
- [ ] Error handling tested
- [ ] Localization verified
