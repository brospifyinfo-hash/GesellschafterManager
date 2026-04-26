import { useAuth } from '@/hooks/useAuth'
import { useAccounts } from '@/hooks/useAccounts'
import { Card } from '@/components/ui/card'
import { Wallet, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'

export function AccountBalanceWidget({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth()
  const { accounts } = useAccounts()

  if (!user) return null

  const account = accounts.find((a) => a.user_code === user.code)

  return (
    <Card className="glass apple-shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-muted-foreground">Kontostände</h3>
        </div>
        <button
          onClick={() => onNavigate('accounts')}
          className="text-xs text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          Details <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
          <p className="text-xs text-muted-foreground mb-1">Frei verfügbar (20%)</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(account?.free_available || 0)}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <p className="text-xs text-muted-foreground mb-1">Firmenkonto (80%)</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(account?.company_account || 0)}
          </p>
        </div>

        <div className="pt-2 border-t text-center">
          <p className="text-xs text-muted-foreground">Insgesamt verdient</p>
          <p className="text-lg font-semibold">
            {formatCurrency(account?.total_earned || 0)}
          </p>
        </div>
      </div>
    </Card>
  )
}
