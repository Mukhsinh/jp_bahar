# Implementation Plan: Comprehensive System Refactoring

## Overview

Implementasi refactoring komprehensif sistem JASPEL untuk mengatasi masalah performa, duplikasi database, menambahkan fitur import/export, dan mempersiapkan deployment production. Tasks diorganisir dalam fase-fase yang dapat dikerjakan secara incremental.

## Tasks

- [x] 1. Fix Critical Runtime Errors
  - Fix chunk loading error yang muncul di console
  - Fix sidebar yang hilang saat navigasi
  - Fix authentication errors
  - _Requirements: 1.1, 1.2, 1.5, 10.1, 10.2, 11.1_

- [x] 1.1 Implement error boundary for chunk loading
  - Create ChunkLoadErrorBoundary component
  - Add error boundary to root layout
  - Implement auto-reload on chunk load error
  - _Requirements: 1.4, 1.5_

- [ ]* 1.2 Write property test for error boundary
  - **Property 1: Error Boundary Catches Dynamic Import Failures**
  - **Validates: Requirements 1.4, 1.5**

- [x] 1.3 Optimize webpack configuration
  - Update next.config.js with optimal code splitting
  - Disable source maps in production
  - Enable compression
  - _Requirements: 1.3_

- [x] 1.4 Fix sidebar layout structure
  - Create authenticated layout with persistent sidebar
  - Move sidebar to layout component
  - Implement proper state management for active menu
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [ ]* 1.5 Write property test for sidebar persistence
  - **Property 8: Navigation Preserves Sidebar State**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 1.6 Fix authentication flow
  - Review and fix middleware auth checking
  - Fix session management
  - Add proper error handling for auth failures
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 1.7 Write property test for authentication
  - **Property 9: Authentication Flow Consistency**
  - **Validates: Requirements 11.1**

- [x] 2. Database Migration - Eliminate m_pegawai Duplication
  - Migrate data from m_pegawai to m_employees
  - Update all code references
  - Drop m_pegawai table
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 2.1 Create database migration script
  - Create backup function for m_pegawai
  - Create data copy function
  - Create foreign key update function
  - Create verification function
  - _Requirements: 2.3, 2.4_

- [x] 2.2 Analyze and document m_pegawai references
  - Search codebase for all m_pegawai references
  - Document all foreign keys pointing to m_pegawai
  - Document all queries using m_pegawai
  - _Requirements: 2.4, 2.5_

- [x] 2.3 Execute database migration
  - Backup m_pegawai data
  - Copy unique records to m_employees
  - Update foreign key constraints
  - Update RLS policies
  - _Requirements: 2.3, 2.4_

- [ ]* 2.4 Write property test for migration data integrity
  - **Property 2: Database Migration Preserves Data Integrity**
  - **Validates: Requirements 2.7**

- [ ]* 2.5 Write property test for migration rollback
  - **Property 15: Migration Rollback Safety**
  - **Validates: Requirements 2.3**

- [x] 2.6 Update application code references
  - Replace all from('m_pegawai') with from('m_employees')
  - Update TypeScript types
  - Update service layer functions
  - Update component queries
  - _Requirements: 2.5_

- [x] 2.7 Verify and drop m_pegawai table
  - Run comprehensive tests
  - Verify all CRUD operations work
  - Drop m_pegawai table
  - Remove unused indexes
  - _Requirements: 2.2, 2.6, 2.7_

- [x] 3. Checkpoint - Verify Critical Fixes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Template Download Feature
  - Add download template buttons to management pages
  - Implement template generation logic
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 4.1 Create template generator service
  - Create TemplateGenerator class
  - Implement generateUnitTemplate method
  - Implement generateEmployeeTemplate method
  - Implement generateUserTemplate method
  - _Requirements: 3.4, 3.5, 3.6, 3.7_

- [ ]* 4.2 Write property test for template structure
  - **Property 12: Template Structure Validity**
  - **Validates: Requirements 3.4, 3.5, 3.6, 3.7**

- [ ] 4.3 Add template download to Unit Management page
  - Add "Download Template" button to UI
  - Wire button to template generator
  - Handle download in browser
  - _Requirements: 3.1, 3.4_

- [ ] 4.4 Add template download to Employee Management page
  - Add "Download Template" button to UI
  - Wire button to template generator
  - Handle download in browser
  - _Requirements: 3.2, 3.4_

- [ ] 4.5 Add template download to User Management page
  - Add "Download Template" button to UI
  - Wire button to template generator
  - Handle download in browser
  - _Requirements: 3.3, 3.4_

- [ ] 5. Implement Data Import Feature
  - Add import buttons to management pages
  - Implement import validation and processing
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [ ] 5.1 Create import service with validation
  - Create ImportService class
  - Implement file validation
  - Implement Excel parsing
  - Implement row validation with rules
  - _Requirements: 4.5, 4.9_

- [ ]* 5.2 Write property test for import validation
  - **Property 3: Import Validation Rejects Invalid Data**
  - **Validates: Requirements 4.5, 4.6, 4.9**

- [ ]* 5.3 Write property test for import data consistency
  - **Property 4: Import Success Preserves Data Consistency**
  - **Validates: Requirements 4.6, 4.7**

- [ ]* 5.4 Write property test for import transaction atomicity
  - **Property 13: Import Transaction Atomicity**
  - **Validates: Requirements 4.6**

- [ ] 5.5 Implement unit import functionality
  - Create importUnits method
  - Implement transaction handling
  - Implement error collection
  - _Requirements: 4.6, 4.7, 4.8_

- [ ] 5.6 Implement employee import functionality
  - Create importEmployees method
  - Handle unit_code to unit_id mapping
  - Implement transaction handling
  - _Requirements: 4.6, 4.7, 4.8_

- [ ] 5.7 Implement user import functionality
  - Create importUsers method
  - Handle employee_code to employee_id mapping
  - Implement transaction handling
  - _Requirements: 4.6, 4.7, 4.8_

- [ ] 5.8 Add import UI to Unit Management page
  - Add "Import Data" button
  - Create import dialog with file upload
  - Display validation errors
  - Display success summary
  - _Requirements: 4.1, 4.4, 4.8_

- [ ] 5.9 Add import UI to Employee Management page
  - Add "Import Data" button
  - Create import dialog with file upload
  - Display validation errors
  - Display success summary
  - _Requirements: 4.2, 4.4, 4.8_

- [ ] 5.10 Add import UI to User Management page
  - Add "Import Data" button
  - Create import dialog with file upload
  - Display validation errors
  - Display success summary
  - _Requirements: 4.3, 4.4, 4.8_

- [ ] 6. Checkpoint - Verify Import/Template Features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Data Export Feature
  - Add export buttons to management pages
  - Implement Excel and PDF export
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [ ] 7.1 Create Excel export service
  - Create ExcelExporter class
  - Implement data formatting
  - Implement column styling
  - Add metadata (timestamp, user)
  - _Requirements: 5.5, 5.8, 5.9_

- [ ]* 7.2 Write property test for export completeness
  - **Property 5: Export Completeness**
  - **Validates: Requirements 5.7**

- [ ]* 7.3 Write property test for export format
  - **Property 6: Export Format Correctness**
  - **Validates: Requirements 5.8**

- [ ]* 7.4 Write property test for export metadata
  - **Property 14: Export Metadata Completeness**
  - **Validates: Requirements 5.9**

- [ ] 7.5 Create PDF export service
  - Create PDFExporter class
  - Implement table generation with jsPDF
  - Add headers and metadata
  - Handle pagination for large datasets
  - _Requirements: 5.6, 5.8, 5.9_

- [ ] 7.6 Add export UI to Unit Management page
  - Add "Export" button with dropdown
  - Implement Excel export handler
  - Implement PDF export handler
  - _Requirements: 5.1, 5.4, 5.5, 5.6_

- [ ] 7.7 Add export UI to Employee Management page
  - Add "Export" button with dropdown
  - Implement Excel export handler
  - Implement PDF export handler
  - _Requirements: 5.2, 5.4, 5.5, 5.6_

- [ ] 7.8 Add export UI to User Management page
  - Add "Export" button with dropdown
  - Implement Excel export handler
  - Implement PDF export handler
  - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ] 8. Verify Employee Management Page
  - Ensure page exists and functions correctly
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

- [ ] 8.1 Verify Employee Management route and page
  - Verify /admin/pegawai route exists
  - Verify page renders correctly
  - Verify data loads from m_employees (after migration)
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8.2 Verify Employee Management CRUD operations
  - Test create employee
  - Test update employee
  - Test delete employee
  - Test search and filter
  - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [ ]* 8.3 Write property test for CRUD constraints
  - **Property 7: CRUD Operations Maintain Database Constraints**
  - **Validates: Requirements 6.9**

- [ ] 8.4 Verify sidebar integration
  - Verify Employee Management appears in sidebar
  - Verify navigation works correctly
  - _Requirements: 6.10_

- [ ] 9. Optimize Navigation and Performance
  - Remove unnecessary rebuilding
  - Improve responsiveness
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 9.1 Remove unnecessary router.refresh() calls
  - Audit codebase for router.refresh() usage
  - Replace with revalidatePath where appropriate
  - Remove unnecessary calls
  - _Requirements: 7.2, 7.6_

- [ ] 9.2 Optimize server actions
  - Use revalidatePath instead of router.refresh
  - Implement proper error handling
  - Add loading states
  - _Requirements: 7.5, 7.7_

- [ ]* 9.3 Write property test for navigation performance
  - **Property 10: Response Time Performance**
  - **Validates: Requirements 9.1**

- [ ]* 9.4 Write property test for loading states
  - **Property 11: Loading State Visibility**
  - **Validates: Requirements 9.2**

- [ ] 9.5 Implement data caching
  - Create useDataCache hook with SWR
  - Apply caching to frequently accessed data
  - Configure cache revalidation
  - _Requirements: 9.4_

- [ ] 9.6 Implement optimistic updates
  - Add optimistic updates to create operations
  - Add optimistic updates to update operations
  - Add optimistic updates to delete operations
  - _Requirements: 9.3_

- [ ] 9.7 Implement pagination
  - Create pagination component
  - Add pagination to Unit Management
  - Add pagination to Employee Management
  - Add pagination to User Management
  - _Requirements: 9.5_

- [ ] 9.8 Implement search debouncing
  - Add debouncing to search inputs
  - Optimize search queries
  - _Requirements: 9.6_

- [ ] 10. Checkpoint - Verify Performance Improvements
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Optimize for Vercel Deployment
  - Configure Next.js for optimal Vercel deployment
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [ ] 11.1 Update Next.js configuration
  - Set output to standalone
  - Enable removeConsole for production
  - Optimize images configuration
  - Configure server actions body size limit
  - _Requirements: 8.1, 8.6, 8.7, 8.9_

- [ ] 11.2 Configure production environment variables
  - Set up .env.production
  - Configure Supabase production URLs
  - Configure site URL
  - _Requirements: 8.2_

- [ ] 11.3 Optimize static assets
  - Configure proper caching headers
  - Optimize image formats
  - Optimize font loading
  - _Requirements: 8.3, 8.4_

- [ ] 11.4 Add production error handling
  - Remove console.log from production code
  - Add proper error boundaries
  - Configure error reporting
  - _Requirements: 8.5, 8.6_

- [ ] 12. Code Refactoring and Best Practices
  - Refactor code to follow best practices
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_

- [ ] 12.1 TypeScript improvements
  - Add proper type definitions where missing
  - Fix any TypeScript errors
  - Remove use of 'any' type
  - _Requirements: 13.1_

- [ ] 12.2 Error handling improvements
  - Add try-catch to all async operations
  - Implement proper error messages
  - Add error logging
  - _Requirements: 13.2_

- [ ] 12.3 Component structure improvements
  - Separate concerns (UI, logic, data)
  - Extract reusable components
  - Improve component organization
  - _Requirements: 13.3_

- [ ] 12.4 Code cleanup
  - Remove duplicate code
  - Remove unused imports
  - Remove unused variables
  - Fix ESLint warnings
  - _Requirements: 13.5, 13.9_

- [ ] 12.5 Security improvements
  - Remove hardcoded secrets
  - Add input validation
  - Review and fix security issues
  - _Requirements: 13.10_

- [ ] 13. Comprehensive Testing
  - Create and run comprehensive tests
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [ ] 13.1 Create login flow test script
  - Test login with valid credentials
  - Test login with invalid credentials
  - Test session management
  - _Requirements: 12.1_

- [ ] 13.2 Create role-based access test scripts
  - Test superadmin access
  - Test unit_manager access
  - Test employee access
  - _Requirements: 12.2_

- [ ] 13.3 Create page access test scripts
  - Test all admin pages
  - Test all manager pages
  - Test all employee pages
  - _Requirements: 12.3_

- [ ] 13.4 Create CRUD operations test scripts
  - Test unit CRUD
  - Test employee CRUD
  - Test user CRUD
  - _Requirements: 12.4_

- [ ] 13.5 Create import/export test scripts
  - Test template download
  - Test data import
  - Test data export (Excel and PDF)
  - _Requirements: 12.5_

- [ ] 13.6 Create RLS policy test scripts
  - Test data isolation between units
  - Test role-based access
  - _Requirements: 12.6_

- [ ] 13.7 Run all tests and generate report
  - Execute all test scripts
  - Document test results
  - Fix any failing tests
  - _Requirements: 12.7, 12.8_

- [ ] 14. Final Verification and Deployment
  - Verify all features work correctly
  - Deploy to Vercel
  - Monitor production

- [ ] 14.1 Pre-deployment verification
  - Run all tests
  - Verify database migration completed
  - Verify no m_pegawai references
  - Build succeeds without errors
  - Verify bundle size

- [ ] 14.2 Deploy to Vercel
  - Configure Vercel project
  - Set environment variables
  - Deploy application
  - Verify deployment success

- [ ] 14.3 Post-deployment verification
  - Run smoke tests on production
  - Verify all pages load
  - Verify authentication works
  - Verify import/export works
  - Monitor error logs

- [ ] 14.4 Performance monitoring
  - Monitor page load times
  - Monitor API response times
  - Monitor error rates
  - Monitor user feedback

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Migration tasks should be executed carefully with proper backups
- Performance optimization should be measured before and after
- All tests should pass before deployment
