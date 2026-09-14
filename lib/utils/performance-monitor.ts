// Performance monitoring utilities for production optimization
// Optimized for Vercel deployment

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 100 // Limit memory usage

  // Measure function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      this.recordMetric(name, performance.now() - start)
      return result
    } catch (error) {
      this.recordMetric(`${name}_error`, performance.now() - start)
      throw error
    }
  }

  // Measure sync function execution time
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    try {
      const result = fn()
      this.recordMetric(name, performance.now() - start)
      return result
    } catch (error) {
      this.recordMetric(`${name}_error`, performance.now() - start)
      throw error
    }
  }

  // Record custom metric
  recordMetric(name: string, value: number) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now()
    })

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && value > 1000) {
      console.warn(`[PERF] Slow operation: ${name} took ${value.toFixed(2)}ms`)
    }
  }

  // Get performance summary
  getSummary() {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000) // Last minute

    const summary: Record<string, { count: number; avg: number; max: number }> = {}

    recentMetrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, avg: 0, max: 0 }
      }
      
      const s = summary[metric.name]
      s.count++
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count
      s.max = Math.max(s.max, metric.value)
    })

    return summary
  }

  // Clear old metrics
  cleanup() {
    const cutoff = Date.now() - 300000 // 5 minutes
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor()

// Cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    performanceMonitor.cleanup()
  }, 60000) // Cleanup every minute
}

// Web Vitals tracking for production
export function trackWebVitals() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Track Core Web Vitals
    try {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        performanceMonitor.recordMetric('lcp', lastEntry.startTime)
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // FID (First Input Delay)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          performanceMonitor.recordMetric('fid', entry.processingStart - entry.startTime)
        })
      }).observe({ entryTypes: ['first-input'] })

      // CLS (Cumulative Layout Shift)
      let clsValue = 0
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        performanceMonitor.recordMetric('cls', clsValue)
      }).observe({ entryTypes: ['layout-shift'] })

    } catch (error) {
      // Silently fail if PerformanceObserver is not supported
    }
  }
}

// Database query performance tracking
export function trackDatabaseQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measureAsync(`db_${queryName}`, queryFn)
}

// API call performance tracking
export function trackApiCall<T>(
  endpoint: string,
  apiFn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measureAsync(`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, apiFn)
}

// Component render performance tracking
export function trackComponentRender(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now()
    return () => {
      performanceMonitor.recordMetric(`render_${componentName}`, performance.now() - start)
    }
  }
  return () => {} // No-op in production
}

// Memory usage tracking
export function trackMemoryUsage() {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
    const memory = (window.performance as any).memory
    performanceMonitor.recordMetric('memory_used', memory.usedJSHeapSize)
    performanceMonitor.recordMetric('memory_total', memory.totalJSHeapSize)
  }
}

// Bundle size tracking
export function trackBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      performanceMonitor.recordMetric('bundle_load_time', navigation.loadEventEnd - navigation.fetchStart)
      performanceMonitor.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart)
    }
  }
}