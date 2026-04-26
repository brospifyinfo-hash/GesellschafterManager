import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAccounts } from '@/hooks/useAccounts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USERS } from '@/constants/users'
import { formatCurrency } from '@/lib/calculations'
import { toast } from 'sonner'
import { Wallet } from 'lucide-react'

interface WithdrawalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawalDialog({ open, onOpenChange }: WithdrawalDialogProps) {
  const { user } = useAuth()
  const { accounts, createWithdrawal } = useAccounts()
  const [selectedUserCode, setSelectedUserCode] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  if (!user?.isAdmin) return null

  const activeUsers = USERS.filter((u) => !u.isTimeAccount)
  const selectedAccount = accounts.find((a) => a.user_code === selectedUserCode)

  const handleSubmit = () => {
    const amountNum = parseFloat(amount)
    if (!selectedUserCode) {
      toast.error('Bitte Benutzer auswählen')
      return
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Bitte gültigen Betrag eingeben')
      return
    }
    if (!selectedAccount) {
      toast.error('Konto nicht gefunden')
      return
    }
    if (amountNum > selectedAccount.free_available) {
      toast.error('Nicht genügend Guthaben auf dem privaten Konto')
      return
    }

    createWithdrawal({
      user_code: selectedUserCode,
      amount: amountNum,
      processed_by: user.code,
      note,
    })

    // Reset form
    setSelectedUserCode('')
    setAmount('')
    setNote('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Auszahlung durchführen
          </DialogTitle>
          <DialogDescription>
            Ziehe Guthaben vom privaten Konto eines Gesellschafters ab
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Gesellschafter *</Label>
            <Select value={selectedUserCode} onValueChange={setSelectedUserCode}>
              <SelectTrigger>
                <SelectValue placeholder="Gesellschafter auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {activeUsers.map((u) => {
                  const account = accounts.find((a) => a.user_code === u.code)
                  return (
                    <SelectItem key={u.code} value={u.code}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span className="font-medium">{u.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Verfügbar: {formatCurrency(account?.free_available || 0)}
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-sm text-muted-foreground">
                Aktuelles Guthaben: {formatCurrency(selectedAccount.free_available)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Auszahlungsbetrag (€) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="z.B. 100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {selectedAccount && amount && parseFloat(amount) > 0 && (
              <p className="text-sm text-muted-foreground">
                Nach Auszahlung:{' '}
                {formatCurrency(selectedAccount.free_available - parseFloat(amount))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notiz (optional)</Label>
            <Textarea
              placeholder="z.B. Auszahlung auf Anfrage, PayPal Transfer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm">
              💡 <strong>Hinweis:</strong> Die Auszahlung wird im Konto protokolliert und
              der Betrag wird vom privaten Konto abgezogen.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Auszahlung durchführen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
