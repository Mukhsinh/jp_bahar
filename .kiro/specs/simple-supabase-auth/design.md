# Design Document: Simple Supabase Auth

## Overview

This design implements a clean, simple authentication system using Supabase Auth native features. The design eliminates all custom JWT handling, custom session management, and complex authentication logic that has caused login loops and errors. Instead, it relies entirely on Supabase's built-in authentication mechanisms which are battle-tested and reliable.

The system will have three main layers:
1. **UI Layer**: Simple login page with form handling
2. **Service Layer**: Thin wrapper around Supabase Auth methods
3. **Middleware Layer**: Session validation for protected routes

## Architecture

### High-Level Flow

```
User enters credentials
    ↓
Login Page calls Auth Service
    ↓
Auth Service calls Supabase signInWithPassword
    ↓
Supabase creates session (automatic)
    ↓
Fetch user data from database
    ↓
Redirect to role-based dashboard
    ↓
Middleware validates session on each request
```

### Component Diagram

```
┌─────────────────┐
│   Login Page    │
│  (app/login)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Auth Service   │
│ (lib/services)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Supabase Client │
│ (lib/supabase)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Supabase Auth  │
│   (External)    │
└─────────────────┘

┌─────────────────┐
│   Middleware    │
│ (middleware.ts) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Protected Route │
└─────────────────┘
```

## Components and Interfaces

### 1. Supabase Client Configuration

**File**: `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Purpose**: Create a Supabase client for browser-side operations. This uses the official Supabase SSR package which handles session management automatically.

**Key Points**:
- Uses `@supabase/ssr` for proper Next.js integration
- No custom configuration needed
- Session management is automatic

### 2. Server-Side Supabase Client

**File**: `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

**Purpose**: Create a Supabase client for server-side operations (middleware, API routes). This properly reads session cookies.

### 3. Auth Service

**File**: `lib/services/auth.service.ts`

```typescript
interface LoginCredentials {
  email: string
  password: string
}

interface UserData {
  id: string
  email: string
  role: string
  unit_id: string | null
  is_active: boolean
}

interface LoginResult {
  success: boolean
  user?: UserData
  error?: string
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResult>
  async logout(): Promise<void>
  async getCurrentUser(): Promise<UserData | null>
  async getSession(): Promise<Session | null>
}
```

**Methods**:

- `login(credentials)`: 
  - Calls `supabase.auth.signInWithPassword()`
  - Fetches user data from database
  - Returns user data or error
  
- `logout()`:
  - Calls `supabase.auth.signOut()`
  - No custom cleanup needed
  
- `getCurrentUser()`:
  - Gets session from Supabase
  - Fetches user data from database
  - Returns user data or null
  
- `getSession()`:
  - Calls `supabase.auth.getSession()`
  - Returns session or null

**Key Principles**:
- Thin wrapper around Supabase methods
- No custom token handling
- No custom session storage
- All session management delegated to Supabase

### 4. Login Page

**File**: `app/login/page.tsx`

**Structure**:
```typescript
interface LoginFormData {
  email: string
  password: string
}

interface LoginPageState {
  isLoading: boolean
  error: string | null
}

function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>()
  const [state, setState] = useState<LoginPageState>()
  
  const handleSubmit = async (e: FormEvent) => {
    // 1. Prevent default
    // 2. Set loading state
    // 3. Call auth service login
    // 4. Handle success: redirect to dashboard
    // 5. Handle error: show error message
  }
  
  return (
    // Simple form with email, password, submit button
  )
}
```

**Key Features**:
- Simple controlled form
- Loading state during authentication
- Clear error messages
- Automatic redirect on success
- No complex state management

### 5. Middleware

**File**: `middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  // 1. Create server Supabase client
  // 2. Get session
  // 3. If no session and route is protected: redirect to /login
  // 4. If session exists: allow access
  // 5. Return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/manager/:path*',
    '/employee/:path*',
    '/profile/:path*',
  ]
}
```

**Logic**:
- Check session using `supabase.auth.getSession()`
- Redirect to login if no session
- Allow access if session exists
- No custom validation logic

### 6. Dashboard Routing Logic

**Location**: After successful login in Auth Service

```typescript
function getDashboardRoute(role: string): string {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin/dashboard'
    case 'manager':
      return '/manager/dashboard'
    case 'employee':
      return '/employee/dashboard'
    default:
      return '/forbidden'
  }
}
```

## Data Models

### User Data (from database)

```typescript
interface UserData {
  id: string              // UUID from auth.users
  email: string           // User email
  role: string            // 'superadmin' | 'admin' | 'manager' | 'employee'
  unit_id: string | null  // Reference to unit
  is_active: boolean      // Account status
  full_name: string       // User's full name
}
```

### Session (from Supabase)

```typescript
interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    id: string
    email: string
    // ... other Supabase user fields
  }
}
```

**Note**: We don't manage this directly. Supabase handles it automatically.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Authentication Success Redirects to Correct Dashboard

*For any* successful authentication with a valid user role, the system should redirect to the dashboard route that corresponds to that role.

**Validates: Requirements 1.4, 5.1, 5.2, 5.3, 5.4**

### Property 2: Authentication Failure Shows Error Message

*For any* authentication failure (invalid credentials, network error, disabled account), the system should display an appropriate error message to the user.

**Validates: Requirements 1.5, 6.1, 6.2, 6.3, 6.4**

### Property 3: Loading State During Authentication

*For any* login attempt, the system should set loading state to true when authentication starts and false when it completes (success or failure).

**Validates: Requirements 1.3**

### Property 4: Session Persistence Across Refresh

*For any* valid authenticated session, refreshing the browser should maintain the session without requiring re-authentication.

**Validates: Requirements 3.2**

### Property 5: Invalid Session Redirects to Login

*For any* request to a protected route without a valid session, the system should redirect to the login page.

**Validates: Requirements 3.4, 4.2**

### Property 6: Valid Session Allows Access

*For any* request to a protected route with a valid session, the middleware should allow access to the requested route.

**Validates: Requirements 4.3**

### Property 7: Middleware Checks Session on Protected Routes

*For any* request to a protected route, the middleware should check for a valid Supabase session before allowing access.

**Validates: Requirements 4.1**

### Property 8: Error Messages Don't Expose Technical Details

*For any* error that occurs during authentication, the error message displayed to users should not contain technical details like stack traces or internal error codes.

**Validates: Requirements 6.5**

### Property 9: Errors Are Logged for Debugging

*For any* error that occurs during authentication, detailed error information should be logged to the console for debugging purposes.

**Validates: Requirements 6.6**

### Property 10: Successful Login Creates Session

*For any* successful login with valid credentials, Supabase should create and return a valid session object.

**Validates: Requirements 3.1**

### Property 11: Logout Redirects to Login Page

*For any* successful logout operation, the system should redirect the user to the login page.

**Validates: Requirements 7.2**

### Property 12: Logout Clears Session

*For any* successful logout operation, the system should have no valid session remaining.

**Validates: Requirements 7.3**

### Property 13: No Loading Loops or Infinite Redirects

*For any* navigation flow in the authentication system, the system should not enter an infinite loop or infinite redirect cycle.

**Validates: Requirements 8.4**

### Property 14: User Not in Database Denies Access

*For any* authenticated user whose ID is not found in the users table, the system should deny access to the application.

**Validates: Requirements 10.3**

### Property 15: Inactive User Denies Access

*For any* user with is_active set to false in the database, the system should deny access and display an error message.

**Validates: Requirements 10.4**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid credentials: "Email atau password salah"
   - Account disabled: "Akun Anda tidak aktif"
   - User not found in database: "Akun tidak ditemukan"

2. **Network Errors**
   - Connection failed: "Koneksi gagal, silakan coba lagi"
   - Timeout: "Koneksi timeout, silakan coba lagi"

3. **Session Errors**
   - Session expired: Redirect to login (silent)
   - Invalid session: Redirect to login (silent)

4. **Unknown Errors**
   - Generic message: "Terjadi kesalahan, silakan coba lagi"
   - Log full error to console

### Error Handling Flow

```
Error occurs
    ↓
Identify error type
    ↓
Map to user-friendly message
    ↓
Display message to user
    ↓
Log technical details to console
```

### Error Handling Implementation

```typescript
function handleAuthError(error: any): string {
  // Log full error for debugging
  console.error('Authentication error:', error)
  
  // Map to user-friendly message
  if (error.message?.includes('Invalid login credentials')) {
    return 'Email atau password salah'
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return 'Email belum diverifikasi'
  }
  
  if (error.code === 'PGRST116') {
    return 'Akun tidak ditemukan'
  }
  
  if (error.message?.includes('network')) {
    return 'Koneksi gagal, silakan coba lagi'
  }
  
  // Default error message
  return 'Terjadi kesalahan, silakan coba lagi'
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Login Page Tests**
   - Renders email and password inputs
   - Renders login button
   - Shows loading state when submitting
   - Displays error message on failure
   - Calls auth service with correct credentials

2. **Auth Service Tests**
   - Calls Supabase signInWithPassword with credentials
   - Fetches user data after successful login
   - Returns error on invalid credentials
   - Calls Supabase signOut on logout
   - Uses Supabase getSession to check auth status

3. **Middleware Tests**
   - Redirects to login when no session exists
   - Allows access when valid session exists
   - Uses Supabase getSession for validation

4. **Dashboard Routing Tests**
   - Superadmin redirects to /admin/dashboard
   - Admin redirects to /admin/dashboard
   - Manager redirects to /manager/dashboard
   - Employee redirects to /employee/dashboard
   - Unknown role redirects to /forbidden

5. **Error Handling Tests**
   - Invalid credentials shows correct message
   - Network error shows correct message
   - Disabled account shows correct message
   - Errors are logged to console
   - Technical details not exposed to users

### Property-Based Tests

Property-based tests will verify universal properties across many inputs. Each test should run a minimum of 100 iterations.

1. **Property 1: Authentication Success Redirects to Correct Dashboard**
   - Generate random valid user data with different roles
   - Verify redirect URL matches role
   - Tag: **Feature: simple-supabase-auth, Property 1: Authentication Success Redirects to Correct Dashboard**

2. **Property 2: Authentication Failure Shows Error Message**
   - Generate random invalid credentials and error scenarios
   - Verify error message is displayed
   - Tag: **Feature: simple-supabase-auth, Property 2: Authentication Failure Shows Error Message**

3. **Property 3: Loading State During Authentication**
   - Generate random login attempts
   - Verify loading state transitions correctly
   - Tag: **Feature: simple-supabase-auth, Property 3: Loading State During Authentication**

4. **Property 4: Session Persistence Across Refresh**
   - Generate random valid sessions
   - Simulate refresh and verify session persists
   - Tag: **Feature: simple-supabase-auth, Property 4: Session Persistence Across Refresh**

5. **Property 5: Invalid Session Redirects to Login**
   - Generate random invalid session states
   - Verify redirect to login occurs
   - Tag: **Feature: simple-supabase-auth, Property 5: Invalid Session Redirects to Login**

6. **Property 6: Valid Session Allows Access**
   - Generate random valid sessions and protected routes
   - Verify access is granted
   - Tag: **Feature: simple-supabase-auth, Property 6: Valid Session Allows Access**

7. **Property 7: Middleware Checks Session on Protected Routes**
   - Generate random protected route requests
   - Verify session check occurs
   - Tag: **Feature: simple-supabase-auth, Property 7: Middleware Checks Session on Protected Routes**

8. **Property 8: Error Messages Don't Expose Technical Details**
   - Generate random errors with technical details
   - Verify user-facing messages don't contain technical info
   - Tag: **Feature: simple-supabase-auth, Property 8: Error Messages Don't Expose Technical Details**

9. **Property 9: Errors Are Logged for Debugging**
   - Generate random errors
   - Verify errors are logged to console
   - Tag: **Feature: simple-supabase-auth, Property 9: Errors Are Logged for Debugging**

10. **Property 10: Successful Login Creates Session**
    - Generate random valid credentials
    - Verify session object is created
    - Tag: **Feature: simple-supabase-auth, Property 10: Successful Login Creates Session**

11. **Property 11: Logout Redirects to Login Page**
    - Generate random authenticated states
    - Verify logout redirects to login
    - Tag: **Feature: simple-supabase-auth, Property 11: Logout Redirects to Login Page**

12. **Property 12: Logout Clears Session**
    - Generate random authenticated states
    - Verify no session exists after logout
    - Tag: **Feature: simple-supabase-auth, Property 12: Logout Clears Session**

13. **Property 13: No Loading Loops or Infinite Redirects**
    - Generate random navigation scenarios
    - Verify no infinite loops occur
    - Tag: **Feature: simple-supabase-auth, Property 13: No Loading Loops or Infinite Redirects**

14. **Property 14: User Not in Database Denies Access**
    - Generate random authenticated users not in database
    - Verify access is denied
    - Tag: **Feature: simple-supabase-auth, Property 14: User Not in Database Denies Access**

15. **Property 15: Inactive User Denies Access**
    - Generate random inactive users
    - Verify access is denied with error message
    - Tag: **Feature: simple-supabase-auth, Property 15: Inactive User Denies Access**

### Testing Framework

We will use:
- **Jest** for unit testing
- **React Testing Library** for component testing
- **fast-check** for property-based testing

### Integration Testing

Integration tests will verify the complete authentication flow:

1. User enters credentials → Login succeeds → Redirects to dashboard
2. User enters invalid credentials → Error message displayed
3. User logs out → Session cleared → Redirected to login
4. User accesses protected route without session → Redirected to login
5. User accesses protected route with session → Access granted

## Implementation Notes

### Files to Delete

The following files contain custom JWT/auth logic and should be completely removed:

1. Any custom JWT utility files
2. Any custom session management files
3. Any custom token handling code
4. Legacy auth service implementations that don't use Supabase

### Files to Create

1. `lib/supabase/client.ts` - Browser Supabase client
2. `lib/supabase/server.ts` - Server Supabase client
3. `lib/services/auth.service.ts` - Simple auth service wrapper
4. `app/login/page.tsx` - New simple login page
5. `middleware.ts` - Session validation middleware

### Files to Modify

1. `app/layout.tsx` - Remove any custom auth providers
2. `components/navigation/Sidebar.tsx` - Use new auth service for logout
3. Any dashboard pages - Ensure they rely on middleware for protection

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Schema Requirements

The `users` table must have:
- `id` (UUID, primary key, references auth.users)
- `email` (text)
- `role` (text)
- `unit_id` (UUID, nullable)
- `is_active` (boolean)
- `full_name` (text)

### Performance Considerations

1. **Minimize Database Queries**: Fetch user data once after login, cache in session
2. **Optimize Middleware**: Use efficient session checking
3. **Reduce Bundle Size**: Remove unused auth libraries
4. **Fast Redirects**: Use Next.js router for instant navigation

### Security Considerations

1. **Use HTTPS**: Always use HTTPS in production
2. **Secure Cookies**: Supabase handles this automatically
3. **No Token Exposure**: Never expose tokens in client-side code
4. **Rate Limiting**: Consider adding rate limiting to login endpoint
5. **Input Validation**: Validate email format before submission

## Migration Strategy

### Phase 1: Preparation
1. Backup current authentication code
2. Document current user flows
3. Test current system thoroughly

### Phase 2: Implementation
1. Install Supabase SSR package
2. Create new Supabase clients
3. Implement new auth service
4. Create new login page
5. Implement middleware

### Phase 3: Testing
1. Run unit tests
2. Run property-based tests
3. Manual testing of all flows
4. Performance testing

### Phase 4: Cleanup
1. Remove old auth code
2. Remove unused dependencies
3. Update documentation

### Phase 5: Deployment
1. Deploy to staging
2. Test in staging environment
3. Deploy to production
4. Monitor for issues

## Success Criteria

The implementation will be considered successful when:

1. ✅ Users can login with email/password
2. ✅ Users are redirected to correct dashboard based on role
3. ✅ Sessions persist across browser refresh
4. ✅ Protected routes are properly secured
5. ✅ Logout works correctly
6. ✅ No login loops or infinite redirects
7. ✅ Error messages are clear and helpful
8. ✅ All tests pass (unit and property-based)
9. ✅ No custom JWT code remains
10. ✅ Performance is fast and responsive
