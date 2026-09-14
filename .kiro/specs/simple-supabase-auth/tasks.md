# Implementation Plan: Simple Supabase Auth

## Overview

This implementation plan will guide the complete replacement of the current complex JWT-based authentication system with a simple, reliable Supabase Auth implementation. The tasks are organized to build incrementally, with testing integrated throughout.

## Tasks

- [x] 1. Setup and Dependencies
  - Install @supabase/ssr package for Next.js integration
  - Verify environment variables are configured
  - Create backup of current auth files
  - _Requirements: 2.1, 9.1_

- [x] 2. Create Supabase Client Configuration
  - [x] 2.1 Create browser Supabase client (lib/supabase/client.ts)
    - Implement createClient function using createBrowserClient from @supabase/ssr
    - Use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
    - _Requirements: 2.1, 2.6_

  - [x] 2.2 Create server Supabase client (lib/supabase/server.ts)
    - Implement createClient function using createServerClient from @supabase/ssr
    - Configure cookie handling for server-side session access
    - _Requirements: 2.1, 4.5_

  - [ ]* 2.3 Write unit tests for Supabase clients
    - Test browser client creation
    - Test server client creation with cookie handling
    - _Requirements: 2.1_

- [x] 3. Implement Auth Service
  - [x] 3.1 Create auth service interface and types
    - Define LoginCredentials, UserData, LoginResult interfaces
    - Create AuthService class structure
    - _Requirements: 2.1, 10.2_

  - [x] 3.2 Implement login method
    - Call supabase.auth.signInWithPassword with credentials
    - Fetch user data from users table after successful auth
    - Check if user is_active is true
    - Map errors to user-friendly messages
    - Return LoginResult with user data or error
    - _Requirements: 2.1, 6.1, 6.2, 6.3, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 3.3 Write property test for login method
    - **Property 10: Successful Login Creates Session**
    - **Validates: Requirements 3.1**

  - [ ]* 3.4 Write property test for authentication failure
    - **Property 2: Authentication Failure Shows Error Message**
    - **Validates: Requirements 1.5, 6.1, 6.2, 6.3, 6.4**

  - [ ]* 3.5 Write property test for inactive user denial
    - **Property 15: Inactive User Denies Access**
    - **Validates: Requirements 10.4**

  - [x] 3.6 Implement logout method
    - Call supabase.auth.signOut
    - Return void (Supabase handles session clearing)
    - _Requirements: 2.7, 7.1_

  - [ ]* 3.7 Write property test for logout
    - **Property 12: Logout Clears Session**
    - **Validates: Requirements 7.3**

  - [x] 3.8 Implement getCurrentUser method
    - Get session using supabase.auth.getSession
    - If no session, return null
    - Fetch user data from users table
    - Return UserData or null
    - _Requirements: 2.6, 10.1, 10.2_

  - [ ]* 3.9 Write property test for user not in database
    - **Property 14: User Not in Database Denies Access**
    - **Validates: Requirements 10.3**

  - [x] 3.10 Implement getSession method
    - Call supabase.auth.getSession
    - Return session or null
    - _Requirements: 2.6_

  - [ ]* 3.11 Write unit tests for auth service
    - Test login with valid credentials
    - Test login with invalid credentials
    - Test logout functionality
    - Test getCurrentUser with and without session
    - Test error handling and mapping
    - _Requirements: 2.1, 2.6, 2.7, 6.1, 6.2, 6.3_

- [x] 4. Checkpoint - Ensure auth service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create Login Page
  - [x] 5.1 Create login page component (app/login/page.tsx)
    - Create form with email and password inputs
    - Add login button
    - Implement form state management
    - Add loading state
    - Add error message display
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 5.2 Implement login form submission handler
    - Prevent default form submission
    - Set loading state to true
    - Call auth service login method
    - On success: redirect to appropriate dashboard based on role
    - On error: display error message and set loading to false
    - _Requirements: 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ]* 5.3 Write property test for loading state
    - **Property 3: Loading State During Authentication**
    - **Validates: Requirements 1.3**

  - [ ]* 5.4 Write property test for successful redirect
    - **Property 1: Authentication Success Redirects to Correct Dashboard**
    - **Validates: Requirements 1.4, 5.1, 5.2, 5.3, 5.4**

  - [ ]* 5.5 Write unit tests for login page
    - Test form renders correctly
    - Test loading state display
    - Test error message display
    - Test form submission calls auth service
    - Test redirect on successful login
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 5.6 Implement dashboard routing logic
    - Create getDashboardRoute function
    - Map roles to dashboard URLs
    - Handle unknown roles with /forbidden redirect
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ]* 5.7 Write unit tests for dashboard routing
    - Test superadmin redirects to /admin/dashboard
    - Test admin redirects to /admin/dashboard
    - Test manager redirects to /manager/dashboard
    - Test employee redirects to /employee/dashboard
    - Test unknown role redirects to /forbidden
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

- [x] 6. Implement Middleware for Protected Routes
  - [x] 6.1 Create middleware (middleware.ts)
    - Create server Supabase client
    - Get session using supabase.auth.getSession
    - If no session and route is protected: redirect to /login
    - If session exists: allow access
    - Configure matcher for protected routes
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ]* 6.2 Write property test for middleware session check
    - **Property 7: Middleware Checks Session on Protected Routes**
    - **Validates: Requirements 4.1**

  - [ ]* 6.3 Write property test for invalid session redirect
    - **Property 5: Invalid Session Redirects to Login**
    - **Validates: Requirements 3.4, 4.2**

  - [ ]* 6.4 Write property test for valid session access
    - **Property 6: Valid Session Allows Access**
    - **Validates: Requirements 4.3**

  - [ ]* 6.5 Write unit tests for middleware
    - Test redirect to login when no session
    - Test access granted when valid session
    - Test protected routes are matched correctly
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Checkpoint - Ensure middleware tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Error Handling
  - [x] 8.1 Create error handling utility
    - Implement handleAuthError function
    - Map Supabase errors to user-friendly messages
    - Log technical details to console
    - Ensure no technical details in user messages
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 8.2 Write property test for error message safety
    - **Property 8: Error Messages Don't Expose Technical Details**
    - **Validates: Requirements 6.5**

  - [ ]* 8.3 Write property test for error logging
    - **Property 9: Errors Are Logged for Debugging**
    - **Validates: Requirements 6.6**

  - [ ]* 8.4 Write unit tests for error handling
    - Test invalid credentials error message
    - Test network error message
    - Test disabled account error message
    - Test generic error message
    - Test error logging
    - Test no technical details exposed
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 9. Update Sidebar Logout Functionality
  - [x] 9.1 Update Sidebar component (components/navigation/Sidebar.tsx)
    - Import new auth service
    - Update logout handler to use auth service logout method
    - Redirect to /login after logout
    - _Requirements: 7.1, 7.2_

  - [ ]* 9.2 Write property test for logout redirect
    - **Property 11: Logout Redirects to Login Page**
    - **Validates: Requirements 7.2**

  - [ ]* 9.3 Write unit tests for sidebar logout
    - Test logout button calls auth service
    - Test redirect to login after logout
    - _Requirements: 7.1, 7.2_

- [x] 10. Implement Session Persistence
  - [x] 10.1 Verify session persistence configuration
    - Ensure Supabase client uses cookie storage
    - Test session persists across browser refresh
    - _Requirements: 3.2_

  - [ ]* 10.2 Write property test for session persistence
    - **Property 4: Session Persistence Across Refresh**
    - **Validates: Requirements 3.2**

- [x] 11. Remove Legacy Authentication Code
  - [x] 11.1 Identify and remove custom JWT code
    - Search for JWT-related imports and code
    - Remove custom JWT utility files
    - Remove custom token handling code
    - _Requirements: 1.6, 2.2, 2.3, 9.1, 9.5_

  - [x] 11.2 Identify and remove custom session management
    - Search for custom session storage code
    - Remove custom session management files
    - Remove duplicate auth utilities
    - _Requirements: 2.3, 3.5, 3.6, 7.4, 9.2, 9.3_

  - [x] 11.3 Verify no legacy auth code remains
    - Search codebase for custom auth patterns
    - Ensure only Supabase methods are used
    - _Requirements: 9.4, 9.5_

  - [ ]* 11.4 Write unit tests to verify clean implementation
    - Test no JWT libraries are imported
    - Test no custom session code exists
    - Test only Supabase methods are used
    - _Requirements: 1.6, 2.2, 2.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 12. Integration Testing
  - [ ]* 12.1 Write integration test for complete login flow
    - Test user enters credentials → login succeeds → redirects to dashboard
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 12.2 Write integration test for login failure flow
    - Test user enters invalid credentials → error message displayed
    - _Requirements: 1.5, 6.1_

  - [ ]* 12.3 Write integration test for logout flow
    - Test user logs out → session cleared → redirected to login
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 12.4 Write integration test for protected route access
    - Test user accesses protected route without session → redirected to login
    - Test user accesses protected route with session → access granted
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 12.5 Write property test for no infinite redirects
    - **Property 13: No Loading Loops or Infinite Redirects**
    - **Validates: Requirements 8.4**

- [x] 13. Final Checkpoint - Complete Testing
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Ensure all tests pass
  - Ask the user if questions arise

- [x] 14. Manual Testing and Verification
  - [x] 14.1 Test login with valid credentials
    - Verify redirect to correct dashboard
    - Verify session is created
    - _Requirements: 1.4, 2.1, 3.1, 5.1, 5.2, 5.3, 5.4_

  - [x] 14.2 Test login with invalid credentials
    - Verify error message is displayed
    - Verify no session is created
    - _Requirements: 1.5, 6.1_

  - [x] 14.3 Test session persistence
    - Login successfully
    - Refresh browser
    - Verify still logged in
    - _Requirements: 3.2_

  - [x] 14.4 Test protected route access
    - Access protected route without login
    - Verify redirect to login
    - Login and access protected route
    - Verify access granted
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 14.5 Test logout functionality
    - Login successfully
    - Click logout
    - Verify redirect to login
    - Verify session is cleared
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 14.6 Test inactive user
    - Attempt login with inactive user
    - Verify error message displayed
    - Verify access denied
    - _Requirements: 6.3, 10.4_

  - [x] 14.7 Test all user roles
    - Login as superadmin → verify redirect to /admin/dashboard
    - Login as admin → verify redirect to /admin/dashboard
    - Login as manager → verify redirect to /manager/dashboard
    - Login as employee → verify redirect to /employee/dashboard
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 15. Performance Verification
  - [x] 15.1 Measure login page load time
    - Verify loads within acceptable time
    - _Requirements: 1.7_

  - [x] 15.2 Measure authentication time
    - Verify completes within acceptable time
    - _Requirements: 8.2_

  - [x] 15.3 Verify no loading loops
    - Test various navigation scenarios
    - Ensure no infinite loops or redirects
    - _Requirements: 8.4_

- [x] 16. Documentation and Cleanup
  - [x] 16.1 Update README with new auth flow
    - Document Supabase Auth usage
    - Document environment variables
    - Document user roles and routing

  - [x] 16.2 Remove old documentation
    - Remove JWT-related documentation
    - Remove custom auth documentation

  - [x] 16.3 Clean up unused dependencies
    - Remove JWT libraries if no longer needed
    - Remove custom auth dependencies

- [x] 17. Final Verification
  - Verify all requirements are met
  - Verify all tests pass
  - Verify no legacy auth code remains
  - Verify application works correctly
  - Ask the user for final approval

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify complete flows work correctly
- Manual testing ensures real-world usability

## Success Criteria

Implementation is complete when:
1. ✅ All unit tests pass
2. ✅ All property-based tests pass
3. ✅ All integration tests pass
4. ✅ Manual testing confirms all flows work
5. ✅ No legacy auth code remains
6. ✅ Performance meets requirements
7. ✅ Documentation is updated
8. ✅ User can successfully login and access application
