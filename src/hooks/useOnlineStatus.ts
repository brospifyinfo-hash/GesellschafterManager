import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { USER_CODES } from '@/constants/users'

interface OnlineUser {
  user_code: string
  check_in: string
}

interface UserStatus {
  userCode: string
  isOnline: boolean
  isCheckedIn: boolean
  checkInTime?: string
}

// Simulate online status based on recent activity (login logs)
export function useOnlineStatus() {
  const { data: activeEntries = [], isLoading: isLoadingEntries, error: errorEntries } = useQuery({
    queryKey: ['active-check-ins'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('user_code, check_in')
          .is('check_out', null)
          .in('user_code', USER_CODES)
          .order('check_in', { ascending: false })

        if (error) {
          console.error('Error fetching check-ins:', error)
          return []
        }
        return (data || []) as OnlineUser[]
      } catch (err) {
        console.error('Error in check-ins query:', err)
        return []
      }
    },
    refetchInterval: 10000,
    retry: 1,
    staleTime: 5000,
  })

  const { data: recentLogins = [], isLoading: isLoadingLogins, error: errorLogins } = useQuery({
    queryKey: ['recent-logins'],
    queryFn: async () => {
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
        
        const { data, error } = await supabase
          .from('login_logs')
          .select('user_code, login_time')
          .gte('login_time', fifteenMinutesAgo)
          .in('user_code', USER_CODES)
          .order('login_time', { ascending: false })

        if (error) {
          console.error('Error fetching logins:', error)
          return []
        }
        return (data || []) as { user_code: string; login_time: string }[]
      } catch (err) {
        console.error('Error in logins query:', err)
        return []
      }
    },
    refetchInterval: 10000,
    retry: 1,
    staleTime: 5000,
  })

  // Safe computation of user statuses
  // User is ONLINE if they have an active check-in (eingecheckt)
  const userStatuses: UserStatus[] = USER_CODES.map((userCode) => {
    try {
      const safeActiveEntries = Array.isArray(activeEntries) ? activeEntries : []
      const safeRecentLogins = Array.isArray(recentLogins) ? recentLogins : []
      
      const isCheckedIn = safeActiveEntries.some((e) => e?.user_code === userCode)
      // User is online if checked in (has active time entry)
      const isOnline = isCheckedIn
      const checkInTime = safeActiveEntries.find((e) => e?.user_code === userCode)?.check_in
      
      return {
        userCode,
        isOnline,
        isCheckedIn,
        checkInTime,
      }
    } catch (err) {
      console.error(`Error computing status for ${userCode}:`, err)
      return {
        userCode,
        isOnline: false,
        isCheckedIn: false,
      }
    }
  })

  const isUserOnline = (userCode: string) => {
    try {
      return userStatuses?.find((s) => s.userCode === userCode)?.isOnline || false
    } catch {
      return false
    }
  }

  const isUserCheckedIn = (userCode: string) => {
    try {
      return userStatuses?.find((s) => s.userCode === userCode)?.isCheckedIn || false
    } catch {
      return false
    }
  }

  return {
    userStatuses: userStatuses || [],
    isUserOnline,
    isUserCheckedIn,
    isLoading: isLoadingEntries || isLoadingLogins,
    error: errorEntries || errorLogins,
  }
}
