# Design Document: Performance Optimization

## Overview

Sistem JASPEL mengalami masalah performa karena berjalan dalam development mode dengan HMR aktif. Design ini mengoptimalkan aplikasi untuk production dengan fokus pada:
- Production build configuration
- Route prefetching dan caching
- Middleware optimization dengan in-memory cache
- Static asset optimization
- Server Component usage yang optimal

## Architecture

### Current Issues
1. **Development Mode**: Aplikasi berjalan dengan `npm run dev` yang trigger HMR dan rebuild
2. **No Prefetching**: Link tidak menggunakan Next.js Link component dengan prefetch
3. **Middleware Overhead**: Setiap request query database untuk employee data
4. **Suboptimal Caching**: Cache TTL terlalu pendek (5 menit) dan tidak persistent

### Proposed Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Production Build                          │
│  - Pre-compiled pages                                        │
│  - Optimized bundles                                         │
│  - No HMR overhead                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Middleware Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  In-Memory Cache (15 min TTL)                        │   │
│  │  - Employee role & status                            │   │
│  │  - Session validation                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Route Prefetching                         │
│  - Sidebar links use Next.js Link                           │
│  - Automatic prefetch on hover                              │
│  - Client-side navigation cache                             │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Production Build Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "start:prod": "npm run build && npm run start"
  }
}
```

### 2. Optimized Link Component

**File**: `components/ui/optimized-link.tsx`

```typescript
import Link from 'next/link'
import { ComponentProps } from 'react'

interface OptimizedLinkProps extends ComponentProps<typeof Link> {
  prefetch?: boolean
}

export function OptimizedLink({ 
  prefetch = true, 
  ...props 
}: OptimizedLinkProps) {
  return <Link prefetch={prefetch} {...props} />
}
```

### 3. Enhanced Middleware Cache

**File**: `middleware.ts` (modifications)

```typescript
// Increase cache TTL to 15 minutes
const CACHE_TTL = 15 * 60 * 1000

// Add cache size limit
const MAX_CACHE_SIZE = 1000

// Add cache cleanup
function cleanupCache() {
  if (employeeCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(employeeCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
    toDelete.forEach(([key]) => employeeCache.delete(key))
  }
}
```

### 4. Sidebar Component Optimization

**File**: `components/navigation/Sidebar.tsx`

Modifications:
- Replace `<a>` tags with `OptimizedLink`
- Enable prefetch for all menu items
- Use `useTransition` for smooth navigation

```typescript
import { OptimizedLink } from '@/components/ui/optimized-link'
import { useTransition } from 'react'

// In menu items
<OptimizedLink 
  href="/dashboard" 
  prefetch={true}
  className="..."
>
  Dashboard
</OptimizedLink>
```

### 5. Next.js Configuration Enhancement

**File**: `next.config.js`

```javascript
const nextConfig = {
  output: 'standalone',
  
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    optimizePackageImports: [
      'lucide-react', 
      '@supabase/supabase-js',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ],
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  
  // Headers for aggressive caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

## Data Models

### Cache Entry Structure

```typescript
interface CacheEntry {
  role: Role
  is_active: boolean
  timestamp: number
}

interface EmployeeCache {
  data: Map<string, CacheEntry>
  maxSize: number
  ttl: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Production Build Consistency
*For any* production build, running the application should never show "rebuilding" messages in the console or trigger HMR.
**Validates: Requirements 1.2**

### Property 2: Cache Hit Rate
*For any* authenticated user making multiple requests within the cache TTL, the middleware should use cached data and not query the database.
**Validates: Requirements 3.1, 3.2**

### Property 3: Navigation Speed
*For any* navigation between pages, when using prefetched routes, the transition should complete in under 200ms.
**Validates: Requirements 2.3**

### Property 4: Cache Invalidation
*For any* cache entry older than the TTL, the system should fetch fresh data from the database on the next request.
**Validates: Requirements 3.2, 7.3**

### Property 5: Link Prefetch Behavior
*For any* link in the sidebar, hovering or viewing the link should trigger automatic prefetch of the target page.
**Validates: Requirements 2.1**

### Property 6: Static Asset Caching
*For any* static asset request, the response should include cache headers with max-age of at least 1 year.
**Validates: Requirements 4.2**

### Property 7: Server Component Usage
*For any* component that doesn't require client-side interactivity, the component should be a Server Component without 'use client' directive.
**Validates: Requirements 6.1, 6.3**

### Property 8: Middleware Performance
*For any* cached authentication check, the middleware execution time should be under 50ms.
**Validates: Requirements 3.3**

## Error Handling

### Build Errors
- **Issue**: Build fails due to TypeScript errors
- **Solution**: Run `npm run lint` before build, fix all errors
- **Fallback**: Use `next build --no-lint` only for emergency

### Cache Memory Issues
- **Issue**: Cache grows too large
- **Solution**: Implement cache size limit (1000 entries) with LRU eviction
- **Monitoring**: Log cache size periodically

### Prefetch Failures
- **Issue**: Prefetch fails for protected routes
- **Solution**: Prefetch only works for authenticated users, handle gracefully
- **Fallback**: Regular navigation still works without prefetch

### Production Server Crashes
- **Issue**: Server crashes in production
- **Solution**: Use PM2 or similar process manager for auto-restart
- **Monitoring**: Implement health check endpoint

## Testing Strategy

### Unit Tests
- Test cache functions (get, set, cleanup)
- Test OptimizedLink component rendering
- Test middleware cache hit/miss logic
- Test cache TTL expiration

### Integration Tests
- Test full navigation flow with prefetch
- Test middleware with cache enabled
- Test production build generation
- Test static asset serving with cache headers

### Performance Tests
- Measure navigation time with/without prefetch
- Measure middleware execution time with/without cache
- Measure initial page load time
- Measure Time to Interactive (TTI)

### Property-Based Tests
- Property 2: Cache hit rate (generate random user IDs, verify cache usage)
- Property 4: Cache invalidation (generate timestamps, verify expiration)
- Property 8: Middleware performance (generate requests, measure timing)

### Manual Testing Checklist
1. Build production: `npm run build`
2. Start production: `npm start`
3. Open browser, check console - no "rebuilding" messages
4. Navigate between pages - should be instant
5. Check Network tab - prefetch requests visible
6. Check Response headers - cache headers present
7. Monitor server logs - cache hit rate

### Performance Benchmarks
- **Target**: Navigation < 200ms
- **Target**: Middleware < 50ms (cached)
- **Target**: Initial load < 2s
- **Target**: Cache hit rate > 80%

## Implementation Notes

### Phase 1: Quick Wins (Immediate)
1. Update Sidebar to use OptimizedLink
2. Increase middleware cache TTL to 15 minutes
3. Add cache size limit and cleanup
4. Create production start script

### Phase 2: Build Optimization
1. Verify Next.js config is optimal
2. Test production build locally
3. Measure performance improvements
4. Document production deployment process

### Phase 3: Monitoring
1. Add performance logging
2. Track cache hit rates
3. Monitor navigation timing
4. Set up alerts for slow requests

### Development vs Production
- **Development**: Use `npm run dev` for development with HMR
- **Local Production Test**: Use `npm run build && npm run start`
- **Vercel Production**: Automatic production build on deploy

### Vercel Deployment
- Vercel automatically runs `npm run build`
- Uses standalone output mode
- Serves optimized static assets from CDN
- No additional configuration needed
