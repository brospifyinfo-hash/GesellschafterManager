import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USERS } from '@/constants/users'
import { History } from 'lucide-react'

interface ManualTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManualTimeDialog({ open, onOpenChange }: ManualTimeDialogProps) {
  const { user } = useAuth()
  const { addManualTime } = useTimeEntries()
  const [userCode, setUserCode] = useState('')
  const [hours, setHours] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user?.isAdmin) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    addManualTime(
      {
        user_code: userCode,
        hours: parseFloat(hours),
        added_by: user.code,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          setUserCode('')
          setHours('')
          setReason('')
          onOpenChange(false)
        },
        onSettled: () => setIsSubmitting(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Zeit nachtragen</DialogTitle>
          <DialogDescription>
            Tragen Sie Stunden nachträglich für einen Gesellschafter ein
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <History className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Der Eintrag wird überall sichtbar als <strong>„Nachgetragen“</strong> markiert –
            mit deinem Namen, Zeitpunkt und Grund.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Gesellschafter</Label>
            <Select value={userCode} onValueChange={setUserCode} required>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie einen Gesellschafter" />
              </SelectTrigger>
              <SelectContent>
                {USERS.map((u) => (
                  <SelectItem key={u.code} value={u.code}>
                    {u.name} ({u.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Stunden</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0"
              placeholder="z.B. 100"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Grund der Nachtragung</Label>
            <Textarea
              id="reason"
              placeholder="z.B. Einchecken vergessen, Arbeit vor Ort, Projekt XYZ"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Der Grund wird zusammen mit der Markierung angezeigt.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird nachgetragen...' : 'Nachtragen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
