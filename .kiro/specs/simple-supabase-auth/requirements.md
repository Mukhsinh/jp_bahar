# Requirements Document

## Introduction

Sistem autentikasi saat ini mengalami berbagai masalah termasuk login loop, error 500, dan kompleksitas yang tidak perlu dengan implementasi JWT custom. Fitur ini akan merombak total sistem login dengan menggunakan Supabase Auth native yang sederhana, cepat, dan reliable.

## Glossary

- **Supabase_Auth**: Sistem autentikasi bawaan Supabase yang menangani session management, token refresh, dan user authentication
- **Login_Page**: Halaman antarmuka untuk user memasukkan kredensial
- **Auth_Service**: Service layer yang menangani operasi autentikasi
- **Session**: State autentikasi user yang dikelola oleh Supabase
- **Middleware**: Layer yang memvalidasi autentikasi sebelum mengakses protected routes
- **Dashboard**: Halaman utama setelah user berhasil login berdasarkan role mereka

## Requirements

### Requirement 1: Simple Login Interface

**User Story:** As a user, I want a clean and simple login page, so that I can quickly authenticate without confusion.

#### Acceptance Criteria

1. THE Login_Page SHALL display email and password input fields
2. THE Login_Page SHALL display a login button that triggers authentication
3. WHEN the login button is clicked, THE Login_Page SHALL show loading state
4. WHEN authentication succeeds, THE Login_Page SHALL redirect to the appropriate dashboard
5. WHEN authentication fails, THE Login_Page SHALL display a clear error message
6. THE Login_Page SHALL NOT use any JWT custom implementation
7. THE Login_Page SHALL be responsive and load within 1 second

### Requirement 2: Supabase Native Authentication

**User Story:** As a developer, I want to use Supabase Auth native features, so that authentication is reliable and maintainable.

#### Acceptance Criteria

1. THE Auth_Service SHALL use Supabase signInWithPassword method for authentication
2. THE Auth_Service SHALL NOT implement custom JWT token handling
3. THE Auth_Service SHALL NOT implement custom session management
4. WHEN a user logs in, THE Supabase_Auth SHALL automatically manage session tokens
5. WHEN a session expires, THE Supabase_Auth SHALL automatically refresh tokens
6. THE Auth_Service SHALL use Supabase getSession method to check authentication status
7. THE Auth_Service SHALL use Supabase signOut method for logout

### Requirement 3: Session Management

**User Story:** As a user, I want my session to be maintained automatically, so that I don't have to re-login frequently.

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE Supabase_Auth SHALL create and store a session
2. THE Session SHALL persist across browser refreshes
3. THE Session SHALL automatically refresh before expiration
4. WHEN a session is invalid, THE System SHALL redirect to the login page
5. THE System SHALL NOT implement custom session storage logic
6. THE System SHALL rely entirely on Supabase session management

### Requirement 4: Protected Route Middleware

**User Story:** As a developer, I want middleware that validates authentication, so that protected routes are secure.

#### Acceptance Criteria

1. THE Middleware SHALL check for valid Supabase session on protected routes
2. WHEN no valid session exists, THE Middleware SHALL redirect to login page
3. WHEN a valid session exists, THE Middleware SHALL allow access to the requested route
4. THE Middleware SHALL NOT implement custom JWT validation
5. THE Middleware SHALL use Supabase getSession method for validation
6. THE Middleware SHALL execute within 100ms to maintain performance

### Requirement 5: Role-Based Dashboard Routing

**User Story:** As a user, I want to be redirected to the correct dashboard based on my role, so that I see relevant content immediately.

#### Acceptance Criteria

1. WHEN a user with role 'superadmin' logs in, THE System SHALL redirect to /admin/dashboard
2. WHEN a user with role 'admin' logs in, THE System SHALL redirect to /admin/dashboard
3. WHEN a user with role 'manager' logs in, THE System SHALL redirect to /manager/dashboard
4. WHEN a user with role 'employee' logs in, THE System SHALL redirect to /employee/dashboard
5. THE System SHALL fetch user role from the users table in Supabase
6. WHEN role cannot be determined, THE System SHALL redirect to /forbidden

### Requirement 6: Error Handling

**User Story:** As a user, I want clear error messages when login fails, so that I know what went wrong.

#### Acceptance Criteria

1. WHEN credentials are invalid, THE System SHALL display "Email atau password salah"
2. WHEN network error occurs, THE System SHALL display "Koneksi gagal, silakan coba lagi"
3. WHEN user account is disabled, THE System SHALL display "Akun Anda tidak aktif"
4. WHEN an unknown error occurs, THE System SHALL display a generic error message
5. THE System SHALL NOT expose technical error details to users
6. THE System SHALL log detailed errors to console for debugging

### Requirement 7: Logout Functionality

**User Story:** As a user, I want to logout securely, so that my session is properly terminated.

#### Acceptance Criteria

1. WHEN a user clicks logout, THE System SHALL call Supabase signOut method
2. WHEN logout succeeds, THE System SHALL redirect to the login page
3. WHEN logout succeeds, THE System SHALL clear all session data
4. THE System SHALL NOT implement custom session clearing logic
5. THE Logout SHALL complete within 500ms

### Requirement 8: Performance Requirements

**User Story:** As a user, I want the login process to be fast, so that I can access the application quickly.

#### Acceptance Criteria

1. THE Login_Page SHALL load within 1 second
2. THE Authentication process SHALL complete within 2 seconds on successful login
3. THE Dashboard redirect SHALL occur within 500ms after authentication
4. THE System SHALL NOT have any loading loops or infinite redirects
5. THE Middleware SHALL add no more than 100ms overhead to route access

### Requirement 9: Clean Implementation

**User Story:** As a developer, I want a clean codebase without legacy authentication code, so that the system is maintainable.

#### Acceptance Criteria

1. THE System SHALL remove all custom JWT implementation code
2. THE System SHALL remove all custom session management code
3. THE System SHALL remove all authentication-related utility functions that duplicate Supabase functionality
4. THE System SHALL use only Supabase Auth methods for all authentication operations
5. THE Codebase SHALL have no references to custom token handling

### Requirement 10: Database Integration

**User Story:** As a system, I want to fetch user data from the database after authentication, so that role-based routing works correctly.

#### Acceptance Criteria

1. WHEN a user authenticates, THE System SHALL query the users table for user details
2. THE System SHALL fetch user role, unit_id, and active status
3. WHEN user is not found in users table, THE System SHALL deny access
4. WHEN user is inactive, THE System SHALL deny access and show error message
5. THE Database query SHALL complete within 500ms
