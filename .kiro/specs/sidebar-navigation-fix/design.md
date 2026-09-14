# Design Document: Sidebar Navigation Fix

## Overview

Dokumen ini menjelaskan desain solusi untuk memperbaiki masalah sidebar navigasi yang tidak terlihat dan tombol logout yang tidak berfungsi normal di sistem JASPEL. Solusi ini fokus pada perbaikan CSS, layout integration, dan memastikan logout flow berjalan dengan benar tanpa mengubah sistem autentikasi yang sudah berjalan baik.

## Architecture

### Component Structure

```
Sidebar Component (Client Component)
├── Desktop Sidebar (fixed, hidden lg:block)
│   ├── Header (Logo + Collapse Button)
│   ├── User Info Section
│   ├── Navigation Menu
│   └── Logout Button
├── Mobile Menu Button (lg:hidden)
└── Mobile Sidebar (overlay, conditional render)
    ├── Header
    ├── User Info Section
    ├── Navigation Menu
    └── Logout Button
```

### Layout Integration

```
Layout Component (Server Component)
├── <div className="flex h-screen overflow-hidden">
│   ├── <Sidebar /> (Client Component)
│   └── <main className="flex-1 overflow-y-auto lg:ml-72">
│       └── {children}
```

### Key Design Decisions

1. **Sidebar tetap menggunakan fixed positioning** untuk desktop, bukan absolute
2. **Main content menggunakan margin-left** untuk memberikan ruang bagi sidebar
3. **Z-index hierarchy**: Mobile overlay (z-50) > Sidebar (z-40) > Content (z-0)
4. **Logout menggunakan window.location.replace()** untuk hard redirect
5. **Error boundaries** untuk mencegah crash jika ada error di sidebar

## Components and Interfaces

### Sidebar Component

**File**: `components/navigation/Sidebar.tsx`

**Props**: None (menggunakan hooks untuk data)

**State**:
```typescript
- isCollapsed: boolean (desktop sidebar state)
- isMobileOpen: boolean (mobile sidebar state)
- showLogoutDialog: boolean (logout confirmation)
- unreadCount: number (notification badge)
- unitName: string (user's unit name)
- isPending: boolean (navigation loading state)
```

**Hooks Used**:
```typescript
- usePathname() // untuk active menu detection
- useRouter() // untuk navigation
- useMenuItems() // untuk menu items berdasarkan role
- useAuth() // untuk user data
```

**Key Methods**:
```typescript
- handleLogout(): Promise<void> // logout flow
- isActive(path: string): boolean // check active menu
- handleNavigation(path: string): void // navigate with loading state
- handleMouseEnter(path: string): void // prefetch on hover
```

### Layout Components

**Files**: 
- `app/admin/layout.tsx`
- `app/manager/layout.tsx`
- `app/employee/layout.tsx`

**Structure**:
```typescript
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <main className="flex-1 overflow-y-auto bg-gray-50 lg:ml-72">
    <div className="container mx-auto p-6">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  </main>
</div>
```

**Key Changes**:
- Tambahkan `lg:ml-72` pada main element untuk memberikan ruang bagi sidebar
- Pastikan `overflow-hidden` pada container untuk mencegah double scrollbar
- Gunakan `overflow-y-auto` pada main untuk scrolling content

## Data Models

### User Interface (from useAuth)

```typescript
interface User {
  id: string
  email: string
  role: 'superadmin' | 'unit_manager' | 'employee'
  full_name?: string
  unit_id?: string
}
```

### MenuItem Interface (from rbac.service)

```typescript
interface MenuItem {
  id: string
  label: string
  path: string
  icon: string
  permission?: Permission
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sidebar Visibility Consistency

*For any* authenticated user on any protected route (admin/manager/employee), the sidebar component should be rendered and visible in the DOM with appropriate styling classes.

**Validates: Requirements 1.1, 1.2**

### Property 2: Layout Margin Consistency

*For any* layout component (admin/manager/employee), the main content element should have `lg:ml-72` class when sidebar is expanded to prevent content overlap.

**Validates: Requirements 2.3**

### Property 3: Logout Session Cleanup

*For any* logout action, after calling authService.logout(), localStorage, sessionStorage, and auth cookies should be cleared before redirect.

**Validates: Requirements 3.3, 3.4**

### Property 4: Logout Redirect Reliability

*For any* logout flow (success or failure), the system should always redirect to /login using window.location.replace() to ensure hard navigation.

**Validates: Requirements 3.4, 3.5**

### Property 5: Menu Items Role Mapping

*For any* user role, the menu items returned by useMenuItems() should match exactly the items defined in getMenuItemsForRole() for that role.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 6: Active Menu Detection

*For any* current pathname and menu item path, isActive() should return true if pathname equals path or starts with path + '/'.

**Validates: Requirements 4.5**

### Property 7: Responsive Breakpoint Behavior

*For any* viewport width, if width >= 1024px then desktop sidebar should be visible and mobile button hidden, else mobile button visible and desktop sidebar hidden.

**Validates: Requirements 1.3, 1.4, 5.3**

### Property 8: Error Boundary Protection

*For any* error thrown within Sidebar component, the ErrorBoundary should catch it and prevent full application crash while logging the error.

**Validates: Requirements 6.5**

## Error Handling

### Sidebar Component Errors

1. **Unit Name Load Failure**
   - Catch error in useEffect
   - Log to console.error
   - Continue rendering sidebar without unit name
   - No user-facing error message

2. **Notification Count Load Failure**
   - Catch error silently
   - Set unreadCount to 0
   - Continue rendering sidebar without badge
   - No user-facing error message

3. **User Data Not Available**
   - Check if user is null before rendering user-dependent UI
   - Show loading state or skeleton
   - Prevent rendering menu items if user is null

### Logout Errors

1. **Supabase Logout Failure**
   - Log error to console
   - Continue with storage cleanup
   - Force redirect to /login anyway
   - Rationale: Better to force logout than leave user stuck

2. **Storage Cleanup Failure**
   - Wrap in try-catch
   - Log error
   - Continue with redirect
   - Rationale: Redirect is more important than perfect cleanup

3. **Redirect Failure**
   - Use window.location.replace() as primary method
   - No fallback needed (browser API is reliable)
   - If somehow fails, user can manually navigate to /login

### Navigation Errors

1. **Router Push Failure**
   - Wrapped in startTransition for better UX
   - If fails, user can click again
   - No explicit error handling needed (Next.js handles it)

2. **Prefetch Failure**
   - Silent failure is acceptable
   - Prefetch is optimization, not critical
   - No error handling needed

## Testing Strategy

### Unit Tests

**File**: `components/navigation/__tests__/Sidebar.test.tsx`

Tests to implement:
1. Sidebar renders with user data
2. Logout button shows confirmation dialog
3. Menu items filtered by role
4. Active menu detection works correctly
5. Mobile menu toggle works
6. Collapse/expand works on desktop

**File**: `lib/services/__tests__/auth.service.test.ts`

Tests to implement:
1. Logout clears localStorage
2. Logout clears sessionStorage
3. Logout clears cookies
4. Logout calls supabase.auth.signOut()
5. Logout redirects to /login

### Property-Based Tests

**File**: `components/navigation/__tests__/Sidebar.properties.test.tsx`

Property tests to implement (minimum 100 iterations each):

1. **Property 1: Sidebar Visibility** - Generate random authenticated users and routes, verify sidebar is in DOM
2. **Property 5: Menu Items Role Mapping** - Generate random roles, verify menu items match rbac.service
3. **Property 6: Active Menu Detection** - Generate random pathnames and menu paths, verify isActive logic
4. **Property 7: Responsive Breakpoint** - Generate random viewport widths, verify correct sidebar variant shown

**File**: `lib/services/__tests__/auth.service.properties.test.ts`

Property tests to implement:

1. **Property 3: Logout Session Cleanup** - After logout, verify all storage is empty
2. **Property 4: Logout Redirect** - After logout (success or failure), verify redirect occurred

### Integration Tests

**File**: `__tests__/integration/sidebar-navigation.test.tsx`

Tests to implement:
1. Full navigation flow from login to dashboard to other pages
2. Logout flow from any page returns to login
3. Sidebar persists across page navigations
4. Mobile sidebar closes after navigation

### Manual Testing Checklist

- [ ] Login as superadmin, verify all admin menus visible
- [ ] Login as unit_manager, verify only manager menus visible
- [ ] Login as employee, verify only employee menu visible
- [ ] Click logout, verify confirmation dialog appears
- [ ] Confirm logout, verify redirect to /login
- [ ] After logout, try accessing protected route, verify redirect to /login
- [ ] Test on mobile (< 1024px), verify hamburger menu works
- [ ] Test on desktop (>= 1024px), verify sidebar always visible
- [ ] Test collapse/expand on desktop
- [ ] Test navigation between pages, verify sidebar persists
- [ ] Test with slow network, verify loading states work

## Implementation Notes

### CSS Classes to Verify

**Desktop Sidebar**:
```css
fixed left-0 top-0 h-screen
hidden lg:block
w-72 (expanded) or w-20 (collapsed)
z-40
```

**Mobile Sidebar**:
```css
lg:hidden
fixed inset-0 z-30 (overlay)
absolute left-0 top-0 h-screen w-80 (sidebar)
z-50 (above overlay)
```

**Main Content**:
```css
flex-1
overflow-y-auto
lg:ml-72 (untuk memberikan ruang bagi sidebar)
```

### Logout Flow Sequence

1. User clicks "Keluar" button
2. showLogoutDialog set to true
3. Dialog appears with confirmation
4. User clicks "Ya, Keluar"
5. setShowLogoutDialog(false)
6. Call authService.logout()
7. authService.logout() calls supabase.auth.signOut({ scope: 'global' })
8. Clear localStorage.clear()
9. Clear sessionStorage.clear()
10. Clear all cookies (iterate and expire)
11. Wait 100ms for cleanup
12. window.location.replace('/login')
13. Middleware detects no session, allows access to /login

### Z-Index Hierarchy

```
Mobile Sidebar Overlay: z-50
Logout Dialog: z-50
Mobile Sidebar: z-30 (inside overlay)
Desktop Sidebar: z-40
Mobile Menu Button: z-50
Main Content: z-0 (default)
```

### Responsive Breakpoints

- Mobile: < 1024px (lg breakpoint)
- Desktop: >= 1024px

### Performance Considerations

1. **Prefetch on hover**: Improve navigation speed
2. **useTransition for navigation**: Better UX during navigation
3. **Memoized menu items**: Prevent unnecessary recalculation
4. **Debounced notification polling**: Every 120 seconds, not on every render
5. **Conditional rendering**: Only render mobile or desktop, not both

## Deployment Considerations

### Vercel Compatibility

- All changes are frontend only
- No new dependencies required
- No impact on build size
- No impact on serverless functions
- Compatible with Vercel free tier

### Browser Compatibility

- window.location.replace(): Supported in all browsers
- Flexbox layout: Supported in all modern browsers
- CSS Grid: Not used, so no compatibility issues
- Tailwind classes: All standard, well-supported

### Performance Impact

- No additional API calls
- No additional database queries
- Minimal JavaScript bundle size increase
- No impact on Core Web Vitals

## Security Considerations

### Logout Security

- Use `scope: 'global'` to clear all sessions across devices
- Clear all storage to prevent token reuse
- Use hard redirect to prevent back button access
- Middleware will enforce authentication on protected routes

### XSS Prevention

- No dangerouslySetInnerHTML used
- All user data properly escaped by React
- No eval() or similar dangerous functions

### CSRF Prevention

- Supabase handles CSRF tokens automatically
- No custom form submissions in sidebar
- All navigation uses Next.js router (safe)

## Rollback Plan

If issues occur after deployment:

1. **Revert layout changes**: Remove `lg:ml-72` from main elements
2. **Revert sidebar CSS**: Restore previous positioning classes
3. **Revert logout changes**: Restore previous logout implementation
4. **Database**: No database changes, so no rollback needed
5. **Cache**: Clear Vercel cache if needed

## Success Criteria

1. Sidebar visible on all protected routes (admin/manager/employee)
2. Logout button successfully logs out and redirects to /login
3. No console errors related to sidebar or logout
4. All existing functionality still works (no regression)
5. Mobile and desktop views both work correctly
6. All tests pass (unit, property, integration)
7. Manual testing checklist completed
8. No performance degradation
9. Successfully deployed to Vercel
10. User feedback confirms issues are resolved
