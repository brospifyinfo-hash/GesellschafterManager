import { useAuth } from '@/hooks/useAuth'
import { Home, DollarSign, Clock, BarChart3, FileDown, TrendingUp, Wallet, Calendar, FileText, UserCircle, Activity, Award, Package, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

const navItems = [
  { id: 'home', label: 'Start', icon: Home, adminOnly: false },
  { id: 'expenses', label: 'Ausgaben', icon: DollarSign, adminOnly: false },
  { id: 'time', label: 'Zeiterfassung', icon: Clock, adminOnly: false },
  { id: 'analytics', label: 'Analyse', icon: BarChart3, adminOnly: false },
  { id: 'accounts', label: 'Konten', icon: Wallet, adminOnly: false },
  { id: 'revenue', label: 'Umsatz', icon: TrendingUp, adminOnly: true },
  { id: 'subscriptions', label: 'Abos', icon: Calendar, adminOnly: false },
  { id: 'leaderboard', label: 'Bestenliste', icon: Award, adminOnly: false },
  { id: 'returns', label: 'Retouren', icon: Package, adminOnly: false, restrictedTo: ['DK', 'DF', 'LS'] },
  { id: 'tax', label: 'Steuererklärungen', icon: Receipt, adminOnly: true },
  { id: 'online', label: 'Team Status', icon: Activity, adminOnly: false },
  { id: 'activity', label: 'Aktivitäten', icon: FileText, adminOnly: false, restrictedTo: ['DK', 'DF'] },
  { id: 'export', label: 'Export', icon: FileDown, adminOnly: false },
  { id: 'profile', label: 'Profil', icon: UserCircle, adminOnly: false },
]

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { user } = useAuth()
  
  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && !user?.isAdmin) return false
    if ('restrictedTo' in item && item.restrictedTo && !item.restrictedTo.includes(user?.code || '')) return false
    return true
  })

  return (
    <nav className="glass apple-shadow-lg border-t sticky bottom-0 md:relative md:border-t-0 md:border-b overflow-x-auto z-50">
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-start gap-1 py-2 min-w-max md:min-w-0 md:justify-center">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={cn(
                  'flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg smooth-transition whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
