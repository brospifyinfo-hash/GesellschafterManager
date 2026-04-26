import { useExpenses } from '@/hooks/useExpenses'
import { Card } from '@/components/ui/card'
import { Receipt, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/calculations'

export function RecentExpensesWidget({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { expenses } = useExpenses()

  const recentExpenses = expenses.slice(0, 3)

  return (
    <Card className="glass apple-shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-muted-foreground">Letzte Ausgaben</h3>
        </div>
        <button
          onClick={() => onNavigate('expenses')}
          className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          Alle <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {recentExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Ausgaben vorhanden
          </p>
        ) : (
          recentExpenses.map((expense) => (
            <div
              key={expense.id}
              className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium line-clamp-1">{expense.description}</p>
                <p className="text-sm font-bold ml-2">{formatCurrency(expense.total_amount)}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{expense.created_by}</span>
                <span>{formatDateTime(expense.created_at).split(',')[0]}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
