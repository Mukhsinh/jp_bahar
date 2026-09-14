# Implementation Plan: User-Employee Separation

## Overview

This implementation plan separates user authentication from employee data by migrating to Supabase Auth's native auth.users table. The approach is incremental and safe, with rollback capabilities at each step.

## Tasks

- [x] 1. Create database migration for schema changes
  - Create new migration file in supabase/migrations/
  - Add user_id column to m_employees (nullable initially)
  - Create unique index on m_employees.user_id
  - Update helper functions to use auth.uid()
  - Keep old columns (email, role) temporarily for safety
  - _Requirements: 1.1, 1.3, 1.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Create data migration script
  - [x] 2.1 Implement migration script in scripts/migrate-users-to-auth.ts
    - Fetch all employees from m_employees
    - For each employee, create auth.users record with Supabase Admin API
    - Generate temporary password using format JASPEL-YYYYMMDD-XXXX
    - Set user_metadata with role, full_name, employee_id, unit_id
    - Update m_employees.user_id with new auth.users.id
    - Log each migration step for audit
    - Handle errors gracefully (skip duplicates, log failures)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for migration idempotency
    - **Property 4: Data Migration Idempotency**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.3 Write unit tests for migration script
    - Test with empty database
    - Test with existing users
    - Test with duplicate emails
    - Test error handling
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Update TypeScript database types
  - Update lib/types/database.types.ts
  - Add user_id field to m_employees type
  - Remove email and role fields from m_employees type
  - Add UserMetadata interface for auth.users metadata
  - Add UserWithEmployee interface for joined data
  - _Requirements: 5.5_

- [ ] 4. Update UserService for new structure
  - [x] 4.1 Implement new UserService methods
    - Update createUser() to create both auth.users and m_employees
    - Update getUserById() to join auth.users with m_employees
    - Update getUserByEmail() to query auth.users then join
    - Update updateUser() to update appropriate tables
    - Update listUsers() to join tables
    - Add deactivateUser() method
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 4.2 Write property test for user-employee bijection
    - **Property 1: User-Employee Bijection**
    - **Validates: Requirements 1.3, 6.4**

  - [ ]* 4.3 Write property test for transaction atomicity
    - **Property 7: Transaction Atomicity**
    - **Validates: Requirements 7.1, 5.2**

  - [ ]* 4.4 Write unit tests for UserService
    - Test createUser with valid data
    - Test createUser with duplicate email
    - Test getUserById with existing user
    - Test updateUser operations
    - Test deactivateUser
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.5_

- [ ] 5. Update AuthService for new structure
  - [x] 5.1 Update AuthService methods
    - Update getCurrentUser() to use auth.uid() and join with m_employees
    - Update signIn() to work with auth.users
    - Ensure user_metadata is included in session
    - Update password reset to use Supabase Auth API
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 5.2 Write property test for authentication isolation
    - **Property 3: Authentication Isolation**
    - **Validates: Requirements 1.1, 3.1**

  - [ ]* 5.3 Write unit tests for AuthService
    - Test signIn with valid credentials
    - Test getCurrentUser returns joined data
    - Test password reset flow
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 6. Update RLS policies and test
  - [x] 6.1 Verify RLS policies work with new helper functions
    - Test policies with superadmin user
    - Test policies with unit_manager user
    - Test policies with employee user
    - Verify data isolation between units
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.2 Write property test for RLS policy correctness
    - **Property 5: RLS Policy Correctness**
    - **Validates: Requirements 4.1, 4.5**

- [x] 7. Update UI components for user management
  - Update app/admin/users/page.tsx to use new UserService
  - Update components/users/UserTable.tsx to display joined data
  - Update components/users/UserFormDialog.tsx for user creation
  - Update form validation for new structure
  - _Requirements: 5.1, 5.2, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Update audit and logging tables
  - [x] 8.1 Update audit tables to reference auth.users.id
    - Modify t_audit_log to use user_id from auth.users
    - Modify t_auth_log to use user_id from auth.users
    - Update audit service to log with new structure
    - Ensure historical data remains queryable
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.2 Write property test for audit trail preservation
    - **Property 8: Audit Trail Preservation**
    - **Validates: Requirements 8.4, 8.5**

- [x] 9. Checkpoint - Run migration and verify
  - Run database migration SQL
  - Run data migration script
  - Verify all employees have user_id
  - Verify all auth.users have employee records
  - Test login with migrated users
  - Verify RLS policies work correctly
  - Check audit logs are working
  - Ensure all tests pass
  - Ask user if any issues arise

- [x] 10. Cleanup old structure
  - [x] 10.1 Remove old columns after verification
    - Drop email column from m_employees
    - Drop role column from m_employees
    - Make user_id NOT NULL
    - Update any remaining queries using old columns
    - _Requirements: 1.4_

  - [ ]* 10.2 Write property test for referential integrity
    - **Property 6: Referential Integrity**
    - **Validates: Requirements 6.1, 6.2**

- [x] 11. Update all dashboard pages
  - Update app/admin/dashboard/page.tsx
  - Update app/manager/dashboard/page.tsx
  - Update app/employee/dashboard/page.tsx
  - Update app/profile/page.tsx
  - Verify all pages load correctly with new structure
  - _Requirements: 5.1, 5.2, 3.2_

- [x] 12. Final checkpoint - End-to-end testing
  - Test complete user creation flow
  - Test login with different roles
  - Test password reset
  - Test user deactivation
  - Test RLS with different users
  - Test all CRUD operations
  - Verify performance is acceptable
  - Ensure all tests pass
  - Ask user for final approval

## Notes

- Tasks marked with `*` are optional property-based tests
- Migration is designed to be safe with rollback capability
- Old columns (email, role) kept temporarily during transition
- Each checkpoint ensures system stability before proceeding
- All changes maintain backward compatibility during transition
- Property tests validate universal correctness across all inputs
- Unit tests validate specific examples and edge cases
