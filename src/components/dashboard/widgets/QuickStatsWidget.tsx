import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { Card } from '@/components/ui/card'
import { DollarSign, Clock, TrendingUp } from 'lucide-react'
import { calculateUserStats, formatCurrency, formatHours } from '@/lib/calculations'
import { UserCode } from '@/constants/users'

export function QuickStatsWidget({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth()
  const { expenses = [] } = useExpenses()
  const { timeEntries = [], manualEntries = [] } = useTimeEntries()

  if (!user) return null

  let userStats = { totalPaid: 0, totalHours: 0, percentage: 0 }
  try {
    const stats = calculateUserStats(
      Array.isArray(expenses) ? expenses : [],
      Array.isArray(timeEntries) ? timeEntries : [],
      Array.isArray(manualEntries) ? manualEntries : []
    )
    userStats = stats[user.code as UserCode] || { totalPaid: 0, totalHours: 0, percentage: 0 }
  } catch (err) {
    console.error('Error calculating stats:', err)
  }

  return (
    <Card className="glass apple-shadow p-4">
      <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Ihre Statistiken</h3>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('expenses')}
          className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ausgaben</p>
            <p className="text-sm font-bold">{formatCurrency(userStats.totalPaid)}</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('time')}
          className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Zeit</p>
            <p className="text-sm font-bold">{formatHours(userStats.totalHours)}</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('analytics')}
          className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Anteil</p>
            <p className="text-sm font-bold">{userStats.percentage.toFixed(1)}%</p>
          </div>
        </button>
      </div>
    </Card>
  )
}
