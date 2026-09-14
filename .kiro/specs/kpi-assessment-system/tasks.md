# Implementation Plan: KPI Assessment System

## Overview

This implementation plan breaks down the KPI Assessment System into discrete, manageable tasks that build incrementally. Each task focuses on specific functionality while ensuring integration with the existing JASPEL system architecture.

## Tasks

- [x] 1. Database Schema and Migration Setup
  - Create database migration for t_kpi_assessments table
  - Add assessment status view (v_assessment_status)
  - Implement RLS policies for data security
  - Create necessary indexes for performance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2_

- [ ]* 1.1 Write property test for database schema
  - **Property 7: Assessment data persistence completeness**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ]* 1.2 Write property test for RLS policies
  - **Property 9: Unit-based authorization enforcement**
  - **Validates: Requirements 5.5**

- [x] 2. RBAC and Menu System Integration
  - Add assessment permissions to rbac.service.ts
  - Update role permissions for unit_manager and superadmin
  - Add "Penilaian KPI" menu item to sidebar
  - Implement route permissions for /assessment path
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 2.1 Write property test for role-based menu access
  - **Property 1: Role-based menu access control**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 2.2 Write unit tests for menu navigation
  - Test menu click navigation
  - Test icon display
  - Test menu positioning
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 3. Assessment Service Implementation
  - Create lib/services/assessment.service.ts
  - Implement CRUD operations for assessments
  - Add score calculation functions
  - Implement data validation logic
  - Add audit trail functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 3.1 Write property test for achievement calculation
  - **Property 5: Achievement percentage calculation accuracy**
  - **Validates: Requirements 4.1, 4.2**

- [ ]* 3.2 Write property test for score calculation
  - **Property 6: Score calculation rules**
  - **Validates: Requirements 4.3, 4.4, 4.5**

- [ ]* 3.3 Write property test for input validation
  - **Property 16: Input validation comprehensiveness**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 4. API Routes Implementation
  - Create app/api/assessment/route.ts for CRUD operations
  - Create app/api/assessment/employees/route.ts for employee listing
  - Create app/api/assessment/status/route.ts for status checking
  - Implement authentication and authorization middleware
  - Add comprehensive error handling
  - _Requirements: 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 5.5, 8.4_

- [ ]* 4.1 Write property test for employee filtering
  - **Property 2: Unit-based employee filtering**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 4.2 Write property test for assessment updates
  - **Property 8: Assessment update idempotency**
  - **Validates: Requirements 5.3**

- [x] 5. Assessment Page Implementation
  - Create app/(authenticated)/assessment/page.tsx
  - Implement period selector component
  - Add employee list display with status indicators
  - Implement search and pagination functionality
  - Add loading states and error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 5.1 Write property test for data completeness
  - **Property 3: Assessment form data completeness**
  - **Validates: Requirements 2.3, 3.4**

- [ ]* 5.2 Write property test for status calculation
  - **Property 12: Assessment status calculation accuracy**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 6. Assessment Table Component
  - Create components/assessment/AssessmentTable.tsx
  - Implement employee list with status indicators
  - Add "Nilai" button for each employee
  - Implement color coding for status (green/yellow/red)
  - Add real-time status updates
  - _Requirements: 2.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 6.1 Write property test for status color coding
  - **Property 13: Status color coding consistency**
  - **Validates: Requirements 7.5**

- [x] 7. Assessment Form Dialog Component
  - Create components/assessment/AssessmentFormDialog.tsx
  - Implement KPI indicator grouping by category (P1, P2, P3)
  - Add input fields for realization value and notes
  - Implement real-time score calculation display
  - Add form validation and error handling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 7.1 Write property test for KPI grouping
  - **Property 4: KPI indicator grouping consistency**
  - **Validates: Requirements 3.2, 3.3**

- [ ]* 7.2 Write unit tests for form validation
  - Test required field validation
  - Test numeric input validation
  - Test form submission prevention
  - _Requirements: 9.3, 9.1_

- [x] 8. Checkpoint - Core Assessment Functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Calculation Service Integration
  - Modify services/calculation.service.ts
  - Update calculateIndividualScores to use assessment data
  - Implement fallback to realization data
  - Add assessment score aggregation logic
  - Maintain backward compatibility
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 9.1 Write property test for score integration
  - **Property 10: Assessment score integration**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 9.2 Write property test for score aggregation
  - **Property 11: Score aggregation and weighting accuracy**
  - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 10. Audit Trail Implementation
  - Enhance assessment service with audit logging
  - Add audit information display in forms
  - Implement change history tracking
  - Add authorization checks for modifications
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 10.1 Write property test for audit trail
  - **Property 14: Audit trail completeness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**

- [ ]* 10.2 Write property test for modification authorization
  - **Property 15: Authorization enforcement for modifications**
  - **Validates: Requirements 8.4**

- [x] 11. Assessment Reports Implementation
  - Create assessment report components
  - Implement completion rate calculations
  - Add score breakdown by category and employee
  - Implement unit-level performance averages
  - Add period comparison functionality
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [ ]* 11.1 Write property test for report accuracy
  - **Property 17: Assessment report accuracy**
  - **Validates: Requirements 10.1, 10.2, 10.4**

- [ ]* 11.2 Write property test for period comparison
  - **Property 19: Period comparison accuracy**
  - **Validates: Requirements 10.5**

- [x] 12. Excel Export Functionality
  - Implement Excel export for assessment reports
  - Add detailed breakdown formatting
  - Ensure proper data organization
  - Add export validation
  - _Requirements: 10.3_

- [ ]* 12.1 Write property test for export format
  - **Property 18: Report export format consistency**
  - **Validates: Requirements 10.3**

- [x] 13. Integration Testing and Refinement
  - Test complete assessment workflow
  - Verify integration with existing calculation system
  - Test role-based access control
  - Validate data consistency across components
  - _Requirements: All requirements integration_

- [ ]* 13.1 Write integration tests for end-to-end flow
  - Test complete assessment process
  - Test role-based restrictions
  - Test data consistency

- [x] 14. Performance Optimization
  - Add database query optimization
  - Implement caching for frequently accessed data
  - Optimize component rendering
  - Add loading states and error boundaries
  - _Performance and user experience improvements_

- [x] 15. Final Checkpoint - Complete System Validation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are met
  - Test system performance under load
  - Validate security and authorization

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation maintains strict compatibility with existing JASPEL architecture
- All database operations must respect RLS policies for data security
- TypeScript is used throughout for type safety and better development experience