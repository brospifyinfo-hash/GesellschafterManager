import { useAuth } from '@/hooks/useAuth'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Clock } from 'lucide-react'
import { formatDateTime, formatHours } from '@/lib/calculations'
import { USERS } from '@/constants/users'
import { toast } from 'sonner'

export function TimeEntriesList() {
  const { user } = useAuth()
  const { timeEntries, manualEntries, isLoading, deleteTimeEntry, deleteManualEntry } = useTimeEntries()

  if (!user) return null

  const handleDelete = (id: string, isManual: boolean) => {
    if (!user.isAdmin) {
      toast.error('Nur der Administrator kann Einträge löschen')
      return
    }

    if (confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      if (isManual) {
        deleteManualEntry(id)
      } else {
        deleteTimeEntry(id)
      }
    }
  }

  // Calculate total hours per user
  const userTotals = USERS.reduce((acc, u) => {
    const regularMinutes = timeEntries
      .filter(e => e.user_code === u.code && e.duration_minutes)
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
    
    const manualHours = manualEntries
      .filter(e => e.user_code === u.code)
      .reduce((sum, e) => sum + e.hours, 0)
    
    acc[u.code] = (regularMinutes / 60) + manualHours
    return acc
  }, {} as Record<string, number>)

  if (isLoading) {
    return (
      <Card className="glass apple-shadow p-8 text-center">
        <p className="text-muted-foreground">Lade Zeiteinträge...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Hours Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {USERS.map((u) => (
          <Card key={u.code} className="glass apple-shadow p-4">
            <div className={`w-8 h-8 rounded-full bg-${u.color} text-white flex items-center justify-center text-sm font-semibold mb-2`}>
              {u.code}
            </div>
            <p className="text-sm text-muted-foreground">{u.name}</p>
            <p className="text-xl font-bold">{formatHours(userTotals[u.code])}</p>
          </Card>
        ))}
      </div>

      {/* Time Entries List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alle Einträge</h3>
        
        {timeEntries.length === 0 && manualEntries.length === 0 ? (
          <Card className="glass apple-shadow p-8 text-center">
            <p className="text-muted-foreground">Noch keine Zeiteinträge vorhanden</p>
          </Card>
        ) : (
          <>
            {/* Regular Time Entries */}
            {timeEntries.map((entry) => {
              const entryUser = USERS.find((u) => u.code === entry.user_code)
              
              return (
                <Card key={entry.id} className="glass apple-shadow p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {entryUser && (
                        <div className={`w-10 h-10 rounded-full bg-${entryUser.color} text-white flex items-center justify-center font-semibold`}>
                          {entryUser.code}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{entryUser?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(entry.check_in)}
                          {entry.check_out && ` - ${formatDateTime(entry.check_out)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {entry.duration_minutes ? (
                        <div className="text-right">
                          <p className="font-bold">{formatHours(entry.duration_minutes / 60)}</p>
                          <Badge variant="secondary">Abgeschlossen</Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3 animate-pulse" />
                          Aktiv
                        </Badge>
                      )}
                      
                      {user.isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id, false)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}

            {/* Manual Time Entries */}
            {manualEntries.map((entry) => {
              const entryUser = USERS.find((u) => u.code === entry.user_code)
              const addedByUser = USERS.find((u) => u.code === entry.added_by)
              
              return (
                <Card key={entry.id} className="glass apple-shadow p-6 border-dashed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {entryUser && (
                        <div className={`w-10 h-10 rounded-full bg-${entryUser.color} text-white flex items-center justify-center font-semibold`}>
                          {entryUser.code}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{entryUser?.name}</p>
                          <Badge variant="outline">Manuell</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Hinzugefügt am {formatDateTime(entry.created_at)} von {addedByUser?.name}
                        </p>
                        {entry.reason && (
                          <p className="text-sm text-muted-foreground italic">
                            Grund: {entry.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="font-bold text-lg">{formatHours(entry.hours)}</p>
                      
                      {user.isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id, true)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
