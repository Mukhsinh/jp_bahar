# Implementation Plan: Performance Optimization

## Overview

Implementasi optimasi performa untuk mengatasi masalah "rebuilding" dan navigasi lambat dengan fokus pada production build, route prefetching, dan middleware caching.

## Tasks

- [x] 1. Create OptimizedLink component untuk route prefetching
  - Create `components/ui/optimized-link.tsx` dengan Next.js Link wrapper
  - Enable prefetch by default
  - Export component untuk digunakan di seluruh aplikasi
  - _Requirements: 2.1, 2.3_

- [x] 2. Update Sidebar component untuk menggunakan OptimizedLink
  - Replace semua `<a>` tags dengan `OptimizedLink`
  - Enable prefetch untuk semua menu items
  - Test navigation speed improvement
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Enhance middleware caching
  - [x] 3.1 Increase cache TTL dari 5 menit ke 15 menit
    - Update `CACHE_TTL` constant di middleware.ts
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.2 Add cache size limit dan cleanup function
    - Implement `MAX_CACHE_SIZE` constant (1000 entries)
    - Create `cleanupCache()` function dengan LRU eviction
    - Call cleanup sebelum set new cache entry
    - _Requirements: 7.3_
  
  - [x] 3.3 Optimize employee data query
    - Select only required fields (role, is_active)
    - Use `.maybeSingle()` instead of `.single()`
    - _Requirements: 7.1_

- [x] 4. Optimize Next.js configuration
  - [x] 4.1 Enable SWC minification
    - Add `swcMinify: true` to next.config.js
    - _Requirements: 1.3_
  
  - [x] 4.2 Verify production optimizations
    - Confirm `removeConsole` is enabled for production
    - Confirm `productionBrowserSourceMaps: false`
    - Confirm `compress: true`
    - _Requirements: 8.2, 8.3_
  
  - [x] 4.3 Verify cache headers configuration
    - Check static asset cache headers (max-age=31536000)
    - Check _next/static cache headers
    - _Requirements: 4.2_

- [x] 5. Add production build scripts
  - [x] 5.1 Update package.json scripts
    - Ensure `build` script exists
    - Ensure `start` script uses correct port (3002)
    - Add `start:prod` script untuk build + start
    - _Requirements: 5.2, 5.3_
  
  - [x] 5.2 Create production startup script
    - Create `START_PRODUCTION.ps1` untuk Windows
    - Script should run build then start
    - Add error handling
    - _Requirements: 5.3, 5.4_

- [x] 6. Test production build locally
  - Run `npm run build` dan verify no errors
  - Run `npm run start` dan test aplikasi
  - Verify no "rebuilding" messages di console
  - Test navigation speed antar menu
  - Check Network tab untuk prefetch requests
  - _Requirements: 1.1, 1.2, 2.3_

- [x] 7. Create performance testing script
  - [x] 7.1 Create script untuk measure navigation timing
    - Create `scripts/test-performance-optimization.ts`
    - Measure time untuk navigate antar pages
    - Verify < 200ms untuk prefetched routes
    - _Requirements: 2.3_
  
  - [x] 7.2 Create script untuk test middleware cache
    - Test cache hit rate
    - Measure middleware execution time
    - Verify < 50ms untuk cached requests
    - _Requirements: 3.3_

- [x] 8. Documentation dan deployment guide
  - Update README dengan production build instructions
  - Document development vs production mode
  - Add troubleshooting section untuk common issues
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Checkpoint - Verify all optimizations working
  - Ensure all tests pass
  - Verify production build works
  - Confirm navigation is fast
  - Ask user if questions arise

## Notes

- Fokus utama: Gunakan production build bukan development mode
- Development mode (`npm run dev`) akan tetap ada untuk development
- Production mode (`npm run build && npm run start`) untuk testing performa
- Vercel deployment otomatis menggunakan production build
- Cache optimization akan improve middleware performance significantly
- Route prefetching akan membuat navigasi terasa instant
