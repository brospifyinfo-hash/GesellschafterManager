import { useReturns } from '@/hooks/useReturns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, ArrowRight, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'

interface ReturnsWidgetProps {
  onNavigate: (page: string) => void
}

export function ReturnsWidget({ onNavigate }: ReturnsWidgetProps) {
  const { returns } = useReturns()

  const pendingReturns = returns.filter((r) => r.status === 'pending')
  const totalPending = pendingReturns.reduce((sum, r) => sum + r.amount, 0)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <h3 className="font-semibold">Retouren</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('returns')}
          className="gap-1"
        >
          Alle <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-3">
        {pendingReturns.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Keine ausstehenden Retouren</p>
          </div>
        ) : (
          <>
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Offene Retouren</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingReturns.length} Retoure{pendingReturns.length !== 1 ? 'n' : ''} ausstehend
              </p>
            </div>
            <div className="space-y-2">
              {pendingReturns.slice(0, 3).map((returnItem) => (
                <div
                  key={returnItem.id}
                  className="p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => onNavigate('returns')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">#{returnItem.order_number}</span>
                    <Badge variant="destructive" className="bg-orange-500">
                      -{formatCurrency(returnItem.amount)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {pendingReturns.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{pendingReturns.length - 3} weitere
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
