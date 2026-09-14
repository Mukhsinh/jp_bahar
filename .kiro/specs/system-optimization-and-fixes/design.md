# Design Document: System Optimization and Fixes

## Overview

This design document outlines the comprehensive solution for optimizing the JASPEL KPI Management System and fixing critical issues affecting performance, stability, and user experience. The solution addresses loading errors, authentication flow optimization, data import/export features, route race conditions, development experience improvements, database query optimization, error handling, Vercel deployment optimization, database schema consistency, and performance monitoring.

### Key Objectives

1. Eliminate all loading errors and ensure smooth application startup
2. Optimize authentication flow to prevent race conditions and infinite loops
3. Add comprehensive data import/export capabilities with Excel and PDF support
4. Improve navigation performance and eliminate route race conditions
5. Optimize development experience by reducing unnecessary rebuilds
6. Implement efficient database query patterns with caching and pagination
7. Add proper error boundaries for graceful error handling
8. Optimize build configuration for Vercel free tier deployment
9. Ensure database schema consistency without duplications
10. Implement performance monitoring and logging

### Technology Stack

- **Frontend**: Next.js 15 App Router, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth), Server Actions
- **UI**: Shadcn UI, Tailwind CSS
- **Data Processing**: XLSX for Excel, jsPDF for PDF
- **Performance**: React.useTransition, Suspense, caching strategies
- **Deployment**: Vercel (free tier optimized)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React UI    │  │  Router      │  │  Cache Layer │      │
│  │  Components  │  │  (App Router)│  │  (Client)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│    ─────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────┐
│                  Supabase Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  t_settings  │  │  auth.users  │  │ m_employees  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Settings Context Provider

Context provider untuk mengelola state settings secara global dengan real-time updates.

```typescript
interface SettingsContextValue {
  settings: Settings | null
  loading: boolean
  error: string | null
  updateSettings: (settings: Partial<Settings>) => Promise<void>
  refreshSettings: () => Promise<void>
}

interface Settings {
  companyInfo: {
    appName: string
    name: string
    address: string
    logo: string
  }
  footer: {
    text: string
  }
  taxRates: Record<string, number>
  calculationParams: {
    minScore: number
    maxScore: number
  }
  sessionTimeout: {
    hours: number
  }
  emailTemplates: Record<string, string>
}
```

### 2. Optimized Settings Service

Service yang dioptimasi dengan caching dan event broadcasting.

```typescript
interface SettingsServiceInterface {
  getSettings(): Promise<Settings>
  updateSettings(settings: Partial<Settings>): Promise<void>
  subscribeToChanges(callback: (settings: Settings) => void): () => void
  invalidateCache(): void
}
```

### 3. Optimized Auth Hook

Hook autentikasi yang dioptimasi untuk mengurangi re-render dan request berulang.

```typescript
interface AuthHookInterface {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}
```

### 4. Navigation Optimization

Sistem navigasi yang dioptimasi dengan prefetching dan caching.

```typescript
interface NavigationInterface {
  navigate: (path: string) => void
  prefetch: (path: string) => void
  isPending: boolean
}
```

## Data Models

### Settings Model

```typescript
type Settings = {
  companyInfo: {
    appName: string
    name: string
    address: string
    logo: string
  }
  footer: {
    text: string
  }
  taxRates: Record<string, number>
  calculationParams: {
    minScore: number
    maxScore: number
  }
  sessionTimeout: {
    hours: number
  }
  emailTemplates: Record<string, string>
}
```

### Indonesian Translations Model

```typescript
type Translations = {
  // Navigation
  nav: {
    dashboard: string
    users: string
    units: string
    kpiConfig: string
    pool: string
    reports: string
    audit: string
    settings: string
    profile: string
    notifications: string
    realization: string
    logout: string
  }
  // Common actions
  actions: {
    save: string
    cancel: string
    delete: string
    edit: string
    add: string
    search: string
    filter: string
    export: string
    import: string
    submit: string
    close: string
    confirm: string
  }
  // Messages
  messages: {
    saveSuccess: string
    saveError: string
    deleteSuccess: string
    deleteError: string
    loading: string
    noData: string
    confirmDelete: string
    confirmLogout: string
  }
  // Form labels
  forms: {
    email: string
    password: string
    fullName: string
    role: string
    unit: string
    status: string
    description: string
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Settings Persistence

*For any* valid settings update, saving the settings should result in the same values being retrievable from the database immediately after.

**Validates: Requirements 1.1, 1.5**

### Property 2: Settings Real-time Update

*For any* component subscribed to settings changes, when settings are updated, the component should receive the new settings within 1 second.

**Validates: Requirements 1.3, 6.2, 6.3**

### Property 3: Logout Responsiveness

*For any* logout action, the system should complete the logout process and redirect to login page within 2 seconds.

**Validates: Requirements 2.3, 2.4**

### Property 4: Navigation Performance

*For any* navigation action between pages, the transition should complete within 300ms on average.

**Validates: Requirements 3.1, 3.3**

### Property 5: Auth State Consistency

*For any* auth state check across different components, all components should return the same user state at any given time.

**Validates: Requirements 3.6, 5.4**

### Property 6: Translation Completeness

*For all* UI text elements, there should exist a corresponding Indonesian translation.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

### Property 7: Cache Invalidation

*For any* settings update, all cached settings values should be invalidated and refreshed within 1 second.

**Validates: Requirements 1.2, 6.5**

### Property 8: Loading State Visibility

*For any* async operation taking longer than 200ms, a loading indicator should be displayed to the user.

**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Settings Update Errors

- **Validation Error**: Tampilkan pesan error spesifik dalam Bahasa Indonesia
- **Network Error**: Retry otomatis hingga 3 kali dengan exponential backoff
- **Database Error**: Log error dan tampilkan pesan user-friendly

### Logout Errors

- **Session Error**: Force clear local session dan redirect ke login
- **Network Error**: Clear local session dan redirect ke login (offline logout)
- **Timeout Error**: Force logout setelah 5 detik

### Navigation Errors

- **Route Not Found**: Redirect ke halaman 404
- **Permission Denied**: Redirect ke halaman forbidden
- **Loading Timeout**: Tampilkan error state dengan retry option

### Translation Errors

- **Missing Translation**: Fallback ke English text dengan warning di console
- **Invalid Key**: Log error dan gunakan key sebagai fallback text

## Testing Strategy

### Unit Tests

- Test settings service CRUD operations
- Test auth service logout functionality
- Test translation utility functions
- Test cache invalidation logic
- Test error handling untuk setiap service

### Property-Based Tests

- Test settings persistence property dengan random settings values
- Test real-time update property dengan multiple subscribers
- Test navigation performance dengan berbagai route combinations
- Test auth state consistency across components
- Test translation completeness dengan semua UI keys

### Integration Tests

- Test end-to-end settings update flow
- Test logout flow dari berbagai halaman
- Test navigation flow antar semua halaman
- Test real-time settings update di multiple components

### Performance Tests

- Measure navigation time untuk setiap route
- Measure settings update latency
- Measure logout response time
- Measure component render time setelah optimasi

## Implementation Notes

### Optimization Strategies

1. **Settings Caching**: Gunakan React Context dengan local state caching
2. **Auth State**: Single source of truth dengan minimal re-fetching
3. **Navigation**: Gunakan Next.js router dengan prefetching
4. **Lazy Loading**: Load komponen berat hanya saat dibutuhkan
5. **Memoization**: Gunakan useMemo dan useCallback untuk expensive operations

### Performance Targets

- Settings update: < 1 second
- Logout: < 2 seconds
- Navigation: < 300ms
- Initial page load: < 2 seconds
- Component re-render: < 100ms

### Backward Compatibility

- Semua perubahan harus backward compatible
- Fungsi auth yang sudah ada tidak boleh diubah
- Database schema tidak berubah
- API endpoints tetap sama

### Deployment Considerations

- Zero downtime deployment
- Gradual rollout dengan feature flags
- Rollback plan jika ada issues
- Monitoring dan alerting untuk performance metrics
