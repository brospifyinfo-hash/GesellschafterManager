import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardSettings } from '@/hooks/useDashboardSettings'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { getPersonalizedGreeting } from '@/lib/greetings'
import { QuickStatsWidget } from './widgets/QuickStatsWidget'
import { AccountBalanceWidget } from './widgets/AccountBalanceWidget'
import { RecentExpensesWidget } from './widgets/RecentExpensesWidget'
import { RecentTimeWidget } from './widgets/RecentTimeWidget'
import { OutstandingPaymentsWidget } from './widgets/OutstandingPaymentsWidget'
import { QuickActionsWidget } from './widgets/QuickActionsWidget'
import { ReturnsWidget } from './widgets/ReturnsWidget'
import { USERS } from '@/constants/users'

import { Settings, Activity, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface MobileDashboardProps {
  onNavigate: (page: string) => void
}

const widgetComponents = {
  stats: QuickStatsWidget,
  accounts: AccountBalanceWidget,
  recentExpenses: RecentExpensesWidget,
  recentTime: RecentTimeWidget,
  outstanding: OutstandingPaymentsWidget,
  quickActions: QuickActionsWidget,
  returns: ReturnsWidget,
}

export function MobileDashboard({ onNavigate }: MobileDashboardProps) {
  const { user } = useAuth()
  const { widgets = [], theme = 'default' } = useDashboardSettings()
  const { userStatuses = [] } = useOnlineStatus()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!user) return null

  // Sort widgets by order and filter enabled ones
  const enabledWidgets = (Array.isArray(widgets) ? widgets : [])
    .filter((w) => w && w.enabled)
    .sort((a, b) => (a?.order || 0) - (b?.order || 0))

  return (
    <div className={cn(
      'min-h-screen pb-20',
      theme === 'blue' && 'bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/20 dark:via-background dark:to-blue-950/20',
      theme === 'green' && 'bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/20 dark:via-background dark:to-green-950/20',
      theme === 'purple' && 'bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-background dark:to-purple-950/20',
      theme === 'orange' && 'bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-orange-950/20 dark:via-background dark:to-orange-950/20',
      theme === 'default' && 'bg-gradient-to-br from-background via-secondary/10 to-background'
    )}>
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">Dashboard</h1>
              <p className="text-xs text-muted-foreground truncate">{getPersonalizedGreeting(user.name)}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Team Status Dropdown */}
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Activity className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Team Status
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
                    <p>🟢 Online = Eingecheckt</p>
                    <p>🔴 Offline = Nicht eingecheckt</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>


            </div>
          </div>
        </div>
      </div>

      {/* Widgets */}
      <div className="container mx-auto px-3 py-4 space-y-3">
        {enabledWidgets.map((widget) => {
          if (!widget || !widget.id) return null
          const WidgetComponent = widgetComponents[widget.id as keyof typeof widgetComponents]
          if (!WidgetComponent) return null
          
          return (
            <div key={widget.id} className="animate-fade-in">
              <WidgetComponent onNavigate={onNavigate} />
            </div>
          )
        })}

        {enabledWidgets.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Keine Widgets aktiviert</p>
          </div>
        )}
      </div>
    </div>
  )
}
