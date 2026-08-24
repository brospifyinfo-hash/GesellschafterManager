import { useState, useEffect } from 'react'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { USERS } from '@/constants/users'
import { Trophy, Medal, Crown, Calendar, TrendingUp, Clock, History } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface MonthlyStats {
  userCode: string
  hours: number
  /** Anteil der Stunden, der nachgetragen wurde (kein Ein-/Auschecken) */
  backdatedHours: number
  sessions: number
  rank: number
}

export function LeaderboardPage() {
  const { timeEntries, manualEntries } = useTimeEntries()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [leaderboard, setLeaderboard] = useState<MonthlyStats[]>([])

  useEffect(() => {
    calculateLeaderboard()
  }, [selectedMonth, timeEntries, manualEntries])

  const calculateLeaderboard = () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const allUsers = USERS.filter(u => !u.isTimeAccount)

    const stats = allUsers.map(user => {
      // Calculate regular time entries
      const userTimeEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.check_in)
        return (
          entry.user_code === user.code &&
          entryDate.getFullYear() === year &&
          entryDate.getMonth() + 1 === month &&
          entry.duration_minutes !== null
        )
      })

      const regularHours = userTimeEntries.reduce(
        (sum, entry) => sum + (entry.duration_minutes || 0) / 60,
        0
      )

      // Calculate manual time entries
      const userManualEntries = manualEntries.filter(entry => {
        const entryDate = new Date(entry.created_at)
        return (
          entry.user_code === user.code &&
          entryDate.getFullYear() === year &&
          entryDate.getMonth() + 1 === month
        )
      })

      const manualHours = userManualEntries.reduce(
        (sum, entry) => sum + entry.hours,
        0
      )

      return {
        userCode: user.code,
        hours: regularHours + manualHours,
        backdatedHours: manualHours,
        sessions: userTimeEntries.length,
        rank: 0
      }
    })

    // Sort by hours and assign ranks
    stats.sort((a, b) => b.hours - a.hours)
    stats.forEach((stat, index) => {
      stat.rank = index + 1
    })

    setLeaderboard(stats)
  }

  // Generate available months (last 12 months)
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })
    }
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <div className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">#{rank}</div>
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-300 dark:border-yellow-800'
    if (rank === 2) return 'from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-300 dark:border-gray-800'
    if (rank === 3) return 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-300 dark:border-orange-800'
    return 'from-background to-secondary/20'
  }

  const topPerformer = leaderboard[0]

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Time Champions</h1>
        </div>
        <p className="text-muted-foreground">
          Monatliche Bestenliste der fleißigsten Gesellschafter 💪
        </p>
      </div>

      {/* Month Selector */}
      <div className="mb-6 flex items-center gap-4">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Winner Podium */}
      {topPerformer && topPerformer.hours > 0 && (
        <Card className="mb-8 p-8 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-800">
          <div className="text-center">
            <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500 animate-bounce-subtle" />
            <h2 className="text-2xl font-bold mb-2">🏆 Champion des Monats</h2>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`w-16 h-16 rounded-full bg-user-${USERS.find(u => u.code === topPerformer.userCode)?.color} flex items-center justify-center text-white text-2xl font-bold`}>
                {USERS.find(u => u.code === topPerformer.userCode)?.name.substring(0, 2)}
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold">
                  {USERS.find(u => u.code === topPerformer.userCode)?.name}
                </p>
                <p className="text-lg text-muted-foreground">
                  {topPerformer.hours.toFixed(1)} Stunden
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm">
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                {topPerformer.sessions} Sessions
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                Ø {(topPerformer.hours / Math.max(topPerformer.sessions, 1)).toFixed(1)}h pro Session
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {leaderboard.length === 0 || leaderboard.every(s => s.hours === 0) ? (
          <Card className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Noch keine Daten</h3>
            <p className="text-muted-foreground">
              Im ausgewählten Monat wurden noch keine Stunden erfasst.
            </p>
          </Card>
        ) : (
          leaderboard.map((stat, index) => {
            const user = USERS.find(u => u.code === stat.userCode)
            if (!user) return null

            return (
              <Card
                key={stat.userCode}
                className={cn(
                  'p-6 transition-all hover:shadow-lg hover:scale-[1.01]',
                  'bg-gradient-to-r',
                  getRankColor(stat.rank)
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {getRankIcon(stat.rank)}
                  </div>

                  {/* User Avatar */}
                  <div className={`w-14 h-14 rounded-full bg-user-${user.color} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                    {user.name.substring(0, 2)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{user.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stat.sessions} Sessions
                      </span>
                      {stat.sessions > 0 && (
                        <span>
                          Ø {(stat.hours / stat.sessions).toFixed(1)}h
                        </span>
                      )}
                      {stat.backdatedHours > 0 && (
                        <span
                          className="flex items-center gap-1 text-amber-700 dark:text-amber-300"
                          title="Diese Stunden wurden nachträglich eingetragen"
                        >
                          <History className="w-3 h-3" />
                          {stat.backdatedHours.toFixed(1)}h nachgetragen
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-bold text-primary">
                      {stat.hours.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Stunden</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {topPerformer && topPerformer.hours > 0 && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full bg-gradient-to-r transition-all duration-500',
                          stat.rank === 1 && 'from-yellow-500 to-amber-500',
                          stat.rank === 2 && 'from-gray-400 to-slate-400',
                          stat.rank === 3 && 'from-orange-500 to-amber-500',
                          stat.rank > 3 && 'from-primary to-primary/70'
                        )}
                        style={{
                          width: `${(stat.hours / topPerformer.hours) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
