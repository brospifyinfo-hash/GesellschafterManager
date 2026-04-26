import { useAccounts } from '@/hooks/useAccounts'
import { useAuth } from '@/hooks/useAuth'
import { useRevenue } from '@/hooks/useRevenue'
import { WithdrawalDialog } from './WithdrawalDialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, Download, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'
import { USERS } from '@/constants/users'
import { useState } from 'react'

export function AccountsPage() {
  const { user } = useAuth()
  const { accounts } = useAccounts()
  const { distributions } = useRevenue()
  const [withdrawalDialog, setWithdrawalDialog] = useState(false)

  // Exclude ZEIT account from display
  const regularUsers = USERS.filter((u) => u.code !== 'ZEIT' && !u.isTimeAccount)

  const getUserAccount = (userCode: string) => {
    return accounts.find((a) => a.user_code === userCode)
  }

  const getUserColor = (userCode: string) => {
    return USERS.find((u) => u.code === userCode)?.color || 'devid'
  }



  // Calculate reserve requirement: All "Frei verfügbar" + 15% of 45% from total revenue
  const totalFreeAvailable = accounts
    .filter((a) => regularUsers.find((u) => u.code === a.user_code))
    .reduce((sum, a) => sum + Number(a.free_available), 0)
  
  const totalDistributable = distributions.reduce((sum, d) => sum + Number(d.distributable), 0)
  const reserveRequirement = totalFreeAvailable + (totalDistributable * 0.15)

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Konten</h1>
        <p className="text-sm md:text-base text-muted-foreground">Kontostände und Auszahlungen verwalten</p>
      </div>

      {/* Summary Cards */}
      {user?.isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Wallet className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Gesamt privat (20%)
                </p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {formatCurrency(totalFreeAvailable)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Alle Konten zusammen
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Wallet className="h-12 w-12 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Gesamt Firmen (80%)</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {formatCurrency(
                    accounts
                      .filter((a) => regularUsers.find((u) => u.code === a.user_code))
                      .reduce((sum, a) => sum + Number(a.company_account), 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Alle Konten zusammen
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Einlagensicherung</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {formatCurrency(reserveRequirement)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  20% + 15% der Verteilung
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Wallet className="h-12 w-12 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Gesamt verdient</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {formatCurrency(
                    accounts
                      .filter((a) => regularUsers.find((u) => u.code === a.user_code))
                      .reduce((sum, a) => sum + Number(a.total_earned), 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Alle Konten (100%)
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* User Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {regularUsers.map((u) => {
          const account = getUserAccount(u.code)
          const showDetails = user?.isAdmin || user?.code === u.code

          if (!showDetails) return null

          return (
            <Card key={u.code} className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-3 w-3 rounded-full bg-user-${u.color}`} />
                <h3 className="text-xl font-semibold">{u.name}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Frei verfügbar (20%)</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    {formatCurrency(account?.free_available || 0)}
                  </p>
                </div>

                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Privates Firmenkonto (80%)
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    {formatCurrency(account?.company_account || 0)}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Insgesamt verdient</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(account?.total_earned || 0)}
                  </p>
                </div>

                {user?.isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setWithdrawalDialog(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Auszahlung verarbeiten
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Withdrawal Dialog */}
      <WithdrawalDialog open={withdrawalDialog} onOpenChange={setWithdrawalDialog} />
    </div>
  )
}
