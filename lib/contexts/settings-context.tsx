'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Settings, getSettings, updateSettings as updateSettingsService } from '@/lib/services/settings.service'

interface SettingsContextValue {
  settings: Settings | null
  loading: boolean
  error: string | null
  updateSettings: (settings: Partial<Settings>) => Promise<{ success: boolean; error: string | null }>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

// Simple cache
let settingsCache: Settings | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60000 // 1 minute

// Simplified settings provider - no complex retry logic
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(settingsCache)
  const [loading, setLoading] = useState(false) // Start as false to prevent loading loop
  const [error, setError] = useState<string | null>(null)

  // Simplified load settings
  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh && settingsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
        setSettings(settingsCache)
        return
      }

      setLoading(true)
      const { data, error: fetchError } = await getSettings()

      if (data && !fetchError) {
        settingsCache = data
        cacheTimestamp = Date.now()
        setSettings(data)
      }
    } catch (err) {
      console.warn('Settings load failed (non-critical):', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      setLoading(true)
      const result = await updateSettingsService(newSettings)

      if (result.success) {
        settingsCache = null
        await loadSettings(true)
        return { success: true, error: null }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memperbarui pengaturan'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [loadSettings])

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    settingsCache = null
    await loadSettings(true)
  }, [loadSettings])

  // Simple initialization - load once when mounted
  useEffect(() => {
    if (typeof window !== 'undefined' && !settingsCache) {
      loadSettings()
    }
  }, [loadSettings])

  const value: SettingsContextValue = {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

// Hook untuk menggunakan settings context
export function useSettings() {
  const context = useContext(SettingsContext)

  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }

  return context
}