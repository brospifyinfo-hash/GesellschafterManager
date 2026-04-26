import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock, BarChart3, FileDown, Calendar, TrendingUp, Archive } from 'lucide-react'

export function QuickActionsWidget({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth()

  if (!user) return null

  const actions = [
    { id: 'expenses', label: 'Ausgabe', icon: Plus, page: 'expenses', show: true },
    { id: 'time', label: 'Zeit', icon: Clock, page: 'time', show: true },
    { id: 'analytics', label: 'Analyse', icon: BarChart3, page: 'analytics', show: true },
    { id: 'archive', label: 'Archiv', icon: Archive, page: 'archive', show: true },
    { id: 'export', label: 'Export', icon: FileDown, page: 'export', show: true },
    { id: 'subscriptions', label: 'Abos', icon: Calendar, page: 'subscriptions', show: user.isAdmin },
    { id: 'revenue', label: 'Umsatz', icon: TrendingUp, page: 'revenue', show: user.isAdmin },
  ].filter((a) => a.show)

  return (
    <Card className="glass apple-shadow p-4">
      <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Schnellzugriff</h3>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.id}
              variant="outline"
              onClick={() => onNavigate(action.page)}
              className="h-auto flex-col gap-2 py-3"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}
