# Design Document: Route Simplification

## Overview

Sistem routing aplikasi JASPEL saat ini menggunakan struktur berbasis role dengan prefix `/admin/*`, `/manager/*`, dan `/employee/*`. Setiap halaman melakukan verifikasi role secara individual, yang menyebabkan:
- Verifikasi berulang di setiap page load
- Performa yang lebih lambat
- URL yang tidak intuitif
- Kompleksitas maintenance yang tinggi

Design ini mengubah arsitektur routing menjadi flat structure tanpa prefix role, dengan verifikasi terpusat di middleware untuk performa optimal dan user experience yang lebih baik.

## Architecture

### Current Architecture (Before)

```
Request → Middleware (auth only) → Page (role check) → Render
                                      ↓
                                  Redirect if unauthorized
```

**Problems:**
- Role verification happens on every page
- Multiple database queries per page load
- Slow initial page render
- Redundant security checks

### New Architecture (After)

```
Request → Middleware (auth + role + route check) → Page (no check) → Render
              ↓
          Redirect if unauthorized (before page load)
```

**Benefits:**
- Single verification point
- One database query per request
- Fast page render (no additional checks)
- Centralized security logic

## Components and Interfaces

### 1. Enhanced Middleware

**File:** `middleware.ts`

**Responsibilities:**
- Session validation
- Employee status check
- Role-based route authorization
- Backward compatibility redirects
- Performance optimization with caching

**Interface:**

```typescript
interface MiddlewareConfig {
  publicRoutes: string[]
  protectedRoutes: RouteConfig[]
  legacyRedirects: Record<string, string>
}

interface RouteConfig {
  path: string
  allowedRoles: Role[]
  requiresPermissions?: Permission[]
}

interface MiddlewareContext {
  session: Session
  employee: Employee
  role: Role
  pathname: string
}
```

**Logic Flow:**

```typescript
async function middleware(request: NextRequest) {
  // 1. Check if public route (login, reset-password)
  if (isPublicRoute(pathname)) {
    // If authenticated, redirect to dashboard
    if (hasSession) return redirectToDashboard(role)
    return next()
  }

  // 2. Check legacy routes and redirect
  if (isLegacyRoute(pathname)) {
    return permanentRedirect(getNewPath(pathname))
  }

  // 3. Validate session
  const session = await getSession()
  if (!session) return redirectToLogin()

  // 4. Get employee data (with caching)
  const employee = await getEmployee(session.user.id)
  if (!employee || !employee.is_active) {
    return redirectToLogin('inactive')
  }

  // 5. Check route authorization
  const routeConfig = findRouteConfig(pathname)
  if (!routeConfig) return next() // Allow undefined routes

  if (!routeConfig.allowedRoles.includes(employee.role)) {
    return redirectToForbidden()
  }

  // 6. Set security headers and continue
  return next()
}
```

### 2. Route Configuration Service

**File:** `lib/services/route-config.service.ts`

**Purpose:** Centralized route-to-role mapping

```typescript
export interface RouteConfig {
  path: string
  allowedRoles: Role[]
  description: string
}

export const routeConfigs: RouteConfig[] = [
  // Superadmin only routes
  {
    path: '/dashboard',
    allowedRoles: ['superadmin', 'unit_manager', 'employee'],
    description: 'Dashboard (role-specific content)'
  },
  {
    path: '/units',
    allowedRoles: ['superadmin'],
    description: 'Unit management'
  },
  {
    path: '/users',
    allowedRoles: ['superadmin'],
    description: 'User management'
  },
  {
    path: '/pegawai',
    allowedRoles: ['superadmin'],
    description: 'Employee master data'
  },
  {
    path: '/kpi-config',
    allowedRoles: ['superadmin'],
    description: 'KPI configuration'
  },
  {
    path: '/pool',
    allowedRoles: ['superadmin'],
    description: 'Pool management'
  },
  {
    path: '/reports',
    allowedRoles: ['superadmin'],
    description: 'Reports and analytics'
  },
  {
    path: '/audit',
    allowedRoles: ['superadmin'],
    description: 'Audit trail'
  },
  {
    path: '/settings',
    allowedRoles: ['superadmin'],
    description: 'System settings'
  },
  
  // Manager routes
  {
    path: '/realization',
    allowedRoles: ['unit_manager'],
    description: 'KPI realization input'
  },
  
  // Shared routes
  {
    path: '/profile',
    allowedRoles: ['superadmin', 'unit_manager', 'employee'],
    description: 'User profile'
  },
  {
    path: '/notifications',
    allowedRoles: ['superadmin', 'unit_manager', 'employee'],
    description: 'Notifications'
  }
]

export function findRouteConfig(pathname: string): RouteConfig | undefined {
  // Find exact match first
  let config = routeConfigs.find(rc => pathname === rc.path)
  if (config) return config
  
  // Find prefix match (for nested routes like /units/123)
  config = routeConfigs.find(rc => pathname.startsWith(rc.path + '/'))
  return config
}

export function isRouteAllowed(pathname: string, role: Role): boolean {
  const config = findRouteConfig(pathname)
  if (!config) return true // Allow undefined routes
  return config.allowedRoles.includes(role)
}
```

### 3. Updated RBAC Service

**File:** `lib/services/rbac.service.ts`

**Changes:**
- Update `getMenuItemsForRole()` to use new paths
- Remove role prefix from all menu paths
- Keep permission logic unchanged

```typescript
export function getMenuItemsForRole(role: Role): MenuItem[] {
  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dasbor',
      path: '/dashboard', // Changed from /admin/dashboard, /manager/dashboard, etc.
      icon: 'LayoutDashboard',
    },
    {
      id: 'units',
      label: 'Manajemen Unit',
      path: '/units', // Changed from /admin/units
      icon: 'Building2',
    },
    {
      id: 'users',
      label: 'Manajemen Pengguna',
      path: '/users', // Changed from /admin/users
      icon: 'Users',
    },
    {
      id: 'pegawai',
      label: 'Master Pegawai',
      path: '/pegawai', // Changed from /admin/pegawai
      icon: 'UserCheck',
    },
    {
      id: 'kpi',
      label: 'Konfigurasi KPI',
      path: '/kpi-config', // Changed from /admin/kpi-config
      icon: 'Target',
    },
    {
      id: 'pool',
      label: 'Manajemen Pool',
      path: '/pool', // Changed from /admin/pool
      icon: 'Wallet',
    },
    {
      id: 'realization',
      label: 'Input Realisasi',
      path: '/realization', // Changed from /manager/realization
      icon: 'FileText',
    },
    {
      id: 'reports',
      label: 'Laporan',
      path: '/reports', // Changed from /admin/reports, /manager/reports, etc.
      icon: 'BarChart3',
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      path: '/audit', // Changed from /admin/audit
      icon: 'Shield',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      path: '/settings', // Changed from /admin/settings
      icon: 'Settings',
    },
    {
      id: 'notifications',
      label: 'Notifikasi',
      path: '/notifications',
      icon: 'Bell',
    },
    {
      id: 'profile',
      label: 'Profil',
      path: '/profile',
      icon: 'User',
    },
  ]

  // Filter based on role permissions (logic unchanged)
  return filterMenuItemsByRole(allMenuItems, role)
}
```

### 4. Root Page Redirect

**File:** `app/page.tsx`

**Purpose:** Redirect authenticated users to dashboard

```typescript
export default async function Home() {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  // All authenticated users go to /dashboard
  // Dashboard will show role-specific content
  redirect('/dashboard')
}
```

### 5. Unified Dashboard

**File:** `app/dashboard/page.tsx`

**Purpose:** Single dashboard that shows role-specific content

```typescript
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) redirect('/login')
  
  const { data: employee } = await supabase
    .from('m_employees')
    .select('role')
    .eq('user_id', session.user.id)
    .single()
  
  // Render role-specific dashboard content
  switch (employee?.role) {
    case 'superadmin':
      return <SuperadminDashboard />
    case 'unit_manager':
      return <ManagerDashboard />
    case 'employee':
      return <EmployeeDashboard />
    default:
      redirect('/login')
  }
}
```

## Data Models

### Route Configuration

```typescript
interface RouteConfig {
  path: string              // URL path without role prefix
  allowedRoles: Role[]      // Roles that can access this route
  description: string       // Human-readable description
}

interface LegacyRouteMap {
  [oldPath: string]: string // Maps old paths to new paths
}

const legacyRoutes: LegacyRouteMap = {
  '/admin/dashboard': '/dashboard',
  '/manager/dashboard': '/dashboard',
  '/employee/dashboard': '/dashboard',
  '/admin/units': '/units',
  '/admin/users': '/users',
  '/admin/pegawai': '/pegawai',
  '/admin/kpi-config': '/kpi-config',
  '/admin/pool': '/pool',
  '/admin/reports': '/reports',
  '/admin/audit': '/audit',
  '/admin/settings': '/settings',
  '/manager/realization': '/realization',
  // ... all other legacy routes
}
```

### Middleware Configuration

```typescript
interface MiddlewareConfig {
  publicRoutes: string[]
  protectedRoutes: string[]
  legacyRedirects: LegacyRouteMap
  cacheConfig: {
    employeeDataTTL: number  // Cache TTL in seconds
    routeConfigTTL: number
  }
}

const middlewareConfig: MiddlewareConfig = {
  publicRoutes: ['/login', '/reset-password', '/forbidden'],
  protectedRoutes: [
    '/dashboard',
    '/units',
    '/users',
    '/pegawai',
    '/kpi-config',
    '/pool',
    '/realization',
    '/reports',
    '/audit',
    '/settings',
    '/profile',
    '/notifications'
  ],
  legacyRedirects: legacyRoutes,
  cacheConfig: {
    employeeDataTTL: 300,    // 5 minutes
    routeConfigTTL: 3600     // 1 hour
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: URL Simplification Consistency

*For any* protected route in the system, the URL path should not contain role prefixes (`/admin`, `/manager`, `/employee`).

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10**

### Property 2: Single Authentication Point

*For any* request to a protected route, authentication and authorization checks should occur exactly once in the middleware, not in the page component.

**Validates: Requirements 2.1, 2.5**

### Property 3: Role-Based Access Control

*For any* user with a specific role and any route, if the route's allowed roles do not include the user's role, then the middleware should redirect to `/forbidden` before the page loads.

**Validates: Requirements 2.3, 2.4, 2.5, 2.6, 3.2, 3.3, 3.4**

### Property 4: Backward Compatibility

*For any* legacy URL with role prefix, the system should permanently redirect (HTTP 301) to the equivalent URL without the prefix.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Navigation Consistency

*For any* menu item in the sidebar, the path should match the new URL structure without role prefixes.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 6: Session Validation

*For any* request to a protected route, if the session is invalid or expired, the middleware should redirect to `/login` before any page logic executes.

**Validates: Requirements 2.1, 2.7**

### Property 7: Performance Optimization

*For any* authenticated request, the middleware should complete authentication and authorization checks in less than 50ms on average.

**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Error Scenarios

1. **Unauthenticated Access**
   - Trigger: User not logged in accessing protected route
   - Action: Redirect to `/login`
   - Message: None (silent redirect)

2. **Unauthorized Access**
   - Trigger: User accessing route not allowed for their role
   - Action: Redirect to `/forbidden`
   - Message: "Anda tidak memiliki akses ke halaman ini"

3. **Inactive Employee**
   - Trigger: Employee account is deactivated
   - Action: Redirect to `/login?error=inactive`
   - Message: "Akun Anda tidak aktif. Hubungi administrator."

4. **Session Expired**
   - Trigger: Session token expired
   - Action: Redirect to `/login?error=expired`
   - Message: "Sesi Anda telah berakhir. Silakan login kembali."

5. **Employee Not Found**
   - Trigger: User exists in auth but not in m_employees
   - Action: Redirect to `/login?error=user_not_found`
   - Message: "Data pegawai tidak ditemukan. Hubungi administrator."

6. **Middleware Error**
   - Trigger: Unexpected error in middleware
   - Action: Redirect to `/login`
   - Message: None (error logged server-side)

### Error Response Format

```typescript
interface ErrorResponse {
  code: string
  message: string
  redirectTo: string
}

const errorResponses: Record<string, ErrorResponse> = {
  unauthenticated: {
    code: 'AUTH_REQUIRED',
    message: '',
    redirectTo: '/login'
  },
  unauthorized: {
    code: 'ACCESS_DENIED',
    message: 'Anda tidak memiliki akses ke halaman ini',
    redirectTo: '/forbidden'
  },
  inactive: {
    code: 'ACCOUNT_INACTIVE',
    message: 'Akun Anda tidak aktif. Hubungi administrator.',
    redirectTo: '/login?error=inactive'
  },
  expired: {
    code: 'SESSION_EXPIRED',
    message: 'Sesi Anda telah berakhir. Silakan login kembali.',
    redirectTo: '/login?error=expired'
  },
  user_not_found: {
    code: 'USER_NOT_FOUND',
    message: 'Data pegawai tidak ditemukan. Hubungi administrator.',
    redirectTo: '/login?error=user_not_found'
  }
}
```

## Testing Strategy

### Unit Tests

1. **Route Configuration Tests**
   - Test `findRouteConfig()` with various paths
   - Test `isRouteAllowed()` with different role combinations
   - Test legacy route mapping

2. **RBAC Service Tests**
   - Test `getMenuItemsForRole()` returns correct paths
   - Test menu filtering by role
   - Test permission checks remain unchanged

3. **Middleware Helper Tests**
   - Test public route detection
   - Test legacy route detection and transformation
   - Test role-based authorization logic

### Integration Tests

1. **Middleware Flow Tests**
   - Test unauthenticated access to protected routes
   - Test authenticated access with correct role
   - Test authenticated access with wrong role
   - Test legacy URL redirects
   - Test session expiration handling

2. **Navigation Tests**
   - Test sidebar menu items have correct paths
   - Test clicking menu items navigates to correct URLs
   - Test active route detection works with new paths

3. **End-to-End Tests**
   - Test complete user journey for each role
   - Test backward compatibility with old URLs
   - Test error scenarios and redirects

### Performance Tests

1. **Middleware Performance**
   - Measure middleware execution time
   - Test with concurrent requests
   - Verify caching effectiveness

2. **Page Load Performance**
   - Compare page load times before and after
   - Measure time to first byte (TTFB)
   - Measure time to interactive (TTI)

### Test Data

```typescript
const testScenarios = [
  {
    role: 'superadmin',
    allowedPaths: [
      '/dashboard',
      '/units',
      '/users',
      '/pegawai',
      '/kpi-config',
      '/pool',
      '/reports',
      '/audit',
      '/settings',
      '/profile',
      '/notifications'
    ],
    deniedPaths: []
  },
  {
    role: 'unit_manager',
    allowedPaths: [
      '/dashboard',
      '/realization',
      '/profile',
      '/notifications'
    ],
    deniedPaths: [
      '/units',
      '/users',
      '/pegawai',
      '/kpi-config',
      '/pool',
      '/audit',
      '/settings'
    ]
  },
  {
    role: 'employee',
    allowedPaths: [
      '/dashboard',
      '/profile',
      '/notifications'
    ],
    deniedPaths: [
      '/units',
      '/users',
      '/pegawai',
      '/kpi-config',
      '/pool',
      '/realization',
      '/audit',
      '/settings'
    ]
  }
]
```

## Migration Strategy

### Phase 1: Preparation (No Breaking Changes)

1. Create new route configuration service
2. Update RBAC service with new paths (keep old paths working)
3. Add legacy route mapping
4. Update tests

### Phase 2: Middleware Enhancement

1. Enhance middleware with route authorization
2. Add legacy redirect logic
3. Add performance optimizations
4. Test thoroughly

### Phase 3: File Structure Migration

1. Move page files from role-based folders to root app folder
   - `app/admin/dashboard/page.tsx` → `app/dashboard/page.tsx`
   - `app/admin/units/page.tsx` → `app/units/page.tsx`
   - etc.
2. Update dashboard to handle role-specific content
3. Update all internal links and redirects

### Phase 4: Component Updates

1. Update Sidebar component paths
2. Update all Link components throughout the app
3. Update redirect calls in server actions
4. Update API route references if any

### Phase 5: Testing and Validation

1. Run all unit tests
2. Run integration tests
3. Perform manual testing for each role
4. Test backward compatibility
5. Performance testing

### Phase 6: Cleanup

1. Remove old role-based folders
2. Remove legacy code
3. Update documentation
4. Deploy to production

## Performance Optimizations

### 1. Middleware Caching

```typescript
// Cache employee data to reduce database queries
const employeeCache = new Map<string, {
  data: Employee
  timestamp: number
}>()

function getCachedEmployee(userId: string): Employee | null {
  const cached = employeeCache.get(userId)
  if (!cached) return null
  
  const age = Date.now() - cached.timestamp
  if (age > 300000) { // 5 minutes
    employeeCache.delete(userId)
    return null
  }
  
  return cached.data
}
```

### 2. Route Config Memoization

```typescript
// Memoize route config lookups
const routeConfigCache = new Map<string, RouteConfig | undefined>()

function findRouteConfigCached(pathname: string): RouteConfig | undefined {
  if (routeConfigCache.has(pathname)) {
    return routeConfigCache.get(pathname)
  }
  
  const config = findRouteConfig(pathname)
  routeConfigCache.set(pathname, config)
  return config
}
```

### 3. Optimized Session Validation

```typescript
// Use getSession() instead of getUser() to avoid extra API call
const { data: { session } } = await supabase.auth.getSession()
// This reads from cookie, no network request
```

### 4. Parallel Data Fetching

```typescript
// Fetch employee data and route config in parallel
const [employee, routeConfig] = await Promise.all([
  getEmployee(session.user.id),
  getRouteConfig(pathname)
])
```

## Security Considerations

### 1. Defense in Depth

While middleware handles primary authorization, pages should still validate data access at the RLS level in Supabase. This provides defense in depth.

### 2. Session Security

- Use secure, httpOnly cookies
- Implement CSRF protection
- Set appropriate session timeouts
- Clear cookies on logout

### 3. Rate Limiting

Consider adding rate limiting to middleware to prevent abuse:

```typescript
const rateLimiter = new Map<string, number[]>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const requests = rateLimiter.get(userId) || []
  
  // Keep only requests from last minute
  const recentRequests = requests.filter(time => now - time < 60000)
  
  if (recentRequests.length >= 100) {
    return false // Rate limit exceeded
  }
  
  recentRequests.push(now)
  rateLimiter.set(userId, recentRequests)
  return true
}
```

### 4. Security Headers

Middleware sets security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`

## Deployment Considerations

### Vercel Deployment

1. **Edge Middleware**: Middleware runs on Vercel Edge Network for low latency
2. **Environment Variables**: Ensure all Supabase env vars are set
3. **Build Configuration**: No changes needed to `next.config.js`
4. **Caching**: Leverage Vercel's edge caching for static assets

### Zero-Downtime Deployment

1. Deploy new version with both old and new routes working
2. Monitor for errors
3. Gradually migrate users
4. Remove old routes after validation

### Rollback Plan

If issues occur:
1. Revert to previous deployment (Vercel instant rollback)
2. Old URLs still work due to backward compatibility
3. No data loss (database unchanged)

## Documentation Updates

### Files to Update

1. **README.md**: Update routing section
2. **structure.md**: Update app directory structure
3. **API.md**: Update route examples
4. **QUICKSTART.md**: Update getting started URLs

### New Documentation

Create `ROUTING.md` with:
- Route-to-role mapping table
- Migration guide for developers
- Troubleshooting common issues
- Performance optimization tips
