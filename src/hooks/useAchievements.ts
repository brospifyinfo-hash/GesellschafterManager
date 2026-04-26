import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Achievement } from '@/types'
import { useAuth } from './useAuth'

export function useAchievements() {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('earned_at', { ascending: false })

      if (error) throw error
      setAchievements(data || [])
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAndAwardAchievements = async (
    userCode: string,
    context: {
      expenses?: any[]
      timeEntries?: any[]
      receipts?: any[]
    }
  ) => {
    try {
      const newAchievements: any[] = []

      // Check expense milestones
      if (context.expenses) {
        const userExpenses = context.expenses.filter(e => e.created_by === userCode)
        const totalSpent = userExpenses.reduce((sum, e) => sum + e.total_amount, 0)

        // First 100€ spent
        if (totalSpent >= 100) {
          const exists = achievements.find(
            a => a.user_code === userCode && a.achievement_type === 'first_100_spent'
          )
          if (!exists) {
            newAchievements.push({
              user_code: userCode,
              achievement_type: 'first_100_spent',
              title: 'Erster 100€-Meilenstein',
              description: 'Du hast insgesamt 100€ ausgegeben!',
              icon: '💰',
              metadata: { amount: totalSpent }
            })
          }
        }

        // 1000€ milestone
        if (totalSpent >= 1000) {
          const exists = achievements.find(
            a => a.user_code === userCode && a.achievement_type === 'spent_1000'
          )
          if (!exists) {
            newAchievements.push({
              user_code: userCode,
              achievement_type: 'spent_1000',
              title: '1000€ Investor',
              description: 'Du hast bereits 1000€ investiert!',
              icon: '💎',
              metadata: { amount: totalSpent }
            })
          }
        }
      }

      // Check time milestones
      if (context.timeEntries) {
        const userTimeEntries = context.timeEntries.filter(t => t.user_code === userCode)
        const totalHours = userTimeEntries.reduce(
          (sum, t) => sum + (t.duration_minutes || 0) / 60,
          0
        )

        // 10 hours in one session
        const longestSession = Math.max(
          ...userTimeEntries.map(t => (t.duration_minutes || 0) / 60)
        )
        if (longestSession >= 10) {
          const exists = achievements.find(
            a => a.user_code === userCode && a.achievement_type === 'marathon_10h'
          )
          if (!exists) {
            newAchievements.push({
              user_code: userCode,
              achievement_type: 'marathon_10h',
              title: '10-Stunden-Marathon',
              description: 'Du hast 10 Stunden am Stück gearbeitet!',
              icon: '⏱️',
              metadata: { hours: longestSession }
            })
          }
        }

        // 100 total hours
        if (totalHours >= 100) {
          const exists = achievements.find(
            a => a.user_code === userCode && a.achievement_type === 'total_100h'
          )
          if (!exists) {
            newAchievements.push({
              user_code: userCode,
              achievement_type: 'total_100h',
              title: '100-Stunden-Club',
              description: 'Du hast insgesamt 100 Stunden gearbeitet!',
              icon: '🏆',
              metadata: { hours: totalHours }
            })
          }
        }
      }

      // Check receipt milestones
      if (context.receipts) {
        const userReceipts = context.receipts.filter(
          r => context.expenses?.find(e => e.id === r.expense_id && e.created_by === userCode)
        )
        
        if (userReceipts.length >= 100) {
          const exists = achievements.find(
            a => a.user_code === userCode && a.achievement_type === 'receipt_100'
          )
          if (!exists) {
            newAchievements.push({
              user_code: userCode,
              achievement_type: 'receipt_100',
              title: '100. Beleg hochgeladen',
              description: 'Du hast 100 Belege hochgeladen!',
              icon: '🧾',
              metadata: { count: userReceipts.length }
            })
          }
        }
      }

      // Insert new achievements
      if (newAchievements.length > 0) {
        const { error } = await supabase
          .from('achievements')
          .insert(newAchievements)

        if (!error) {
          fetchAchievements()
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error)
    }
  }

  const getUserAchievements = (userCode: string) => {
    return achievements.filter(a => a.user_code === userCode)
  }

  return {
    achievements,
    loading,
    checkAndAwardAchievements,
    getUserAchievements,
    refetch: fetchAchievements
  }
}
