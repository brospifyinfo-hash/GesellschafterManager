import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useAccounts } from '@/hooks/useAccounts'
import { useProfile } from '@/hooks/useProfile'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Expense } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/calculations'
import { triggerConfetti } from '@/lib/confetti'
import { Pencil, Trash2, Eye, Star } from 'lucide-react'
import { USERS } from '@/constants/users'
import { toast } from 'sonner'
import { EditExpenseDialog } from './EditExpenseDialog'
import { ReceiptDialog } from './ReceiptDialog'
import { ExpenseDetailDialog } from './ExpenseDetailDialog'
import { PaymentProofDialog } from './PaymentProofDialog'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ExpenseListProps {
  expenses: Expense[]
  isLoading: boolean
}

export function ExpenseList({ expenses, isLoading }: ExpenseListProps) {
  const { user } = useAuth()
  const { updateExpense, deleteExpense } = useExpenses()
  const { accounts, updateAccount } = useAccounts()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [viewingDetail, setViewingDetail] = useState<Expense | null>(null)
  const [viewingReceipt, setViewingReceipt] = useState<Expense | null>(null)
  const [paymentSourceDialog, setPaymentSourceDialog] = useState<{
    expense: Expense
    userCode: string
    currentStatus: boolean
  } | null>(null)
  const [paymentProofDialog, setPaymentProofDialog] = useState<{
    expense: Expense
    userCode: string
    source: 'personal' | 'company'
  } | null>(null)

  if (!user) return null

  const handleTogglePayment = (expense: Expense, userCode: string) => {
    const fieldMap: Record<string, keyof Expense> = {
      DK: 'devid_paid',
      LS: 'lukas_paid',
      DF: 'dennis_paid',
      EM: 'david_paid',
    }

    const field = fieldMap[userCode]
    const currentStatus = expense[field]

    // If unchecking, just update directly
    if (currentStatus) {
      // Check if payment was from company account
      const sourceFieldMap: Record<string, keyof Expense> = {
        DK: 'devid_payment_source',
        LS: 'lukas_payment_source',
        DF: 'dennis_payment_source',
        DM: 'david_payment_source',
      }
      const sourceField = sourceFieldMap[userCode]
      const paymentSource = expense[sourceField]

      // If paid from company account, refund it
      if (paymentSource === 'company') {
        const account = accounts.find((a) => a.user_code === userCode)
        if (account) {
          // Count how many users paid
          const paidCount = [
            expense.devid_paid,
            expense.dennis_paid,
            expense.lukas_paid,
            expense.david_paid,
          ].filter(Boolean).length

          const amountToRefund = expense.total_amount / paidCount

          updateAccount({
            userCode,
            companyAccount: account.company_account + amountToRefund,
          })
        }
      }

      updateExpense({
        id: expense.id,
        [field]: false,
        [sourceField]: null,
      })
    } else {
      // If checking, show payment source dialog FIRST
      setPaymentSourceDialog({
        expense,
        userCode,
        currentStatus,
      })
    }
  }

  const handlePaymentSourceSelection = (source: 'personal' | 'company') => {
    if (!paymentSourceDialog) return

    const { expense, userCode } = paymentSourceDialog
    
    // Close source dialog and open payment proof dialog
    setPaymentSourceDialog(null)
    setPaymentProofDialog({ expense, userCode, source })
  }

  const handlePaymentProofUpload = async (file: File) => {
    if (!paymentProofDialog) return

    const { expense, userCode, source } = paymentProofDialog

    const fieldMap: Record<string, keyof Expense> = {
      DK: 'devid_paid',
      LS: 'lukas_paid',
      DF: 'dennis_paid',
      EM: 'david_paid',
    }

    const sourceFieldMap: Record<string, keyof Expense> = {
      DK: 'devid_payment_source',
      LS: 'lukas_payment_source',
      DF: 'dennis_payment_source',
      EM: 'david_payment_source',
    }

    const field = fieldMap[userCode]
    const sourceField = sourceFieldMap[userCode]

    try {
      // Upload payment proof to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `payment_proof_${expense.id}_${userCode}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      // Store payment proof reference in expense
      const currentProofs = expense.payment_proofs || {}
      const updatedProofs = {
        ...currentProofs,
        [userCode]: {
          url: urlData.publicUrl,
          uploaded_at: new Date().toISOString(),
          filename: file.name,
        }
      }

      // If company account, check if enough balance
      if (source === 'company') {
        const account = accounts.find((a) => a.user_code === userCode)
        if (!account) {
          toast.error('Konto nicht gefunden')
          setPaymentProofDialog(null)
          return
        }

        // Calculate amount - if others already paid, split accordingly
        const paidCount = [
          expense.devid_paid,
          expense.dennis_paid,
          expense.lukas_paid,
          expense.david_paid,
        ].filter(Boolean).length

        const amountToPay = expense.total_amount / (paidCount + 1)

        if (account.company_account < amountToPay) {
          toast.error(
            `Nicht genügend Guthaben auf dem Firmenkonto. Verfügbar: ${formatCurrency(
              account.company_account
            )}, Benötigt: ${formatCurrency(amountToPay)}`
          )
          setPaymentProofDialog(null)
          return
        }

        // Deduct from company account
        updateAccount({
          userCode,
          companyAccount: account.company_account - amountToPay,
        })
      }

      // Update expense with payment status AND proof
      await updateExpense({
        id: expense.id,
        [field]: true,
        [sourceField]: source,
        payment_proofs: updatedProofs,
      })

      // Trigger confetti animation
      triggerConfetti()
      toast.success('🎉 Zahlung mit Beleg bestätigt!')

      setPaymentProofDialog(null)
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Hochladen des Zahlungsbelegs')
      throw error
    }
  }

  const handleDelete = (expense: Expense) => {
    if (!user.isAdmin) {
      toast.error('Nur der Administrator kann Ausgaben löschen')
      return
    }

    if (confirm('Möchten Sie diese Ausgabe wirklich löschen?')) {
      deleteExpense({ id: expense.id, deletedBy: user.code })
    }
  }

  if (isLoading) {
    return (
      <Card className="glass apple-shadow p-8 text-center">
        <p className="text-muted-foreground">Lade Ausgaben...</p>
      </Card>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card className="glass apple-shadow p-8 text-center">
        <p className="text-muted-foreground">Noch keine Ausgaben vorhanden</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {expenses.map((expense) => {
          const creatorUser = USERS.find((u) => u.code === expense.created_by)
          
          return (
            <Card key={expense.id} className="glass apple-shadow p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{expense.description}</h3>
                      {expense.is_favorite && (
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-2">
                      <span>Erstellt: {formatDateTime(expense.created_at)}</span>
                      {creatorUser && (
                        <span className={`px-2 py-0.5 rounded bg-user-${creatorUser.color}/10`}>
                          von {creatorUser.name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {expense.category && (
                        <Badge variant="secondary">{expense.category}</Badge>
                      )}
                      {expense.tags?.map((tag) => (
                        <Badge key={tag} variant="outline">#{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(expense.total_amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(expense.amount_per_person)} pro Person
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {USERS.filter((u) => u.code !== 'ZEIT').map((u) => {
                    const fieldMap: Record<string, keyof Expense> = {
                      DK: 'devid_paid',
                      LS: 'lukas_paid',
                      DF: 'dennis_paid',
                      EM: 'david_paid',
                    }
                    const isPaid = expense[fieldMap[u.code]]

                    return (
                      <div
                        key={u.code}
                        className={`glass p-3 rounded-lg border ${
                          isPaid ? `bg-${u.color}/10 border-${u.color}/30` : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isPaid}
                            disabled={expense.created_by !== user.code && !user.isAdmin}
                            onCheckedChange={() => {
                              if (expense.created_by !== user.code && !user.isAdmin) {
                                toast.error('Nur der Ersteller oder Admin kann Zahlungen markieren')
                                return
                              }
                              handleTogglePayment(expense, u.code)
                            }}
                          />
                          <span className="text-sm font-medium">{u.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {isPaid ? (
                            <span>
                              {(() => {
                                const sourceFieldMap: Record<string, keyof Expense> = {
                                  DK: 'devid_payment_source',
                                  LS: 'lukas_payment_source',
                                  DF: 'dennis_payment_source',
                                  EM: 'david_payment_source',
                                }
                                const source = expense[sourceFieldMap[u.code]]
                                return source === 'company' ? 'Firmenkonto' : 'Privat'
                              })()}
                            </span>
                          ) : (
                            'Ausstehend'
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingDetail(expense)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Details anzeigen
                  </Button>
                  
                  {user.isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingExpense(expense)}
                        className="gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(expense)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Löschen
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
        />
      )}

      {viewingDetail && (
        <ExpenseDetailDialog
          expense={viewingDetail}
          open={!!viewingDetail}
          onOpenChange={(open) => !open && setViewingDetail(null)}
        />
      )}

      {viewingReceipt && (
        <ReceiptDialog
          expense={viewingReceipt}
          open={!!viewingReceipt}
          onOpenChange={(open) => !open && setViewingReceipt(null)}
        />
      )}

      {/* Payment Source Selection Dialog */}
      {paymentSourceDialog && (
        <Dialog open={!!paymentSourceDialog} onOpenChange={() => setPaymentSourceDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zahlungsquelle wählen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Wie wurde diese Ausgabe bezahlt?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handlePaymentSourceSelection('personal')}
                  className="h-24 flex flex-col gap-2"
                  variant="outline"
                >
                  <span className="text-lg">💰</span>
                  <span>Privat</span>
                </Button>
                <Button
                  onClick={() => handlePaymentSourceSelection('company')}
                  className="h-24 flex flex-col gap-2"
                  variant="outline"
                >
                  <span className="text-lg">🏢</span>
                  <span>Firmenkonto</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Proof Upload Dialog */}
      {paymentProofDialog && (
        <PaymentProofDialog
          open={!!paymentProofDialog}
          onOpenChange={(open) => {
            if (!open) setPaymentProofDialog(null)
          }}
          onConfirm={handlePaymentProofUpload}
          payerName={USERS.find(u => u.code === paymentProofDialog.userCode)?.name || ''}
        />
      )}
    </>
  )
}
