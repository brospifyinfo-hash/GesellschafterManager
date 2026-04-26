import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { Card } from '@/components/ui/card'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { getOutstandingAmount, formatCurrency } from '@/lib/calculations'
import { UserCode } from '@/constants/users'

export function OutstandingPaymentsWidget({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth()
  const { expenses } = useExpenses()

  if (!user) return null

  const outstandingAmount = getOutstandingAmount(expenses, user.code as UserCode)

  if (outstandingAmount === 0) return null

  return (
    <Card className="glass apple-shadow p-4 border-destructive/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <h3 className="font-semibold text-sm text-destructive">Offene Zahlungen</h3>
        </div>
        <button
          onClick={() => onNavigate('expenses')}
          className="text-xs text-destructive font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          Bezahlen <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="p-4 rounded-lg bg-destructive/5 text-center">
        <p className="text-xs text-muted-foreground mb-1">Noch zu bezahlen</p>
        <p className="text-3xl font-bold text-destructive">{formatCurrency(outstandingAmount)}</p>
      </div>
    </Card>
  )
}
