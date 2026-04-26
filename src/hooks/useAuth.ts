import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { USERS } from '@/constants/users'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  originalUser: User | null
  isGhostMode: boolean
  login: (code: string, password: string) => Promise<boolean>
  updatePin: (userCode: string, newPin: string) => Promise<void>
  logout: () => void
  ghostLogin: (targetUser: User) => void
  exitGhostMode: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      originalUser: null,
      isGhostMode: false,
      login: async (code: string, password: string) => {
        const user = USERS.find(
          (u) => u.code === code && u.password === password
        )
        
        if (user) {
          // Log the login
          await supabase.from('login_logs').insert({
            user_code: user.code,
          })
          
          // Log activity (normal login only, not ghost)
          await supabase.from('activity_log').insert({
            user_code: user.code,
            activity_type: 'login',
            description: `${user.name} hat sich eingeloggt`,
          })
          
          set({ user, isGhostMode: false, originalUser: null })
          return true
        }
        return false
      },
      updatePin: async (userCode: string, newPin: string, onSuccess?: () => void) => {
        const userIndex = USERS.findIndex((u) => u.code === userCode)
        if (userIndex !== -1) {
          // Update the password in USERS array
          USERS[userIndex].password = newPin
          
          // Update current user state
          set((state) => {
            if (state.user?.code === userCode) {
              return { user: { ...state.user, password: newPin } }
            }
            return state
          })
          
          // Log activity
          await supabase.from('activity_log').insert({
            user_code: userCode,
            activity_type: 'pin_changed',
            description: `PIN geändert`,
          })
          
          if (onSuccess) onSuccess()
        }
      },
      logout: () => {
        set({ user: null, isGhostMode: false, originalUser: null })
      },
      ghostLogin: (targetUser: User) => {
        const { user, isGhostMode } = get()
        if (!user?.isAdmin) return
        
        // Save original user if not already in ghost mode
        // NO ACTIVITY LOG - das ist der Sinn von Ghost Mode!
        if (!isGhostMode) {
          set({ originalUser: user, user: targetUser, isGhostMode: true })
        } else {
          set({ user: targetUser })
        }
      },
      exitGhostMode: () => {
        const { originalUser, isGhostMode } = get()
        if (!isGhostMode || !originalUser) return
        
        // NO ACTIVITY LOG - Ghost Mode ist unsichtbar!
        set({ user: originalUser, isGhostMode: false, originalUser: null })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
