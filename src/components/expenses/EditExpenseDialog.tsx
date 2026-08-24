import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { USERS } from '@/constants/users'
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
import { Expense, SplitPayment } from '@/types'
import { Plus, Trash2, Users, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EditExpenseDialogProps {
  expense: Expense
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditExpenseDialog({ expense, open, onOpenChange }: EditExpenseDialogProps) {
  const { user } = useAuth()
  const { updateExpense } = useExpenses()
  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(expense.total_amount.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Split Payment State
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>(
    expense.split_payments || []
  )

  const activeUsers = USERS.filter(u => !u.isTimeAccount)
  
  // Check if current user can edit split payments (only admin or creator)
  const canEditSplitPayments = user?.isAdmin || user?.code === expense.created_by

  useEffect(() => {
    setDescription(expense.description)
    setAmount(expense.total_amount.toString())
    setSplitPayments(expense.split_payments || [])
  }, [expense])

  const addSplitPayer = () => {
    const usedCodes = splitPayments.map(sp => sp.user_code)
    const availableUsers = activeUsers.filter(u => !usedCodes.includes(u.code))
    
    if (availableUsers.length === 0) {
      toast.error('Alle Benutzer sind bereits hinzugefügt')
      return
    }

    // Add first available user by default
    const totalAmount = parseFloat(amount) || 0
    const newPercentage = 50 // Default 50%
    const newAmount = (totalAmount * newPercentage) / 100

    setSplitPayments([
      ...splitPayments,
      {
        user_code: availableUsers[0].code,
        percentage: newPercentage,
        amount: newAmount
      }
    ])
  }

  const removeSplitPayer = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index))
  }

  const updateSplitPayer = (index: number, field: 'user_code' | 'percentage', value: string | number) => {
    const totalAmount = parseFloat(amount) || 0
    const updated = [...splitPayments]
    
    if (field === 'user_code') {
      updated[index].user_code = value as string
    } else if (field === 'percentage') {
      const percentage = parseFloat(value as string) || 0
      updated[index].percentage = percentage
      updated[index].amount = (totalAmount * percentage) / 100
    }
    
    setSplitPayments(updated)
  }

  const totalSplitPercentage = splitPayments.reduce((sum, sp) => sum + sp.percentage, 0)
  const isValidSplit = splitPayments.length === 0 || Math.abs(totalSplitPercentage - 100) < 0.01

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (splitPayments.length > 0 && !isValidSplit) {
      toast.error('Die Prozentsätze müssen zusammen 100% ergeben!')
      return
    }

    setIsSubmitting(true)

    try {
      const totalAmount = parseFloat(amount)
      await updateExpense({
        id: expense.id,
        description,
        total_amount: totalAmount,
        amount_per_person: totalAmount / 4,
        split_payments: splitPayments.length > 0 ? splitPayments : null,
        // Bearbeitung markieren, damit für alle sichtbar ist, wer geändert hat
        edited_at: new Date().toISOString(),
        edited_by: user?.code ?? null,
        edited_by_admin: !!user?.isAdmin,
      })
      onOpenChange(false)
      toast.success('Ausgabe aktualisiert!')
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Fehler beim Aktualisieren')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ausgabe bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Details und Split-Zahlungen dieser Ausgabe
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-700 dark:text-orange-300">
          <Pencil className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Diese Ausgabe wird nach dem Speichern sichtbar als
            {user?.isAdmin ? ' „Vom Admin bearbeitet“' : ' „Bearbeitet“'} markiert &ndash; mit
            Name und Zeitpunkt.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-description">Beschreibung</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Gesamtbetrag (€)</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {amount && splitPayments.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Pro Person: {(parseFloat(amount) / 4).toFixed(2)} €
              </p>
            )}
          </div>

          {/* Split Payment Section - Only for Admin or Creator */}
          {canEditSplitPayments && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Split-Zahlungen (Optional)</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSplitPayer}
                className="gap-2"
                disabled={splitPayments.length >= activeUsers.length}
              >
                <Plus className="w-4 h-4" />
                Zahler hinzufügen
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              💡 Wenn mehrere Personen die Rechnung bezahlen, definieren Sie hier wer wie viel zahlt.
              Die anderen schulden dann entsprechend anteilig.
            </p>

            {splitPayments.length > 0 && (
              <div className="space-y-3">
                {splitPayments.map((split, index) => {
                  const user = activeUsers.find(u => u.code === split.user_code)
                  return (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Select
                            value={split.user_code}
                            onValueChange={(value) => updateSplitPayer(index, 'user_code', value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {activeUsers
                                .filter(u => {
                                  // Show current selection + users not in other splits
                                  const otherSplits = splitPayments.filter((_, i) => i !== index)
                                  return u.code === split.user_code || !otherSplits.find(s => s.user_code === u.code)
                                })
                                .map(u => (
                                <SelectItem key={u.code} value={u.code}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-user-${u.color}`}></div>
                                    {u.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={split.percentage}
                              onChange={(e) => updateSplitPayer(index, 'percentage', e.target.value)}
                              className="w-20"
                            />
                            <span className="text-sm">%</span>
                            <span className="text-sm font-semibold ml-2">
                              = {split.amount.toFixed(2)} €
                            </span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSplitPayer(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}

                {/* Summary */}
                <Card className={`p-4 ${isValidSplit ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Gesamt:</span>
                    <span className={`text-lg font-bold ${isValidSplit ? 'text-green-600' : 'text-orange-600'}`}>
                      {totalSplitPercentage.toFixed(1)}%
                    </span>
                  </div>
                  {!isValidSplit && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Muss 100% ergeben!
                    </p>
                  )}
                </Card>

                {/* Example Calculation */}
                {isValidSplit && splitPayments.length > 0 && (
                  <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                    <p className="text-xs font-semibold mb-2">📊 Beispiel-Aufteilung:</p>
                    <div className="space-y-1 text-xs">
                      {splitPayments.map(sp => {
                        const user = activeUsers.find(u => u.code === sp.user_code)
                        return (
                          <div key={sp.user_code} className="flex justify-between">
                            <span>✅ {user?.name} zahlt:</span>
                            <span className="font-semibold">{sp.amount.toFixed(2)} €</span>
                          </div>
                        )
                      })}
                      <div className="border-t pt-1 mt-2">
                        {activeUsers.filter(u => !splitPayments.find(sp => sp.user_code === u.code)).map(nonPayer => {
                          const owedTotal = parseFloat(amount) / 4
                          return (
                            <div key={nonPayer.code} className="text-orange-600">
                              <p className="font-semibold">💸 {nonPayer.name} schuldet jedem Zahler:</p>
                              {splitPayments.map(sp => {
                                const payer = activeUsers.find(u => u.code === sp.user_code)
                                const owedAmount = (sp.amount / 4)
                                return (
                                  <div key={sp.user_code} className="flex justify-between ml-2">
                                    <span>→ an {payer?.name}:</span>
                                    <span className="font-semibold">{owedAmount.toFixed(2)} €</span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
          )}

          {!canEditSplitPayments && splitPayments.length > 0 && (
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-2">
                📊 Split-Zahlungen (nur für Admin/Ersteller bearbeitbar):
              </p>
              {splitPayments.map(sp => {
                const user = activeUsers.find(u => u.code === sp.user_code)
                return (
                  <div key={sp.user_code} className="text-sm">
                    {user?.name}: {sp.percentage}% ({sp.amount.toFixed(2)} €)
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValidSplit}>
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
