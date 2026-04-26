import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useExpenses } from '@/hooks/useExpenses'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Clock, TrendingUp, Activity, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { calculateUserStats, formatCurrency, formatHours, getOutstandingAmount, getTotalExpenses } from '@/lib/calculations'
import { UserCode, USERS } from '@/constants/users'

export function HomePage() {
  const { user } = useAuth()
  const { timeEntries = [], manualEntries = [], isLoading: isLoadingTime, error: errorTime } = useTimeEntries()
  const { expenses = [], isLoading: isLoadingExpenses, error: errorExpenses } = useExpenses()
  const { userStatuses = [], isLoading: isLoadingStatus, error: errorStatus } = useOnlineStatus()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!user) return null

  const isLoading = isLoadingTime || isLoadingExpenses || isLoadingStatus
  const hasError = errorTime || errorExpenses || errorStatus

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
          <p className="text-muted-foreground">Lade Daten...</p>
        </div>
      </div>
    )
  }

  // Safe data access with try-catch
  let userStats = { totalPaid: 0, totalHours: 0, percentage: 0 }
  let totalExpenses = 0
  let outstandingAmount = 0
  
  try {
    const stats = calculateUserStats(
      Array.isArray(expenses) ? expenses : [], 
      Array.isArray(timeEntries) ? timeEntries : [], 
      Array.isArray(manualEntries) ? manualEntries : []
    )
    userStats = stats[user.code as UserCode] || { totalPaid: 0, totalHours: 0, percentage: 0 }
    totalExpenses = getTotalExpenses(Array.isArray(expenses) ? expenses : [])
    outstandingAmount = getOutstandingAmount(Array.isArray(expenses) ? expenses : [], user.code as UserCode)
  } catch (err) {
    console.error('Error calculating stats:', err)
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* User Status Dropdown - Top Left */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 md:space-y-2 flex-1">
          <h2 className="text-xl md:text-2xl font-bold">Willkommen zurück, {user.name}!</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Übersicht Ihrer Beteiligung und Finanzen
          </p>
        </div>
        
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 shadow-lg">
              <Activity className="w-4 h-4" />
              Team Status
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Aktueller Status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {USERS.filter(u => !u.isTimeAccount).map((u) => {
              try {
                const status = Array.isArray(userStatuses) ? userStatuses.find(s => s?.userCode === u.code) : null
                const isOnline = status?.isOnline || false
                
                return (
                  <DropdownMenuItem key={u.code} className="gap-3 cursor-default">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full bg-user-${u.color} flex items-center justify-center text-white font-bold`}>
                          {u.name.substring(0, 2)}
                        </div>
                        <div 
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                            isOnline 
                              ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' 
                              : 'bg-red-500'
                          }`} 
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{u.name}</p>
                        <p className={`text-xs font-bold uppercase ${
                          isOnline 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isOnline ? '🟢 Online' : '🔴 Offline'}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              } catch (err) {
                console.error(`Error rendering ${u.code}:`, err)
                return (
                  <DropdownMenuItem key={u.code} className="gap-3 cursor-default">
                    <p className="text-sm text-muted-foreground">{u.name} - Status nicht verfügbar</p>
                  </DropdownMenuItem>
                )
              }
            })}
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground">
              <p>🟢 Online = Eingecheckt (Zeiterfassung aktiv)</p>
              <p>🔴 Offline = Nicht eingecheckt</p>
              <p className="mt-1 italic">🔄 Aktualisiert alle 10 Sekunden</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="glass apple-shadow p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ihre Ausgaben</p>
              <p className="text-xl md:text-2xl font-bold">{formatCurrency(userStats.totalPaid)}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="glass apple-shadow p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ihre Arbeitszeit</p>
              <p className="text-xl md:text-2xl font-bold">{formatHours(userStats.totalHours)}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="glass apple-shadow p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ihre Beteiligung</p>
              <p className="text-xl md:text-2xl font-bold">{userStats.percentage.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Outstanding Payments */}
      {outstandingAmount > 0 && (
        <Card className="glass apple-shadow p-4 md:p-6 border-destructive/50">
          <h3 className="text-lg font-semibold mb-2">Offene Zahlungen</h3>
          <p className="text-muted-foreground mb-4">
            Sie haben noch ausstehende Beträge zu begleichen
          </p>
          <p className="text-2xl md:text-3xl font-bold text-destructive">
            {formatCurrency(outstandingAmount)}
          </p>
        </Card>
      )}



      {/* Quick Info */}
      <Card className="glass apple-shadow p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-3">Schnellzugriff</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Ausgaben:</strong> Verwalten Sie Ihre Rechnungen und Zahlungen</p>
          <p>• <strong>Zeiterfassung:</strong> Nutzen Sie den Zeit-Account für Check-in/out</p>
          <p>• <strong>Analyse:</strong> Sehen Sie detaillierte Statistiken</p>
          <p>• <strong>Konten:</strong> Überprüfen Sie Ihre Gutschriften</p>
        </div>
      </Card>
    </div>
  )
}
