import { Card } from '@/components/ui/card'
import { Expense } from '@/types'
import { formatCurrency, getOutstandingAmount } from '@/lib/calculations'
import { USERS } from '@/constants/users'
import { UserCode } from '@/constants/users'

interface ExpenseSummaryProps {
  expenses: Expense[]
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  // Filter out Zeit account
  const realUsers = USERS.filter(u => !u.isTimeAccount)
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total_amount, 0)
  const totalPerPerson = totalExpenses / realUsers.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="glass apple-shadow p-6">
        <p className="text-sm text-muted-foreground mb-1">Gesamtausgaben</p>
        <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
      </Card>

      {realUsers.map((user) => {
        const outstanding = getOutstandingAmount(expenses, user.code as UserCode)
        
        return (
          <Card key={user.code} className="glass apple-shadow p-6">
            <p className="text-sm text-muted-foreground mb-1">{user.name}</p>
            <p className="text-xl font-bold">{formatCurrency(totalPerPerson)}</p>
            {outstanding > 0 && (
              <p className="text-xs text-destructive mt-1">
                Offen: {formatCurrency(outstanding)}
              </p>
            )}
          </Card>
        )
      })}
    </div>
  )
}
