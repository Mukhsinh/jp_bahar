/**
 * Custom storage adapter untuk Supabase Auth
 * Mengatasi masalah localStorage/sessionStorage yang tidak tersedia
 */

export interface StorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem: (key: string) => void | Promise<void>
}

class SafeStorageAdapter implements StorageAdapter {
  private storage: Storage | null = null
  private fallbackStorage: Map<string, string> = new Map()
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (this.isInitialized) return
    
    // Safely check for localStorage availability
    if (typeof window !== 'undefined') {
      try {
        const testKey = '__supabase_test__'
        window.localStorage.setItem(testKey, 'test')
        window.localStorage.removeItem(testKey)
        this.storage = window.localStorage
        console.log('[Storage] Using localStorage')
      } catch (error: any) {
        console.warn('[Storage] localStorage not available, using fallback memory storage')
        this.storage = null
      }
    } else {
      console.log('[Storage] Server environment, using fallback memory storage')
    }
    
    this.isInitialized = true
  }

  getItem(key: string): string | null {
    this.initialize()
    
    try {
      if (this.storage) {
        const value = this.storage.getItem(key)
        // Also store in fallback for consistency
        if (value !== null) {
          this.fallbackStorage.set(key, value)
        }
        return value
      } else {
        // Use fallback storage
        return this.fallbackStorage.get(key) || null
      }
    } catch (error: any) {
      console.warn(`[Storage] Error getting item ${key}:`, error)
      // Try fallback
      return this.fallbackStorage.get(key) || null
    }
  }

  setItem(key: string, value: string): void {
    this.initialize()
    
    try {
      // Always store in fallback first
      this.fallbackStorage.set(key, value)
      
      if (this.storage) {
        this.storage.setItem(key, value)
        console.log(`[Storage] Stored ${key} in localStorage`)
      } else {
        console.log(`[Storage] Stored ${key} in fallback memory storage`)
      }
    } catch (error: any) {
      console.warn(`[Storage] Error setting item ${key}:`, error)
      // Fallback is already set above
    }
  }

  removeItem(key: string): void {
    this.initialize()
    
    try {
      // Remove from fallback
      this.fallbackStorage.delete(key)
      
      if (this.storage) {
        this.storage.removeItem(key)
        console.log(`[Storage] Removed ${key} from localStorage`)
      } else {
        console.log(`[Storage] Removed ${key} from fallback memory storage`)
      }
    } catch (error: any) {
      console.warn(`[Storage] Error removing item ${key}:`, error)
      // Fallback is already removed above
    }
  }

  clear(): void {
    this.initialize()
    
    try {
      if (this.storage) {
        // Only clear Supabase-related keys to avoid clearing other app data
        const supabaseKeys = []
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            supabaseKeys.push(key)
          }
        }
        supabaseKeys.forEach(key => this.storage!.removeItem(key))
      }
      this.fallbackStorage.clear()
    } catch (error: any) {
      console.warn('[Storage] clear error:', error)
      this.fallbackStorage.clear()
    }
  }
}

// Singleton instance
let storageAdapter: SafeStorageAdapter | null = null

export function getStorageAdapter(): SafeStorageAdapter {
  if (!storageAdapter) {
    storageAdapter = new SafeStorageAdapter()
  }
  return storageAdapter
}

// Helper untuk membersihkan storage
export function clearAllStorage(): void {
  const adapter = getStorageAdapter()
  adapter.clear()
  
  // Also clear sessionStorage if available
  if (typeof window !== 'undefined') {
    try {
      // Clear only Supabase-related sessionStorage
      const sessionKeys = []
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          sessionKeys.push(key)
        }
      }
      sessionKeys.forEach(key => window.sessionStorage.removeItem(key))
    } catch (error: any) {
      console.warn('[Storage] sessionStorage clear error:', error)
    }
  }
}