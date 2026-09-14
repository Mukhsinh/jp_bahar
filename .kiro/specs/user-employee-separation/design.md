# Design Document: User-Employee Separation

## Overview

This design separates user authentication concerns from employee master data by leveraging Supabase Auth's built-in `auth.users` table for authentication while maintaining `m_employees` for employee information. This follows the single responsibility principle and aligns with Supabase best practices.

## Architecture

### Current Structure (Problem)
```
m_employees
├── id (UUID)
├── employee_code
├── full_name
├── unit_id
├── role ❌ (authentication concern)
├── email ❌ (authentication concern)
├── tax_status
└── is_active
```

### New Structure (Solution)
```
auth.users (Supabase managed)
├── id (UUID)
├── email
├── encrypted_password
├── raw_user_meta_data
│   ├── role
│   ├── full_name
│   └── employee_id
└── ...

m_employees (Employee data only)
├── id (UUID)
├── user_id (FK to auth.users) ✅
├── employee_code
├── full_name
├── unit_id
├── tax_status
└── is_active
```

## Components and Interfaces

### 1. Database Schema Changes

#### Modified m_employees Table
```sql
-- Remove authentication fields
ALTER TABLE m_employees DROP COLUMN IF EXISTS email;
ALTER TABLE m_employees DROP COLUMN IF EXISTS role;

-- Add user_id reference
ALTER TABLE m_employees ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX idx_employees_user_id ON m_employees(user_id);
```

#### Helper Functions Update
```sql
-- Updated to use auth.uid() instead of email lookup
CREATE OR REPLACE FUNCTION get_current_employee()
RETURNS UUID AS $$
  SELECT id FROM m_employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin',
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_unit_id()
RETURNS UUID AS $$
  SELECT unit_id FROM m_employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_unit_manager()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'unit_manager',
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

### 2. Data Migration Strategy

#### Migration Script Structure
```typescript
interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: Array<{employeeId: string; error: string}>;
}

async function migrateEmployeesToAuth(): Promise<MigrationResult> {
  // 1. Fetch all employees from m_employees
  // 2. For each employee:
  //    a. Create auth.users record with email + temp password
  //    b. Set user_metadata with role, full_name, employee_id
  //    c. Update m_employees.user_id with new auth.users.id
  //    d. Log migration in audit table
  // 3. Return migration results
}
```

#### Temporary Password Generation
```typescript
function generateTempPassword(): string {
  // Format: JASPEL-YYYYMMDD-XXXX
  // Example: JASPEL-20260307-A1B2
  const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JASPEL-${date}-${random}`;
}
```

### 3. Service Layer Updates

#### UserService Interface
```typescript
interface UserWithEmployee {
  // From auth.users
  id: string;
  email: string;
  role: 'superadmin' | 'unit_manager' | 'employee';
  
  // From m_employees
  employeeId: string;
  employeeCode: string;
  fullName: string;
  unitId: string;
  taxStatus: string;
  isActive: boolean;
}

interface CreateUserInput {
  email: string;
  password: string;
  role: string;
  employeeCode: string;
  fullName: string;
  unitId: string;
  taxStatus: string;
}

class UserService {
  async createUser(input: CreateUserInput): Promise<UserWithEmployee>
  async getUserById(userId: string): Promise<UserWithEmployee | null>
  async getUserByEmail(email: string): Promise<UserWithEmployee | null>
  async updateUser(userId: string, updates: Partial<CreateUserInput>): Promise<void>
  async deactivateUser(userId: string): Promise<void>
  async listUsers(filters?: UserFilters): Promise<UserWithEmployee[]>
}
```

#### AuthService Updates
```typescript
class AuthService {
  async signIn(email: string, password: string): Promise<Session>
  async signOut(): Promise<void>
  async getCurrentUser(): Promise<UserWithEmployee | null>
  async resetPassword(userId: string, newPassword: string): Promise<void>
  async changePassword(oldPassword: string, newPassword: string): Promise<void>
}
```

## Data Models

### User Metadata Structure
```typescript
interface UserMetadata {
  role: 'superadmin' | 'unit_manager' | 'employee';
  full_name: string;
  employee_id: string;
  unit_id: string;
}
```

### Database Type Updates
```typescript
// Update database.types.ts
export interface Database {
  public: {
    Tables: {
      m_employees: {
        Row: {
          id: string;
          user_id: string; // NEW
          employee_code: string;
          full_name: string;
          unit_id: string;
          tax_status: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          // REMOVED: email, role
        };
        Insert: Omit<Row, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Insert>;
      };
      // ... other tables
    };
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: User-Employee Bijection
*For any* active employee record, there SHALL exist exactly one corresponding auth.users record, and vice versa.
**Validates: Requirements 1.3, 6.4**

### Property 2: Role Consistency
*For any* user, the role stored in auth.users.raw_user_meta_data SHALL match the role implied by their permissions and access patterns.
**Validates: Requirements 3.4, 6.5**

### Property 3: Authentication Isolation
*For any* authentication operation, the system SHALL use only auth.users table and SHALL NOT query m_employees for credential verification.
**Validates: Requirements 1.1, 3.1**

### Property 4: Data Migration Idempotency
*For any* employee record, running the migration multiple times SHALL produce the same result as running it once (no duplicate auth.users created).
**Validates: Requirements 2.1, 2.2**

### Property 5: RLS Policy Correctness
*For any* authenticated user, RLS policies using auth.uid() SHALL return the same data as the old email-based policies would have returned.
**Validates: Requirements 4.1, 4.5**

### Property 6: Referential Integrity
*For any* m_employees record with user_id, the referenced auth.users record SHALL exist, and deleting auth.users SHALL cascade appropriately.
**Validates: Requirements 6.1, 6.2**

### Property 7: Transaction Atomicity
*For any* user creation operation, either both auth.users and m_employees records SHALL be created, or neither SHALL be created (no partial state).
**Validates: Requirements 7.1, 5.2**

### Property 8: Audit Trail Preservation
*For any* historical audit record, the migration SHALL preserve the ability to identify which user performed which action.
**Validates: Requirements 8.4, 8.5**

## Error Handling

### Migration Errors
- **Duplicate Email**: Skip and log if auth.users already exists with that email
- **Invalid Data**: Log validation errors and continue with next record
- **Auth API Failure**: Retry with exponential backoff, max 3 attempts
- **Transaction Failure**: Rollback and log, continue with next employee

### Runtime Errors
- **Missing User**: Return 401 Unauthorized if auth.users not found
- **Missing Employee**: Return 403 Forbidden if employee record not linked
- **Role Mismatch**: Log security warning and deny access
- **Orphaned Records**: Background job to detect and alert

### User Management Errors
- **Email Already Exists**: Return clear error message
- **Invalid Role**: Validate against allowed roles before creation
- **Unit Not Found**: Validate unit_id exists before user creation
- **Cascade Constraint**: Prevent deletion if employee has transactions

## Testing Strategy

### Unit Tests
- Test helper functions (get_current_employee, is_superadmin, etc.)
- Test user service CRUD operations
- Test migration script with sample data
- Test error handling for each error scenario
- Test password generation uniqueness

### Property-Based Tests
- Property 1: Generate random employees, verify 1:1 mapping with users
- Property 2: Generate random users, verify role consistency
- Property 3: Generate random auth attempts, verify no m_employees queries
- Property 4: Run migration multiple times, verify idempotency
- Property 5: Generate random users, compare RLS results old vs new
- Property 6: Generate random deletions, verify referential integrity
- Property 7: Simulate failures during user creation, verify atomicity
- Property 8: Generate random audit records, verify preservation

### Integration Tests
- Test complete user creation flow (auth + employee)
- Test login flow with new structure
- Test RLS policies with real Supabase instance
- Test migration with production-like data volume
- Test all dashboard pages with new auth structure

### Migration Testing
- Test with empty database
- Test with existing users
- Test with duplicate emails
- Test with invalid data
- Test rollback scenarios

## Implementation Notes

### Migration Sequence
1. Create migration SQL file
2. Add user_id column to m_employees (nullable initially)
3. Run data migration script
4. Make user_id NOT NULL after migration
5. Drop email and role columns
6. Update RLS policies
7. Update application code
8. Deploy and test

### Backward Compatibility
- Keep old helper functions during transition
- Add feature flag for gradual rollout
- Monitor both old and new auth paths
- Maintain dual logging during transition

### Performance Considerations
- Index on m_employees.user_id for fast lookups
- Cache user metadata in JWT to avoid joins
- Batch migration in chunks of 100 records
- Use connection pooling for migration script

### Security Considerations
- Use service role key only in migration script
- Store temporary passwords securely
- Force password change on first login
- Audit all user management operations
- Validate role changes require superadmin
