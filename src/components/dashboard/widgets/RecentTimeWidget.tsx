import { useAuth } from '@/hooks/useAuth'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { Card } from '@/components/ui/card'
import { Clock, ArrowRight } from 'lucide-react'
import { formatDateTime } from '@/lib/calculations'

export function RecentTimeWidget({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth()
  const { timeEntries } = useTimeEntries()

  if (!user) return null

  const userEntries = timeEntries
    .filter((e) => e.user_code === user.code)
    .slice(0, 3)

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <Card className="glass apple-shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-muted-foreground">Letzte Zeiteinträge</h3>
        </div>
        <button
          onClick={() => onNavigate('time')}
          className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          Alle <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {userEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Zeiteinträge vorhanden
          </p>
        ) : (
          userEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Check-in</p>
                {entry.duration_minutes && (
                  <p className="text-sm font-bold">{formatDuration(entry.duration_minutes)}</p>
                )}
              </div>
              <p className="text-sm">{formatDateTime(entry.check_in)}</p>
              {entry.check_out && (
                <p className="text-xs text-muted-foreground mt-1">
                  bis {formatDateTime(entry.check_out).split(' ')[1]}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
