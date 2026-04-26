import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useProfile } from '@/hooks/useProfile'
import { USERS } from '@/constants/users'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/calculations'
import { AlertCircle, Wallet, Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Expense } from '@/types'
import { DebtDetailDialog } from './DebtDetailDialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function DebtSummary() {
  const { user } = useAuth()
  const { expenses = [] } = useExpenses()
  const [selectedDebt, setSelectedDebt] = useState<any>(null)
  const [expandedDebts, setExpandedDebts] = useState<string[]>([])

  // Load all payment methods (both paypal and iban)
  const { profile: dkProfile } = useProfile('DK')
  const { profile: lsProfile } = useProfile('LS')
  const { profile: dfProfile } = useProfile('DF')
  const { profile: emProfile } = useProfile('EM')

  const paymentMethods = {
    DK: { paypal: dkProfile?.paypal, iban: dkProfile?.iban },
    LS: { paypal: lsProfile?.paypal, iban: lsProfile?.iban },
    DF: { paypal: dfProfile?.paypal, iban: dfProfile?.iban },
    EM: { paypal: emProfile?.paypal, iban: emProfile?.iban },
  }

  if (!user) return null

  const activeUsers = USERS.filter(u => !u.isTimeAccount)

  // Calculate debts with split payment support AND private/company separation
  const debtsToOthers = activeUsers
    .filter(u => u.code !== user.code)
    .map(otherUser => {
      let totalPrivateOwed = 0
      let totalCompanyOwed = 0
      const detailedExpenses: Array<{
        expense: Expense
        amount: number
        type: 'private' | 'company'
      }> = []

      expenses.forEach((expense: Expense) => {
        const userCodeToPaidField: Record<string, keyof Expense> = {
          'DK': 'devid_paid',
          'LS': 'lukas_paid',
          'DF': 'dennis_paid',
          'EM': 'david_paid',
        }
        
        const paidField = userCodeToPaidField[user.code]
        const isPaid = paidField && expense[paidField]

        // Skip if already paid
        if (isPaid) return

        // Determine if this debt is private or company
        const isCompanyPayment = expense.payment_type === 'company'
        const type = isCompanyPayment ? 'company' : 'private'

        // Check if expense has split payments
        if (expense.split_payments && expense.split_payments.length > 0) {
          // Check if otherUser is one of the split payers
          const splitPayer = expense.split_payments.find(sp => sp.user_code === otherUser.code)
          
          if (splitPayer) {
            // Current user is NOT a payer, so they owe a portion to this split payer
            // Calculate: How many users are NOT split payers?
            const paidUserCodes = expense.split_payments.map(sp => sp.user_code)
            const numNonPayers = 4 - paidUserCodes.length
            
            // Only if current user is NOT in the paid list
            if (numNonPayers > 0 && !paidUserCodes.includes(user.code)) {
              const owedToThisPayer = splitPayer.amount / numNonPayers
              
              if (isCompanyPayment) {
                totalCompanyOwed += owedToThisPayer
              } else {
                totalPrivateOwed += owedToThisPayer
              }

              detailedExpenses.push({
                expense,
                amount: owedToThisPayer,
                type,
              })
            }
          }
        } else {
          // Legacy: single payer system
          if (expense.created_by === otherUser.code) {
            const amount = expense.amount_per_person
            if (isCompanyPayment) {
              totalCompanyOwed += amount
            } else {
              totalPrivateOwed += amount
            }

            detailedExpenses.push({
              expense,
              amount,
              type,
            })
          }
        }
      })

      return {
        user: otherUser,
        privateDebt: totalPrivateOwed,
        companyDebt: totalCompanyOwed,
        totalAmount: totalPrivateOwed + totalCompanyOwed,
        paymentInfo: paymentMethods[otherUser.code as keyof typeof paymentMethods],
        detailedExpenses,
      }
    })
    .filter(debt => debt.totalAmount > 0)

  const toggleExpanded = (userCode: string) => {
    setExpandedDebts(prev =>
      prev.includes(userCode)
        ? prev.filter(code => code !== userCode)
        : [...prev, userCode]
    )
  }

  if (debtsToOthers.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-semibold mb-1">✅ Alles beglichen!</p>
          <p className="text-sm">Du hast keine offenen Zahlungen.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold">Offene Zahlungen</h3>
      </div>

      <div className="space-y-3">
        {debtsToOthers.map(debt => (
          <Card key={debt.user.code} className="p-4">
            <div className="space-y-3">
              {/* Header with user info and amount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-user-${debt.user.color} flex items-center justify-center text-white font-bold`}>
                    {debt.user.name.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{debt.user.name}</p>
                    <p className="text-xs text-muted-foreground">@{debt.user.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Du schuldest</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(debt.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Breakdown: Private vs Company */}
              <div className="grid grid-cols-2 gap-2">
                {debt.privateDebt > 0 && (
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-1 mb-1">
                      <Wallet className="w-3 h-3 text-green-600" />
                      <p className="text-xs font-medium text-green-700 dark:text-green-300">Privat</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(debt.privateDebt)}</p>
                  </div>
                )}
                {debt.companyDebt > 0 && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-1 mb-1">
                      <Building2 className="w-3 h-3 text-blue-600" />
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Firmen</p>
                    </div>
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(debt.companyDebt)}</p>
                  </div>
                )}
              </div>

              {/* Detailed Expenses Dropdown */}
              <Collapsible
                open={expandedDebts.includes(debt.user.code)}
                onOpenChange={() => toggleExpanded(debt.user.code)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    {expandedDebts.includes(debt.user.code) ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Details ausblenden
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Details anzeigen ({debt.detailedExpenses.length} Rechnungen)
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2">
                  {debt.detailedExpenses.map((item, idx) => (
                    <Card key={idx} className="p-3 bg-secondary/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-1">
                            {item.expense.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(item.expense.created_at)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm text-orange-600">
                            {formatCurrency(item.amount)}
                          </p>
                          <Badge variant={item.type === 'company' ? 'default' : 'secondary'} className="text-xs mt-1">
                            {item.type === 'company' ? '🏢 Firma' : '💰 Privat'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Action Button */}
              <Button
                onClick={() => setSelectedDebt({
                  userCode: debt.user.code,
                  userName: debt.user.name,
                  userColor: debt.user.color,
                  privateDebt: debt.privateDebt,
                  companyDebt: debt.companyDebt,
                })}
                className="w-full"
                variant="outline"
              >
                Zahlungsinformationen anzeigen
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Total Summary */}
      <Card className="p-4 bg-orange-500/10 border-orange-500/20">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Gesamt ausstehend:</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(debtsToOthers.reduce((sum, debt) => sum + debt.totalAmount, 0))}
          </p>
        </div>
      </Card>

      {/* Debt Detail Dialog */}
      <DebtDetailDialog
        open={!!selectedDebt}
        onOpenChange={(open) => !open && setSelectedDebt(null)}
        debt={selectedDebt}
      />
    </div>
  )
}
