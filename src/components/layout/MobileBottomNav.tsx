import { Home, DollarSign, BarChart3, UserCircle, Inbox as InboxIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { Badge } from '@/components/ui/badge'

interface MobileBottomNavProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function MobileBottomNav({ currentPage, onPageChange }: MobileBottomNavProps) {
  const { user } = useAuth()
  const { unreadCount } = useNotifications(user?.code || '')
  
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, show: true, badge: 0 },
    { id: 'expenses', label: 'Ausgaben', icon: DollarSign, show: true, badge: 0 },
    { id: 'inbox', label: 'Inbox', icon: InboxIcon, show: true, badge: unreadCount },
    { id: 'profile', label: 'Profil', icon: UserCircle, show: true, badge: 0 },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all flex-1 min-w-0 relative',
                isActive
                  ? 'bg-primary text-primary-foreground scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'animate-bounce-subtle')} />
                {item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
