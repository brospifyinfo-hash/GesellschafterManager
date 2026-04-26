import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useEffect } from 'react'
import { INITIAL_WIDGETS } from '@/constants/widgets'

interface DashboardSettings {
  widgets: Array<{
    id: string
    title: string
    enabled: boolean
    order: number
  }>
  isDarkMode: boolean
  customColors?: {
    primary: string
    secondary: string
    accent: string
    background: string
  } | null
}

const DEFAULT_SETTINGS: DashboardSettings = {
  widgets: INITIAL_WIDGETS,
  isDarkMode: false,
  customColors: null,
}

export function useDashboardSettings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: settings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ['dashboard-settings', user?.code],
    queryFn: async () => {
      if (!user) return DEFAULT_SETTINGS

      const localSettings = localStorage.getItem(`dashboard-settings-${user.code}`)
      if (localSettings) {
        return JSON.parse(localSettings)
      }
      return DEFAULT_SETTINGS
    },
    enabled: !!user,
  })

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<DashboardSettings>) => {
      if (!user) return

      const updated = { ...settings, ...newSettings }
      localStorage.setItem(`dashboard-settings-${user.code}`, JSON.stringify(updated))
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-settings', user?.code] })
    },
  })

  const toggleWidget = (widgetId: string) => {
    const updatedWidgets = settings.widgets.map((w) =>
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    )
    updateSettings.mutate({ widgets: updatedWidgets })
  }

  const toggleDarkMode = () => {
    const newDarkMode = !settings.isDarkMode
    updateSettings.mutate({ isDarkMode: newDarkMode })
    
    // Apply to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const setCustomColors = (colors: DashboardSettings['customColors']) => {
    updateSettings.mutate({ customColors: colors })
  }

  const resetToDefault = () => {
    updateSettings.mutate(DEFAULT_SETTINGS)
    localStorage.removeItem(`dashboard-settings-${user?.code}`)
  }

  return {
    widgets: settings.widgets,
    isDarkMode: settings.isDarkMode,
    customColors: settings.customColors,
    toggleWidget,
    toggleDarkMode,
    setCustomColors,
    resetToDefault,
  }
}

// Hook to sync dark mode on mount
export function useDarkModeSync() {
  const { isDarkMode } = useDashboardSettings()

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])
}
