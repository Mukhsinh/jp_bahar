# Implementation Plan: Complete System Rebuild

## Overview

Rencana implementasi ini akan memandu perombakan total sistem JASPEL KPI dengan pendekatan bertahap dan terstruktur. Setiap task dirancang untuk dapat diimplementasikan secara incremental dengan testing di setiap checkpoint. Fokus utama adalah stabilitas, performa, dan user experience dengan Bahasa Indonesia.

## Tasks

### Phase 1: Core Infrastructure

- [x] 1. Perbaiki Authentication System
  - Refactor middleware untuk session refresh yang reliable
  - Implement proper error handling tanpa infinite loop
  - Tambahkan pesan error dalam Bahasa Indonesia
  - Test login/logout flow dengan berbagai skenario
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Refactor Auth Service
  - [x] 2.1 Update `lib/services/auth.service.ts`
    - Implement `signIn` dengan error handling yang proper
    - Implement `signOut` dengan session cleanup
    - Implement `getCurrentUser` dengan role fetching
    - Implement `isAuthenticated` check
    - Implement `getUserRole` helper
    - _Requirements: 1.1, 1.2, 1.6_

  - [ ]* 2.2 Write unit tests untuk Auth Service
    - Test successful login
    - Test failed login dengan berbagai error cases
    - Test logout functionality
    - Test session persistence
    - _Requirements: 1.1, 1.2, 1.7_

- [x] 3. Refactor Login Page
  - [x] 3.1 Update `app/login/page.tsx`
    - Implement form dengan React Hook Form
    - Tambahkan validasi dengan pesan Bahasa Indonesia
    - Implement loading state dengan spinner
    - Implement error display yang jelas
    - Tambahkan auto-redirect jika sudah login
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

  - [ ]* 3.2 Write integration tests untuk Login Flow
    - Test successful login flow
    - Test failed login dengan invalid credentials
    - Test auto-redirect untuk authenticated users
    - Test loading states
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 4. Refactor Middleware
  - [x] 4.1 Update `middleware.ts`
    - Implement session refresh yang reliable
    - Implement authentication check untuk protected routes
    - Implement redirect logic yang proper
    - Tambahkan error handling tanpa crash
    - Test dengan berbagai skenario (valid session, expired session, no session)
    - _Requirements: 1.3, 1.4, 1.6_

  - [ ]* 4.2 Write tests untuk Middleware
    - Test session refresh
    - Test redirect untuk unauthenticated users
    - Test redirect untuk authenticated users accessing /login
    - Test protected routes access
    - _Requirements: 1.3, 1.4, 1.6_

- [x] 5. Checkpoint - Test Authentication System
  - Ensure all tests pass
  - Manual test login/logout flow
  - Verify session persistence
  - Verify error handling
  - Ask user if questions arise

### Phase 2: Navigation System

- [x] 6. Refactor Sidebar Component
  - [x] 6.1 Update `components/navigation/Sidebar.tsx`
    - Wrap component dengan Error Boundary internal
    - Implement loading state
    - Implement active state highlighting
    - Tambahkan menu items dalam Bahasa Indonesia
    - Implement responsive design (collapsible di mobile)
    - Tambahkan smooth transitions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.6_

  - [ ]* 6.2 Write tests untuk Sidebar
    - Test menu rendering per role
    - Test active state highlighting
    - Test navigation functionality
    - Test error boundary
    - Test responsive behavior
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Create Error Boundary Component
  - [x] 7.1 Create `components/ErrorBoundary.tsx`
    - Implement React Error Boundary class
    - Tambahkan fallback UI dengan pesan Bahasa Indonesia
    - Implement error logging
    - Tambahkan reset functionality
    - _Requirements: 5.1, 5.5, 5.7_

  - [ ]* 7.2 Write tests untuk Error Boundary
    - Test error catching
    - Test fallback UI rendering
    - Test reset functionality
    - _Requirements: 5.1, 5.7_

- [ ] 8. Refactor Authenticated Layout
  - [ ] 8.1 Update `app/(authenticated)/layout.tsx`
    - Implement server-side user fetching
    - Implement authentication check
    - Wrap children dengan Error Boundary
    - Pass user role ke Sidebar
    - Implement proper loading state
    - _Requirements: 2.1, 5.1, 7.2, 7.3_

  - [ ]* 8.2 Write tests untuk Authenticated Layout
    - Test user fetching
    - Test authentication check
    - Test role-based rendering
    - Test error handling
    - _Requirements: 7.2, 7.3_

- [x] 9. Checkpoint - Test Navigation System
  - Ensure all tests pass
  - Manual test sidebar rendering
  - Verify menu items per role
  - Verify navigation functionality
  - Verify error boundary protection
  - Ask user if questions arise

### Phase 3: Localization System

- [x] 10. Create Translation System
  - [x] 10.1 Create `lib/constants/translations.ts`
    - Define translation constants untuk semua UI text
    - Organize by category (auth, nav, common, errors, validation)
    - Implement helper function untuk get translation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 10.2 Write tests untuk Translation System
    - Test translation retrieval
    - Test parameter substitution
    - Test missing translation handling
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 11. Create Format Utilities
  - [x] 11.1 Create `lib/utils/format.ts`
    - Implement `formatNumber` dengan konvensi Indonesia
    - Implement `formatCurrency` untuk Rupiah
    - Implement `formatDate` dengan format DD/MM/YYYY
    - Implement `formatDateTime` dengan format Indonesia
    - _Requirements: 3.8, 3.9_

  - [ ]* 11.2 Write tests untuk Format Utilities
    - Test number formatting
    - Test currency formatting
    - Test date formatting
    - Test datetime formatting
    - _Requirements: 3.8, 3.9_

- [x] 12. Apply Localization to Core Components
  - [x] 12.1 Update Login Page dengan translations
    - Replace all English text dengan Bahasa Indonesia
    - Use translation constants
    - Use format utilities untuk display
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 12.2 Update Sidebar dengan translations
    - Replace menu labels dengan Bahasa Indonesia
    - Use translation constants
    - _Requirements: 3.6_

  - [x] 12.3 Update Error Boundary dengan translations
    - Replace error messages dengan Bahasa Indonesia
    - Use translation constants
    - _Requirements: 3.2_

  - [x] 12.4 Update Global Error Page dengan translations
    - Update `app/error.tsx`
    - Replace all text dengan Bahasa Indonesia
    - Use translation constants
    - _Requirements: 3.2_
    - Use translation constants
    - _Requirements: 3.2_

- [x] 13. Checkpoint - Test Localization
  - Ensure all tests pass
  - Manual check semua UI text dalam Bahasa Indonesia
  - Verify number formatting
  - Verify date formatting
  - Ask user if questions arise

### Phase 4: Performance Optimization

- [x] 14. Optimize Component Architecture
  - [x] 14.1 Audit dan convert ke Server Components
    - Review semua components
    - Convert ke Server Component jika tidak perlu interactivity
    - Keep 'use client' hanya untuk interactive components
    - _Requirements: 4.5, 8.3_

  - [x] 14.2 Implement Data Caching
    - Update `lib/hooks/useDataCache.ts` jika perlu
    - Implement caching untuk frequently accessed data
    - Add TTL support
    - _Requirements: 4.7_

  - [x] 14.3 Add Loading States
    - Add loading spinners untuk semua async operations
    - Implement skeleton loaders untuk data tables
    - Ensure feedback dalam 200ms
    - _Requirements: 4.2, 4.3_

- [x] 15. Optimize Bundle Size
  - [x] 15.1 Update `next.config.js`
    - Configure modularizeImports untuk lucide-react
    - Enable compression
    - Configure removeConsole untuk production
    - _Requirements: 4.4_

  - [x] 15.2 Implement Lazy Loading
    - Identify heavy components
    - Implement dynamic imports
    - Test loading behavior
    - _Requirements: 4.6_

- [x] 16. Optimize Database Queries
  - [x] 16.1 Review dan optimize queries
    - Audit semua database queries
    - Add indexes jika diperlukan
    - Optimize RLS policies
    - _Requirements: 9.5_

  - [ ]* 16.2 Test query performance
    - Measure query execution time
    - Verify indexes are used
    - Test dengan large datasets
    - _Requirements: 9.5_

- [x] 17. Checkpoint - Test Performance
  - Run Lighthouse audit
  - Verify page load < 2 seconds
  - Verify feedback < 200ms
  - Verify bundle size acceptable untuk Vercel free tier
  - Ask user if questions arise

### Phase 5: Feature Completion

- [x] 18. Audit dan Complete Missing Features
  - [x] 18.1 Audit semua pages dan components
    - List semua buttons dan forms
    - Identify missing implementations
    - Prioritize by importance
    - _Requirements: 6.1, 6.2_

  - [x] 18.2 Implement missing CRUD operations
    - Complete all Create operations
    - Complete all Read operations
    - Complete all Update operations
    - Complete all Delete operations
    - Add proper validation untuk semua forms
    - _Requirements: 6.4, 6.3_

  - [x] 18.3 Implement Export/Import features
    - Complete Excel export functionality
    - Complete PDF export functionality
    - Complete data import dengan validasi
    - _Requirements: 6.5, 6.6_

  - [x] 18.4 Implement Search dan Filter
    - Add search functionality ke semua tables
    - Add filter functionality ke semua tables
    - Implement efficient search algorithms
    - _Requirements: 6.7_

- [x] 19. Apply Localization to All Pages
  - [x] 19.1 Update Admin pages
    - Dashboard: `app/admin/dashboard/page.tsx`
    - Units: `app/admin/units/page.tsx`
    - Users: `app/admin/users/page.tsx`
    - Pegawai: `app/admin/pegawai/page.tsx`
    - KPI Config: `app/admin/kpi-config/page.tsx`
    - Pool: `app/admin/pool/page.tsx`
    - Reports: `app/admin/reports/page.tsx`
    - Audit: `app/admin/audit/page.tsx`
    - Settings: `app/admin/settings/page.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 19.2 Update Manager pages
    - Dashboard: `app/manager/dashboard/page.tsx`
    - Realization: `app/manager/realization/page.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 19.3 Update Employee pages
    - Dashboard: `app/employee/dashboard/page.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 19.4 Update Common pages
    - Profile: `app/profile/page.tsx`
    - Notifications: `app/notifications/page.tsx`
    - Reset Password: `app/reset-password/page.tsx`
    - Forbidden: `app/forbidden/page.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 20. Apply Localization to All Components
  - [x] 20.1 Update KPI components
    - `components/kpi/KPITree.tsx`
    - `components/kpi/CategoryFormDialog.tsx`
    - `components/kpi/IndicatorFormDialog.tsx`
    - `components/kpi/CopyStructureDialog.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 20.2 Update Pool components
    - `components/pool/PoolTable.tsx`
    - `components/pool/PoolFormDialog.tsx`
    - `components/pool/PoolDetailsDialog.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 20.3 Update Unit components
    - `components/units/UnitTable.tsx`
    - `components/units/UnitFormDialog.tsx`
    - `components/units/DeleteUnitDialog.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 20.4 Update User components
    - `components/users/UserTable.tsx`
    - `components/users/UserFormDialog.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 20.5 Update Pegawai components
    - `components/pegawai/PegawaiTable.tsx`
    - `components/pegawai/PegawaiFormDialog.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 20.6 Update Realization components
    - `components/realization/RealizationForm.tsx`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 21. Checkpoint - Test Feature Completion
  - Ensure all features implemented
  - Verify all buttons functional
  - Verify all forms working
  - Verify all text dalam Bahasa Indonesia
  - Ask user if questions arise

### Phase 6: Error Handling Enhancement

- [x] 22. Enhance Error Handling
  - [x] 22.1 Add Error Boundaries to authenticated layouts
    - Wrap children in `app/(authenticated)/layout.tsx` dengan ErrorBoundary
    - Wrap children in `app/admin/layout.tsx` dengan ErrorBoundary
    - Wrap children in `app/manager/layout.tsx` dengan ErrorBoundary
    - Wrap children in `app/employee/layout.tsx` dengan ErrorBoundary
    - _Requirements: 5.1, 5.7_

  - [x] 22.2 Standardize API Error Handling
    - Create error handler utility di `lib/utils/error-handler.ts`
    - Implement consistent error responses
    - Add error translation untuk common errors
    - Update existing API routes untuk use error handler
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 22.3 Implement Toast Notifications
    - Install sonner library: `npm install sonner`
    - Create toast provider di root layout
    - Replace console.log success messages dengan toast.success
    - Replace alert error messages dengan toast.error
    - Use Bahasa Indonesia messages
    - _Requirements: 3.2, 5.2_

  - [x] 22.4 Add Error Logging
    - Create error logging utility di `lib/utils/error-logger.ts`
    - Log errors to console (development only)
    - Add structured error logging dengan context
    - Prepare for external logging service (production)
    - _Requirements: 5.6_

- [ ] 23. Checkpoint - Test Error Handling
  - Test error boundaries dengan forced errors
  - Test API error handling
  - Test toast notifications
  - Verify error messages dalam Bahasa Indonesia
  - Ask user if questions arise

### Phase 7: Security and RLS Verification

- [ ] 24. Verify RLS Policies
  - [ ] 24.1 Review existing RLS policies
    - Audit all RLS policies di `supabase/schema.sql`
    - Verify policies are correct
    - Test policies dengan different roles
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 24.2 Write RLS policy tests
    - Test superadmin access (should see all)
    - Test unit manager access (should see only their unit)
    - Test employee access (should see only their data)
    - Test unauthorized access attempts
    - _Requirements: 7.2, 7.3, 7.4, 7.7_

- [ ] 25. Verify Authorization
  - [ ] 25.1 Add server-side authorization checks
    - Verify authorization di semua Server Actions
    - Verify authorization di semua API routes
    - Add proper error responses
    - _Requirements: 7.4, 7.7_

  - [ ]* 25.2 Write authorization tests
    - Test authorized access
    - Test unauthorized access
    - Test role-based access
    - _Requirements: 7.4, 7.7_

- [ ] 26. Security Audit
  - [ ] 26.1 Audit security practices
    - Verify no service role key di client-side
    - Verify secure session management
    - Verify input validation
    - Verify SQL injection prevention
    - _Requirements: 7.5, 7.6_

  - [ ] 26.2 Fix security issues
    - Fix any identified security issues
    - Add additional security measures if needed
    - Document security practices
    - _Requirements: 7.5, 7.6_

- [ ] 27. Checkpoint - Test Security
  - Run security audit
  - Test RLS policies
  - Test authorization
  - Verify no security vulnerabilities
  - Ask user if questions arise

### Phase 8: Testing and Quality Assurance

- [ ] 28. Write Comprehensive Tests
  - [ ]* 28.1 Write unit tests untuk utilities
    - Test format utilities
    - Test translation utilities
    - Test validation utilities
    - _Requirements: 3.8, 3.9, 10.1_

  - [ ]* 28.2 Write unit tests untuk services
    - Test auth service
    - Test user service
    - Test RBAC service
    - Test other services
    - _Requirements: 1.1, 1.2, 7.4_

  - [ ]* 28.3 Write integration tests
    - Test authentication flow
    - Test navigation flow
    - Test CRUD operations
    - Test form submissions
    - _Requirements: 1.1, 2.3, 6.3, 6.4_

- [ ] 29. Manual Testing
  - [ ] 29.1 Execute manual testing checklist
    - Test authentication scenarios
    - Test navigation scenarios
    - Test localization
    - Test performance
    - Test error handling
    - Test features
    - Test security
    - _Requirements: All_

  - [ ] 29.2 Fix identified issues
    - Document all issues found
    - Prioritize issues
    - Fix critical issues
    - Fix high priority issues
    - _Requirements: All_

- [ ] 30. Checkpoint - Test Quality
  - Ensure all automated tests pass
  - Complete manual testing checklist
  - Fix all critical issues
  - Document known issues
  - Ask user if questions arise

### Phase 9: Documentation and Cleanup

- [x] 31. Clean Up Codebase
  - [x] 31.1 Remove unused documentation files
    - Remove PERBAIKAN_*.md files (over 50 files)
    - Remove JALANKAN_*.md files
    - Remove SOLUSI_*.md files
    - Remove CARA_*.md files
    - Remove LOGIN_*.md files
    - Remove STATUS_*.md files
    - Remove RINGKASAN_*.md files
    - Keep only: README.md, DATABASE_SETUP.md, DEPLOYMENT.md, API.md, PROJECT_SUMMARY.md
    - _Requirements: 8.2_

  - [x] 31.2 Remove unused scripts
    - Remove fix-*.ps1 scripts (over 20 files)
    - Remove diagnose-*.ps1 scripts
    - Remove test-*-fix.ts scripts
    - Remove restart-*.ps1 scripts
    - Keep only: setup-auth.ts, verify-*.ts, test-auth-flow.ts, test-rls-policies.ts
    - _Requirements: 8.2_

  - [x] 31.3 Code cleanup
    - Remove commented code
    - Remove console.logs (except error logging)
    - Fix linting issues dengan `npm run lint`
    - Format code consistently
    - _Requirements: 8.1, 8.6_

  - [x] 31.4 Organize imports
    - Use consistent import order (React, Next, external, internal, types)
    - Ensure all imports use absolute paths (@/)
    - Remove unused imports
    - _Requirements: 8.1_

- [x] 32. Update Documentation
  - [x] 32.1 Update README.md
    - Update project description
    - Update setup instructions (simplified)
    - Update usage instructions
    - Add troubleshooting section
    - Remove outdated information
    - _Requirements: 11.6_

  - [x] 32.2 Create DEPLOYMENT.md guide
    - Document Vercel deployment process
    - Document environment variables
    - Document database setup steps
    - Document common deployment issues
    - _Requirements: 11.6_

- [x] 33. Checkpoint - Final Review
  - Review all code changes
  - Verify documentation is complete
  - Verify codebase is clean
  - Run `npm run lint` dan fix all issues
  - Ask user for final approval

### Phase 10: Production Deployment

- [x] 34. Prepare for Production
  - [x] 34.1 Build production bundle
    - Run `npm run build`
    - Fix any build errors
    - Verify bundle size
    - _Requirements: 11.1, 11.2_

  - [x] 34.2 Test production build locally
    - Run `npm run start`
    - Test all functionality
    - Verify performance
    - _Requirements: 11.7_

  - [x] 34.3 Configure environment variables
    - Set up production environment variables
    - Verify all required variables are set
    - Test with production variables
    - _Requirements: 11.3_

- [ ] 35. Deploy to Vercel
  - [ ] 35.1 Deploy to staging
    - Deploy to Vercel staging environment
    - Test staging deployment
    - Verify all functionality works
    - _Requirements: 11.7_

  - [ ] 35.2 Deploy to production
    - Deploy to Vercel production
    - Monitor deployment
    - Verify production is working
    - _Requirements: 11.7_

  - [ ] 35.3 Post-deployment verification
    - Test all critical flows
    - Monitor error logs
    - Monitor performance
    - _Requirements: 11.7_

- [ ] 36. Final Checkpoint
  - Verify production deployment successful
  - Verify all features working in production
  - Monitor for any issues
  - Document any post-deployment tasks
  - Celebrate successful rebuild! 🎉

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Focus on one phase at a time for manageable progress
- Test thoroughly at each checkpoint before proceeding
- Keep user informed of progress and any blockers
