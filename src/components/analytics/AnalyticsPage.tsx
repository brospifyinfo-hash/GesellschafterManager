import { useExpenses } from '@/hooks/useExpenses'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateUserStats, formatCurrency, formatHours, getTotalExpenses } from '@/lib/calculations'
import { USERS } from '@/constants/users'
import { UserCode } from '@/constants/users'
import { TrendingUp, DollarSign, Clock, Award } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const COLORS = {
  DK: '#0080FF',
  LS: '#FFB800',
  DF: '#10B981',
  DM: '#EF4444',
}

export function AnalyticsPage() {
  const { expenses = [], isLoading: isLoadingExpenses, error: errorExpenses } = useExpenses()
  const { timeEntries = [], manualEntries = [], isLoading: isLoadingTime, error: errorTime } = useTimeEntries()

  const isLoading = isLoadingExpenses || isLoadingTime
  const hasError = errorExpenses || errorTime

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Fehler beim Laden der Daten</p>
          <Button onClick={() => window.location.reload()}>Neu laden</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Lade Analysen...</p>
        </div>
      </div>
    )
  }

  let stats, totalExpenses, totalHours
  try {
    stats = calculateUserStats(
      Array.isArray(expenses) ? expenses : [],
      Array.isArray(timeEntries) ? timeEntries : [],
      Array.isArray(manualEntries) ? manualEntries : []
    )
    totalExpenses = getTotalExpenses(Array.isArray(expenses) ? expenses : [])
    totalHours = Object.values(stats).reduce((sum, s) => sum + (s?.totalHours || 0), 0)
  } catch (err) {
    console.error('Error calculating stats:', err)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Fehler beim Berechnen der Statistiken</p>
          <Button onClick={() => window.location.reload()}>Neu laden</Button>
        </div>
      </div>
    )
  }

  // Prepare data for charts (exclude ZEIT account)
  const regularUsers = USERS.filter((u) => u.code !== 'ZEIT')
  
  const pieData = regularUsers.map((user) => ({
    name: user.name,
    value: parseFloat(stats[user.code as UserCode].percentage.toFixed(1)),
    code: user.code,
  }))

  const barData = regularUsers.map((user) => ({
    name: user.name,
    Ausgaben: stats[user.code as UserCode].totalPaid,
    Stunden: stats[user.code as UserCode].totalHours,
    code: user.code,
  }))

  // Find top contributors (exclude ZEIT account)
  const topInvestor = regularUsers.reduce((prev, current) =>
    stats[current.code as UserCode].totalPaid > stats[prev.code as UserCode].totalPaid
      ? current
      : prev
  )

  const topWorker = regularUsers.reduce((prev, current) =>
    stats[current.code as UserCode].totalHours > stats[prev.code as UserCode].totalHours
      ? current
      : prev
  )

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">Analyse & Statistiken</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Übersicht über Beteiligungen und Beiträge
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="glass apple-shadow p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Gesamtinvestition</p>
              <p className="text-xl md:text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-primary/50" />
          </div>
        </Card>

        <Card className="glass apple-shadow p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Gesamtarbeitszeit</p>
              <p className="text-xl md:text-2xl font-bold">{formatHours(totalHours)}</p>
            </div>
            <Clock className="w-6 h-6 md:w-8 md:h-8 text-primary/50" />
          </div>
        </Card>

        <Card className="glass apple-shadow p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Top Investor</p>
              <p className="text-lg md:text-xl font-bold">{topInvestor.name}</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {formatCurrency(stats[topInvestor.code as UserCode].totalPaid)}
              </p>
            </div>
            <Award className="w-6 h-6 md:w-8 md:h-8 text-primary/50" />
          </div>
        </Card>

        <Card className="glass apple-shadow p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Meiste Stunden</p>
              <p className="text-lg md:text-xl font-bold">{topWorker.name}</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {formatHours(stats[topWorker.code as UserCode].totalHours)}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary/50" />
          </div>
        </Card>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {regularUsers.map((user) => {
          const userStats = stats[user.code as UserCode]
          
          return (
            <Card key={user.code} className="glass apple-shadow p-4 md:p-6">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-user-${user.color} text-white flex items-center justify-center font-bold text-base md:text-lg mb-3`}>
                {user.code}
              </div>
              <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4">{user.name}</h3>
              
              <div className="space-y-2 md:space-y-3">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Ausgaben</p>
                  <p className="text-sm md:text-base font-semibold">{formatCurrency(userStats.totalPaid)}</p>
                </div>
                
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Arbeitszeit</p>
                  <p className="text-sm md:text-base font-semibold">{formatHours(userStats.totalHours)}</p>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-xs md:text-sm text-muted-foreground">Beteiligung</p>
                  <p className="text-xl md:text-2xl font-bold">{userStats.percentage.toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="glass apple-shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-4">Prozentuale Beteiligung</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.value}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.code} fill={COLORS[entry.code as UserCode]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass apple-shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-4">Ausgaben & Arbeitszeit Vergleich</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="Ausgaben" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="Stunden" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
