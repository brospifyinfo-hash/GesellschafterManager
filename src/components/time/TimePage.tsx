import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TimeEntriesList } from './TimeEntriesList'
import { ManualTimeDialog } from './ManualTimeDialog'

export function TimePage() {
  const { user } = useAuth()
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)

  if (!user) return null
  
  // Hide time account from this page
  if (user.isTimeAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Diese Seite ist für reguläre Benutzer</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zeiterfassung</h2>
          <p className="text-muted-foreground">
            Übersicht aller erfassten Arbeitszeiten – nachträglich eingetragene Stunden
            sind als „Nachgetragen“ markiert
          </p>
        </div>
        {user.isAdmin && (
          <Button onClick={() => setIsManualDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Zeit nachtragen
          </Button>
        )}
      </div>

      <TimeEntriesList />

      <ManualTimeDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
      />
    </div>
  )
}
