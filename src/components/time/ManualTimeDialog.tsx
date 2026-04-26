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
          <DialogTitle>Manuelle Zeit hinzufügen</DialogTitle>
          <DialogDescription>
            Fügen Sie manuell Stunden für einen Gesellschafter hinzu
          </DialogDescription>
        </DialogHeader>

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
            <Label htmlFor="reason">Grund (optional)</Label>
            <Textarea
              id="reason"
              placeholder="z.B. Nachträgliche Erfassung, Projekt XYZ, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
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
              {isSubmitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
