# Implementation Plan: Comprehensive System Enhancement

## Overview

This implementation plan breaks down the comprehensive enhancement of the JASPEL Enterprise Incentive & KPI System into discrete, manageable tasks. The system is built using Next.js 15, React 19, TypeScript, and Supabase.

The implementation follows an incremental approach, building core functionality first, then adding features layer by layer, with testing integrated throughout.

## Tasks

### Phase 1: Authentication and Authorization Foundation

- [x] 1. Enhance authentication system
  - Implement enhanced login page with role-based redirection
  - Add session management with 8-hour timeout
  - Implement forgot password functionality
  - Add account lockout after 5 failed attempts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ]* 1.1 Write property test for role-based dashboard redirection
  - **Property 1: Role-based dashboard redirection**
  - **Validates: Requirements 1.1, 1.6**

- [ ]* 1.2 Write property test for invalid credentials handling
  - **Property 2: Invalid credentials error handling**
  - **Validates: Requirements 1.2**

- [x] 2. Implement role-based access control (RBAC)
  - Create middleware for route protection
  - Implement permission checking system
  - Add RLS policy enforcement
  - Create 403 Forbidden page
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 2.1 Write property test for access control enforcement
  - **Property 3: Role-based access control enforcement**
  - **Validates: Requirements 4.2**

- [ ]* 2.2 Write property test for RLS filtering
  - **Property 4: Row-level security filtering**
  - **Validates: Requirements 4.3, 4.4, 4.5**

- [ ]* 2.3 Write property test for session termination on role change
  - **Property 5: Session termination on role change**
  - **Validates: Requirements 2.6, 4.6**

- [x] 3. Checkpoint - Ensure authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 2: User Management Module

- [x] 4. Implement user management CRUD operations
  - Create user list page with search and pagination
  - Implement user creation form with validation
  - Add user edit functionality
  - Implement user deactivation
  - Add role assignment with session termination
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ]* 4.1 Write property test for user creation with temporary password
  - **Property 7: User creation with temporary password**
  - **Validates: Requirements 2.2**

- [ ]* 4.2 Write property test for email format validation
  - **Property 8: Email format validation**
  - **Validates: Requirements 2.3**

- [ ]* 4.3 Write property test for user deactivation
  - **Property 9: User deactivation and session revocation**
  - **Validates: Requirements 2.4**

- [ ]* 4.4 Write property test for user search filtering
  - **Property 10: User search filtering**
  - **Validates: Requirements 2.5**

- [ ]* 4.5 Write property test for duplicate email prevention
  - **Property 11: Duplicate email prevention**
  - **Validates: Requirements 2.7**

- [ ]* 4.6 Write property test for pagination
  - **Property 12: Pagination for large datasets**
  - **Validates: Requirements 2.8, 20.2**

- [x] 5. Implement password management
  - Create password change form in profile settings
  - Add password validation (8 chars, uppercase, number, special char)
  - Implement current password verification
  - Add temporary password generation for admin reset
  - Implement forced password change for temporary passwords
  - Add password reset link with 24-hour expiration
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ]* 5.1 Write property test for password validation rules
  - **Property 13: Password validation rules**
  - **Validates: Requirements 3.3**

- [ ]* 5.2 Write property test for current password verification
  - **Property 14: Current password verification**
  - **Validates: Requirements 3.2**

- [ ]* 5.3 Write property test for temporary password generation
  - **Property 15: Temporary password generation**
  - **Validates: Requirements 3.5**

- [ ]* 5.4 Write property test for password reset link expiration
  - **Property 16: Password reset link expiration**
  - **Validates: Requirements 3.7**

- [x] 6. Checkpoint - Ensure user management tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Navigation and UI Components

- [x] 7. Implement modern sidebar navigation
  - Create Sidebar component with collapse functionality
  - Add menu item highlighting for active routes
  - Implement tooltip display for collapsed sidebar
  - Add responsive behavior (hamburger menu for mobile)
  - Implement submenu expansion with chevron rotation
  - Add logout confirmation dialog
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ]* 7.1 Write property test for menu filtering by role
  - **Property 6: Menu filtering by role permissions**
  - **Validates: Requirements 4.7**

- [ ]* 7.2 Write unit tests for sidebar UI interactions
  - Test collapse/expand animation
  - Test hover effects
  - Test active state highlighting
  - Test tooltip display
  - Test responsive breakpoints
  - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

- [x] 8. Implement dashboard pages for all roles
  - Create Superadmin dashboard with system-wide metrics
  - Create Unit Manager dashboard with unit-specific metrics
  - Create Employee dashboard with personal metrics
  - Add loading skeletons for all dashboards
  - Implement chart components with auto-resize
  - Add stale data indicator with refresh button
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 8.1 Write property test for Superadmin dashboard metrics
  - **Property 66: Superadmin dashboard metrics**
  - **Validates: Requirements 6.1**

- [ ]* 8.2 Write property test for Unit Manager dashboard metrics
  - **Property 67: Unit Manager dashboard metrics**
  - **Validates: Requirements 6.2**

- [ ]* 8.3 Write property test for Employee dashboard metrics
  - **Property 68: Employee dashboard metrics**
  - **Validates: Requirements 6.3**

- [ ]* 8.4 Write property test for stale data indicator
  - **Property 69: Stale data indicator**
  - **Validates: Requirements 6.7**

- [x] 9. Checkpoint - Ensure navigation and dashboard tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 4: Unit Management Module

- [x] 10. Implement unit management CRUD operations
  - Create unit list page with table display
  - Implement unit creation form with code uniqueness validation
  - Add unit edit functionality with proportion update
  - Implement unit deletion with employee count constraint
  - Add unit proportion sum validation (100% ± 0.01%)
  - Implement unit deactivation with calculation exclusion
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ]* 10.1 Write property test for unit code uniqueness
  - **Property 17: Unit code uniqueness**
  - **Validates: Requirements 7.2**

- [ ]* 10.2 Write property test for unit deletion constraint
  - **Property 18: Unit deletion constraint**
  - **Validates: Requirements 7.4**

- [ ]* 10.3 Write property test for unit proportion sum validation
  - **Property 19: Unit proportion sum validation**
  - **Validates: Requirements 7.5**

- [ ]* 10.4 Write property test for unit deactivation
  - **Property 20: Unit deactivation and calculation exclusion**
  - **Validates: Requirements 7.7**

- [ ]* 10.5 Write property test for unit list display
  - **Property 70: Unit list display**
  - **Validates: Requirements 7.1, 7.6**

- [x] 11. Checkpoint - Ensure unit management tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: KPI Configuration Module

- [x] 12. Implement KPI configuration system
  - Create KPI configuration page with tree view
  - Implement category creation with weight validation (P1+P2+P3=100%)
  - Add indicator creation with weight validation (sum=100% per category)
  - Implement indicator weight update with score recalculation
  - Add indicator deletion with realization data warning
  - Implement KPI structure copy functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ]* 12.1 Write property test for category weight sum validation
  - **Property 21: Category weight sum validation**
  - **Validates: Requirements 8.2**

- [ ]* 12.2 Write property test for indicator weight sum validation
  - **Property 22: Indicator weight sum validation**
  - **Validates: Requirements 8.3**

- [ ]* 12.3 Write property test for weight update triggers recalculation
  - **Property 23: Weight update triggers recalculation**
  - **Validates: Requirements 8.4**

- [ ]* 12.4 Write property test for indicator deletion constraint
  - **Property 24: Indicator deletion constraint**
  - **Validates: Requirements 8.5**

- [ ]* 12.5 Write property test for KPI structure copying
  - **Property 25: KPI structure copying**
  - **Validates: Requirements 8.7**

- [ ]* 12.6 Write property test for KPI tree structure display
  - **Property 71: KPI tree structure display**
  - **Validates: Requirements 8.1, 8.6**

- [x] 13. Checkpoint - Ensure KPI configuration tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Pool Management Module

- [x] 14. Implement pool management system
  - Create pool list page with history display
  - Implement pool creation with period validation (YYYY-MM, unique)
  - Add revenue item management (add/edit/delete)
  - Add deduction item management (add/edit/delete)
  - Implement automatic calculations (revenue total, net pool, allocated amount)
  - Add pool approval workflow with immutability enforcement
  - Implement draft mode with full CRUD permissions
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ]* 14.1 Write property test for pool period validation
  - **Property 26: Pool period uniqueness and format validation**
  - **Validates: Requirements 9.1**

- [ ]* 14.2 Write property test for revenue total calculation
  - **Property 27: Revenue total calculation**
  - **Validates: Requirements 9.2**

- [ ]* 14.3 Write property test for net pool calculation
  - **Property 28: Net pool calculation**
  - **Validates: Requirements 9.3**

- [ ]* 14.4 Write property test for allocated amount calculation
  - **Property 29: Allocated amount calculation**
  - **Validates: Requirements 9.4**

- [ ]* 14.5 Write property test for pool approval immutability
  - **Property 30: Pool approval immutability**
  - **Validates: Requirements 9.5**

- [ ]* 14.6 Write property test for draft pool mutability
  - **Property 31: Draft pool mutability**
  - **Validates: Requirements 9.7**

- [ ]* 14.7 Write property test for pool history display
  - **Property 72: Pool history display**
  - **Validates: Requirements 9.6**

- [x] 15. Checkpoint - Ensure pool management tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 7: Realization Input Module

- [x] 16. Implement realization input system
  - Create realization input page with employee/period selection
  - Implement RLS filtering for Unit Manager (only their unit's employees)
  - Add indicator loading based on employee's unit
  - Implement realization value input with achievement calculation
  - Add save functionality with required field validation
  - Implement bulk import from Excel with validation
  - Add update capability for existing realizations
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ]* 16.1 Write property test for Unit Manager data filtering
  - **Property 32: Unit manager data filtering**
  - **Validates: Requirements 10.1**

- [ ]* 16.2 Write property test for achievement percentage calculation
  - **Property 33: Achievement percentage calculation**
  - **Validates: Requirements 10.3, 10.7**

- [ ]* 16.3 Write property test for realization data validation
  - **Property 34: Realization data validation**
  - **Validates: Requirements 10.4**

- [ ]* 16.4 Write property test for bulk import validation
  - **Property 35: Bulk import validation**
  - **Validates: Requirements 10.5**

- [ ]* 16.5 Write property test for realization update capability
  - **Property 36: Realization update capability**
  - **Validates: Requirements 10.6**

- [x] 17. Checkpoint - Ensure realization input tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 8: Calculation Engine

- [x] 18. Implement calculation engine core
  - Create calculation service with Decimal.js for precision
  - Implement prerequisite validation (pool approved, all realizations present, weights sum to 100%)
  - Add individual KPI score calculation (P1, P2, P3 with weights)
  - Implement unit score aggregation
  - Add pool distribution to units based on proportions
  - Implement employee incentive calculation within units
  - Add tax calculation based on tax status
  - Implement transaction management with rollback on error
  - Add calculation logging to t_calculation_log
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ]* 18.1 Write property test for individual KPI score calculation
  - **Property 37: Individual KPI score calculation**
  - **Validates: Requirements 11.1, 11.2**

- [ ]* 18.2 Write property test for unit score aggregation
  - **Property 38: Unit score aggregation**
  - **Validates: Requirements 11.3**

- [ ]* 18.3 Write property test for decimal precision maintenance
  - **Property 39: Decimal precision maintenance**
  - **Validates: Requirements 11.4**

- [ ]* 18.4 Write property test for tax calculation by status
  - **Property 40: Tax calculation by status**
  - **Validates: Requirements 11.5**

- [ ]* 18.5 Write property test for calculation result storage
  - **Property 41: Calculation result storage**
  - **Validates: Requirements 11.6**

- [ ]* 18.6 Write property test for calculation error rollback
  - **Property 42: Calculation error rollback**
  - **Validates: Requirements 11.7**

- [x] 19. Checkpoint - Ensure calculation engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 9: Reporting Module

- [x] 20. Implement reporting system
  - Create reports page with report type selection
  - Implement incentive report generation with all columns
  - Add KPI achievement report generation
  - Implement unit comparison report generation
  - Add employee slip generation with P1/P2/P3 breakdown
  - Implement empty period handling with error message
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.7, 12.8_

- [ ]* 20.1 Write property test for incentive report generation
  - **Property 43: Incentive report generation**
  - **Validates: Requirements 12.2**

- [ ]* 20.2 Write property test for KPI achievement report generation
  - **Property 44: KPI achievement report generation**
  - **Validates: Requirements 12.3**

- [ ]* 20.3 Write property test for unit comparison report generation
  - **Property 45: Unit comparison report generation**
  - **Validates: Requirements 12.4**

- [ ]* 20.4 Write property test for empty period handling
  - **Property 48: Empty period handling**
  - **Validates: Requirements 12.7**

- [ ]* 20.5 Write property test for employee slip generation
  - **Property 49: Employee slip generation**
  - **Validates: Requirements 12.8**

- [x] 21. Implement export functionality
  - Create Excel export service with formatting (bold headers, thousand separators, % symbol)
  - Create PDF export service with formatting (logo, title, date, table)
  - Add export functionality to all reports
  - _Requirements: 12.5, 12.6_

- [ ]* 21.1 Write property test for Excel export formatting
  - **Property 46: Excel export formatting**
  - **Validates: Requirements 12.5, 16.1, 16.2, 16.7**

- [ ]* 21.2 Write property test for PDF export formatting
  - **Property 47: PDF export formatting**
  - **Validates: Requirements 12.6**

- [x] 22. Checkpoint - Ensure reporting tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 10: Data Import/Export

- [x] 23. Implement data import/export functionality
  - Create employee data export to Excel
  - Create KPI template export with formatting and sample data
  - Implement realization data import with validation
  - Add import error reporting with row numbers and details
  - Implement import success feedback with record count
  - Create template download with instructions sheet
  - Add calculation results export with multiple sheets
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

- [ ]* 23.1 Write property test for import validation
  - **Property 50: Import validation**
  - **Validates: Requirements 16.3**

- [ ]* 23.2 Write property test for import error reporting
  - **Property 51: Import error reporting**
  - **Validates: Requirements 16.4**

- [ ]* 23.3 Write property test for import success feedback
  - **Property 52: Import success feedback**
  - **Validates: Requirements 16.5**

- [ ]* 23.4 Write property test for template generation
  - **Property 53: Template generation**
  - **Validates: Requirements 16.6**

- [x] 24. Checkpoint - Ensure import/export tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 11: Profile Management

- [x] 25. Implement profile management
  - Create profile page with user information display
  - Add profile update form with validation
  - Implement profile photo upload with format/size validation
  - Add email change with verification flow
  - Implement tax status update for employees
  - Add profile update error handling with specific messages
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

- [ ]* 25.1 Write property test for profile information display
  - **Property 54: Profile information display**
  - **Validates: Requirements 17.1**

- [ ]* 25.2 Write property test for profile update validation
  - **Property 55: Profile update validation**
  - **Validates: Requirements 17.2**

- [ ]* 25.3 Write property test for profile photo validation
  - **Property 56: Profile photo validation**
  - **Validates: Requirements 17.3**

- [ ]* 25.4 Write property test for tax status update
  - **Property 57: Tax status update application**
  - **Validates: Requirements 17.6**

- [ ]* 25.5 Write property test for profile update error messages
  - **Property 58: Profile update error messages**
  - **Validates: Requirements 17.7**

- [x] 26. Checkpoint - Ensure profile management tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 12: Search and Filter Functionality

- [x] 27. Implement search and filter system
  - Add search functionality with real-time updates (500ms debounce)
  - Implement filter application with immediate updates
  - Add multiple filter combination with AND logic
  - Implement filter reset functionality
  - Add empty search results handling with helpful message
  - Implement date range filter with validation
  - Add filtered data export capability
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

- [ ]* 27.1 Write property test for search functionality
  - **Property 59: Search functionality**
  - **Validates: Requirements 18.1**

- [ ]* 27.2 Write property test for filter application
  - **Property 60: Filter application**
  - **Validates: Requirements 18.2**

- [ ]* 27.3 Write property test for multiple filter combination
  - **Property 61: Multiple filter combination**
  - **Validates: Requirements 18.3**

- [ ]* 27.4 Write property test for filter reset
  - **Property 62: Filter reset**
  - **Validates: Requirements 18.4**

- [ ]* 27.5 Write property test for empty search results
  - **Property 63: Empty search results handling**
  - **Validates: Requirements 18.5**

- [ ]* 27.6 Write property test for date range filter
  - **Property 64: Date range filter validation**
  - **Validates: Requirements 18.6**

- [ ]* 27.7 Write property test for filtered data export
  - **Property 65: Filtered data export**
  - **Validates: Requirements 18.7**

- [x] 28. Checkpoint - Ensure search and filter tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 13: Application Settings

- [x] 29. Implement application settings
  - Create settings page with all sections (Company Info, Tax Config, Calculation Parameters, Email Templates, Session Settings)
  - Add company information update with report integration
  - Implement tax rate configuration with validation (0-50%, all statuses)
  - Add calculation parameter configuration with min<max validation
  - Implement email template management with preview
  - Add session timeout configuration with validation (1-24 hours)
  - Implement settings change audit logging
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ]* 29.1 Write property test for tax rate validation
  - **Property 73: Tax rate validation**
  - **Validates: Requirements 13.3**

- [ ]* 29.2 Write property test for calculation parameter validation
  - **Property 74: Calculation parameter validation**
  - **Validates: Requirements 13.4**

- [ ]* 29.3 Write property test for session timeout validation
  - **Property 75: Session timeout validation**
  - **Validates: Requirements 13.6**

- [ ]* 29.4 Write property test for settings change audit logging
  - **Property 76: Settings change audit logging**
  - **Validates: Requirements 13.7**

- [x] 30. Checkpoint - Ensure settings tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 14: Audit Trail and Logging

- [x] 31. Implement audit trail and logging system
  - Create audit log table and schema
  - Implement CRUD operation logging to t_audit_log
  - Add audit log viewing page with filters (date range, user, table, operation)
  - Implement calculation logging to t_calculation_log
  - Add authentication logging to t_auth_log (login/logout with IP)
  - Implement sensitive data access logging
  - Add audit log export functionality
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ]* 31.1 Write property test for CRUD operation audit logging
  - **Property 77: CRUD operation audit logging**
  - **Validates: Requirements 14.1**

- [ ]* 31.2 Write property test for audit log filtering
  - **Property 78: Audit log filtering**
  - **Validates: Requirements 14.2**

- [ ]* 31.3 Write property test for calculation logging
  - **Property 79: Calculation logging**
  - **Validates: Requirements 14.3**

- [ ]* 31.4 Write property test for authentication logging
  - **Property 80: Authentication logging**
  - **Validates: Requirements 14.4**

- [ ]* 31.5 Write property test for sensitive data access logging
  - **Property 81: Sensitive data access logging**
  - **Validates: Requirements 14.5**

- [ ]* 31.6 Write property test for audit log export
  - **Property 82: Audit log export**
  - **Validates: Requirements 14.6**

- [x] 32. Checkpoint - Ensure audit and logging tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 15: Notification System

- [x] 33. Implement notification system
  - Create notification table and schema
  - Add notification display page with unread count badge
  - Implement notification click handling (mark as read, navigate)
  - Add email notification service integration
  - Implement notification triggers (pool approval, calculation complete, password reset, new user)
  - Add email retry logic with failure logging
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ]* 33.1 Write property test for notification unread count
  - **Property 83: Notification unread count display**
  - **Validates: Requirements 15.5**

- [ ]* 33.2 Write property test for notification read and navigation
  - **Property 84: Notification read and navigation**
  - **Validates: Requirements 15.6**

- [x] 34. Checkpoint - Ensure notification tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 16: Responsive Design

- [x] 35. Implement responsive design
  - Add responsive breakpoints for desktop (≥1024px), tablet (768-1023px), mobile (<768px)
  - Implement responsive sidebar (full/collapsed/hamburger)
  - Add responsive layouts (multi-column/2-column/single-column)
  - Implement responsive tables (scrolling/card view)
  - Add responsive charts with auto-scaling
  - Implement device orientation handling
  - Add appropriate input types for mobile forms
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

- [ ]* 35.1 Write property test for mobile form input types
  - **Property 89: Mobile form input types**
  - **Validates: Requirements 19.6**

- [ ]* 35.2 Write unit tests for responsive breakpoints
  - Test desktop layout (≥1024px)
  - Test tablet layout (768-1023px)
  - Test mobile layout (<768px)
  - Test orientation change
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [x] 36. Checkpoint - Ensure responsive design tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 17: Performance Optimization

- [x] 37. Implement performance optimizations
  - Add pagination for datasets >100 records (50 per page)
  - Implement background processing for calculations >50 employees
  - Add image lazy loading (defer until 200px from viewport)
  - Implement client-side routing for instant transitions
  - Add response caching (5 minutes for data accessed >3 times in 5 minutes)
  - Optimize database queries with indexes
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

- [ ]* 37.1 Write property test for background processing
  - **Property 85: Background processing for large calculations**
  - **Validates: Requirements 20.3**

- [ ]* 37.2 Write property test for image lazy loading
  - **Property 86: Image lazy loading**
  - **Validates: Requirements 20.4**

- [ ]* 37.3 Write property test for client-side routing
  - **Property 87: Client-side routing**
  - **Validates: Requirements 20.5**

- [ ]* 37.4 Write property test for response caching
  - **Property 88: Response caching**
  - **Validates: Requirements 20.6**

- [x] 38. Checkpoint - Ensure performance optimization tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 18: Integration and Final Testing

- [x] 39. Integration testing
  - Test complete calculation flow (realization → calculation → report)
  - Test user management flow (create → assign role → login → access control)
  - Test KPI configuration flow (create structure → input realization → calculate)
  - Test pool management flow (create → add items → approve → calculate)
  - Test reporting flow (generate → export Excel → export PDF)

- [ ]* 39.1 Write integration test for complete calculation flow
  - Test end-to-end from realization input to incentive distribution
  - Verify all intermediate calculations are correct
  - Verify final results match expected values

- [ ]* 39.2 Write integration test for user management flow
  - Test user creation, role assignment, login, and access control
  - Verify RLS policies work correctly
  - Verify session management works correctly

- [x] 40. Final checkpoint - Ensure all tests pass
  - Run complete test suite
  - Verify all property tests pass (minimum 100 iterations each)
  - Verify all unit tests pass
  - Verify all integration tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- All monetary calculations use Decimal.js for precision
- All tests should be written using fast-check for property-based testing
- Each property test should run minimum 100 iterations
- Each property test must reference its design document property number

