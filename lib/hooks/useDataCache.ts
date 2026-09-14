import { useState, useEffect, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      if (!forceRefresh) {
        const cached = cache.get(key)
        if (cached && Date.now() - cached.timestamp < ttl) {
          setData(cached.data)
          setLoading(false)
          return cached.data
        }
      }

      // Fetch fresh data
      const freshData = await fetcher()
      
      // Update cache
      cache.set(key, {
        data: freshData,
        timestamp: Date.now()
      })

      setData(freshData)
      return freshData
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refresh = useCallback(() => loadData(true), [loadData])

  const invalidate = useCallback(() => {
    cache.delete(key)
  }, [key])

  return { data, loading, error, refresh, invalidate }
}

// Clear all cache
export function clearAllCache() {
  cache.clear()
}

// Clear specific cache by key pattern
export function clearCacheByPattern(pattern: string) {
  const keys = Array.from(cache.keys())
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  })
}
