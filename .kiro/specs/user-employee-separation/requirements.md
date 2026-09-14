# Requirements Document: User-Employee Separation

## Introduction

Sistem saat ini menggunakan tabel `m_employees` untuk menyimpan data karyawan sekaligus data autentikasi user aplikasi. Ini tidak ideal karena mencampur dua concern yang berbeda. Requirement ini akan memisahkan:
- **Employee Data**: Informasi kepegawaian (NIP, nama, unit, status pajak)
- **User Authentication**: Data autentikasi aplikasi menggunakan Supabase Auth

## Glossary

- **Employee**: Karyawan dalam organisasi dengan data kepegawaian
- **User**: Pengguna aplikasi dengan kredensial autentikasi
- **Supabase_Auth**: Sistem autentikasi bawaan Supabase (tabel auth.users)
- **System**: Aplikasi JASPEL KPI
- **RLS**: Row Level Security untuk isolasi data

## Requirements

### Requirement 1: Separate User and Employee Tables

**User Story:** As a system architect, I want to separate user authentication from employee data, so that the system has clear separation of concerns and follows best practices.

#### Acceptance Criteria

1. THE System SHALL use Supabase auth.users table for user authentication
2. THE System SHALL maintain m_employees table for employee master data only
3. WHEN a user is created in auth.users, THE System SHALL link it to an employee record via user_id foreign key
4. THE System SHALL remove authentication fields (email, role) from m_employees table
5. THE System SHALL add user_id field to m_employees table referencing auth.users

### Requirement 2: Migrate Existing Data

**User Story:** As a database administrator, I want to migrate existing employee data to the new structure, so that no data is lost during the transition.

#### Acceptance Criteria

1. WHEN migration runs, THE System SHALL create auth.users records for all existing m_employees
2. WHEN migration runs, THE System SHALL preserve all existing employee data
3. WHEN migration runs, THE System SHALL maintain all existing relationships (unit_id, etc)
4. WHEN migration runs, THE System SHALL set temporary passwords for all migrated users
5. THE System SHALL log all migration activities for audit purposes

### Requirement 3: Update Authentication Logic

**User Story:** As a developer, I want authentication to use Supabase Auth properly, so that the system follows security best practices.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL authenticate against auth.users table
2. WHEN retrieving user profile, THE System SHALL join auth.users with m_employees
3. THE System SHALL use auth.users.id as the primary user identifier
4. THE System SHALL store role information in auth.users.raw_user_meta_data
5. THE System SHALL maintain backward compatibility during transition period

### Requirement 4: Update RLS Policies

**User Story:** As a security engineer, I want RLS policies to work with the new structure, so that data isolation is maintained.

#### Acceptance Criteria

1. WHEN RLS policies check user identity, THE System SHALL use auth.uid() instead of email lookup
2. THE System SHALL update get_current_employee() function to use auth.uid()
3. THE System SHALL update is_superadmin() function to check user metadata
4. THE System SHALL update get_user_unit_id() function to use new structure
5. THE System SHALL maintain all existing security constraints

### Requirement 5: Update Application Code

**User Story:** As a developer, I want application code to work with the new structure, so that all features continue to function correctly.

#### Acceptance Criteria

1. WHEN user service queries users, THE System SHALL join auth.users with m_employees
2. WHEN creating new users, THE System SHALL create both auth.users and m_employees records
3. WHEN updating users, THE System SHALL update appropriate tables based on field type
4. WHEN deleting users, THE System SHALL handle cascade deletion properly
5. THE System SHALL update all TypeScript types to reflect new structure

### Requirement 6: Maintain Data Integrity

**User Story:** As a database administrator, I want referential integrity maintained, so that orphaned records cannot exist.

#### Acceptance Criteria

1. THE System SHALL enforce foreign key constraint from m_employees.user_id to auth.users.id
2. WHEN a user is deleted from auth.users, THE System SHALL handle employee record appropriately
3. THE System SHALL prevent deletion of auth.users if employee has transaction data
4. THE System SHALL validate that every employee has a corresponding user
5. THE System SHALL validate that user metadata matches employee role

### Requirement 7: Support User Management

**User Story:** As a superadmin, I want to manage users through the application, so that I can control access without database access.

#### Acceptance Criteria

1. WHEN creating a user, THE System SHALL create both auth.users and m_employees records in a transaction
2. WHEN updating user email, THE System SHALL update auth.users.email
3. WHEN updating employee data, THE System SHALL update m_employees fields
4. WHEN deactivating a user, THE System SHALL set is_active flag and optionally disable auth
5. THE System SHALL provide clear error messages for user management operations

### Requirement 8: Preserve Audit Trail

**User Story:** As a compliance officer, I want audit logs to continue working, so that we maintain compliance requirements.

#### Acceptance Criteria

1. THE System SHALL update t_audit_log to reference auth.users.id
2. THE System SHALL update t_auth_log to reference auth.users.id
3. WHEN logging activities, THE System SHALL include both user_id and employee information
4. THE System SHALL maintain historical audit data during migration
5. THE System SHALL update audit queries to work with new structure
