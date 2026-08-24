import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TimeEntry, ManualTimeEntry } from '@/types'
import { toast } from 'sonner'
import { useAchievements } from './useAchievements'

export function useTimeEntries() {
  const queryClient = useQueryClient()
  const { checkAndAwardAchievements } = useAchievements()

  const { data: timeEntries = [], isLoading, error } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .order('check_in', { ascending: false })
        
        if (error) {
          console.error('Error fetching time entries:', error)
          return []
        }
        return (data || []) as TimeEntry[]
      } catch (err) {
        console.error('Time entries query error:', err)
        return []
      }
    },
    retry: 1,
  })

  const { data: manualEntries = [], isLoading: isLoadingManual } = useQuery({
    queryKey: ['manualTimeEntries'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('manual_time_entries')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching manual entries:', error)
          return []
        }
        return (data || []) as ManualTimeEntry[]
      } catch (err) {
        console.error('Manual entries query error:', err)
        return []
      }
    },
    retry: 1,
  })

  const checkIn = useMutation({
    mutationFn: async (userCode: string) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_code: userCode,
          check_in: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: userCode,
        activity_type: 'check_in',
        description: `Eingecheckt`,
      })

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      toast.success('✅ Eingecheckt!', {
        duration: 2000,
        className: 'animate-scale-in',
      })
    },
    onError: () => {
      toast.error('Fehler beim Einchecken')
    },
  })

  const checkOut = useMutation({
    mutationFn: async (entryIdOrUserCode: string) => {
      let activeEntry

      // Check if it's a UUID (entry ID) or user code
      if (entryIdOrUserCode.includes('-')) {
        // It's an entry ID
        const { data } = await supabase
          .from('time_entries')
          .select('*')
          .eq('id', entryIdOrUserCode)
          .single()
        activeEntry = data
      } else {
        // It's a user code
        const { data } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_code', entryIdOrUserCode)
          .is('check_out', null)
          .order('check_in', { ascending: false })
          .limit(1)
          .single()
        activeEntry = data
      }

      if (!activeEntry) throw new Error('Kein aktiver Eintrag gefunden')

      const checkOutTime = new Date()
      const checkInTime = new Date(activeEntry.check_in)
      const durationMinutes = Math.floor(
        (checkOutTime.getTime() - checkInTime.getTime()) / 1000 / 60
      )

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          check_out: checkOutTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', activeEntry.id)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: activeEntry.user_code,
        activity_type: 'check_out',
        description: `Ausgecheckt (${(durationMinutes / 60).toFixed(2)}h)`,
        metadata: { duration_minutes: durationMinutes },
      })

      return data
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      
      const durationHours = (data.duration_minutes || 0) / 60
      
      toast.success(`⛑️ Ausgecheckt! ${durationHours.toFixed(1)}h gearbeitet`, {
        duration: 3000,
        className: 'animate-scale-in',
      })
      
      // Check for achievements
      const allTimeEntries = queryClient.getQueryData<TimeEntry[]>(['timeEntries']) || []
      await checkAndAwardAchievements(data.user_code, {
        timeEntries: allTimeEntries,
      })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Auschecken')
    },
  })

  const addManualTime = useMutation({
    mutationFn: async (entry: {
      user_code: string
      hours: number
      added_by: string
      reason?: string
    }) => {
      const { data, error } = await supabase
        .from('manual_time_entries')
        .insert(entry)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: entry.added_by,
        activity_type: 'manual_time_added',
        description: `${entry.hours}h für ${entry.user_code} nachgetragen`,
        metadata: {
          target_user: entry.user_code,
          hours: entry.hours,
          backdated: true,
          reason: entry.reason || null,
        },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualTimeEntries'] })
      toast.success('Zeit nachgetragen – der Eintrag ist als „Nachgetragen“ markiert')
    },
    onError: () => {
      toast.error('Fehler beim Nachtragen der Zeit')
    },
  })

  const deleteTimeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      toast.success('Zeiteintrag wurde gelöscht')
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Zeiteintrags')
    },
  })

  const deleteManualEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('manual_time_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualTimeEntries'] })
      toast.success('Nachgetragener Eintrag wurde gelöscht')
    },
    onError: () => {
      toast.error('Fehler beim Löschen des nachgetragenen Eintrags')
    },
  })

  // Get active entry for a user
  const activeEntry = (userCode: string) => {
    return timeEntries.find(
      (entry) => entry.user_code === userCode && !entry.check_out
    )
  }

  return {
    timeEntries,
    manualEntries,
    isLoading: isLoading || isLoadingManual,
    activeEntry,
    checkIn: checkIn.mutate,
    checkOut: checkOut.mutate,
    addManualTime: addManualTime.mutate,
    deleteTimeEntry: deleteTimeEntry.mutate,
    deleteManualEntry: deleteManualEntry.mutate,
  }
}
