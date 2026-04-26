import { useProfile } from '@/hooks/useProfile'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Building2, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'
import { toast } from 'sonner'

interface DebtDetail {
  userCode: string
  userName: string
  userColor: string
  privateDebt: number
  companyDebt: number
}

interface DebtDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: DebtDetail | null
}

export function DebtDetailDialog({ open, onOpenChange, debt }: DebtDetailDialogProps) {
  if (!debt) return null

  const { profile } = useProfile(debt.userCode)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} kopiert!`)
  }

  const totalDebt = debt.privateDebt + debt.companyDebt

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full bg-user-${debt.userColor}`} />
            Schulden an {debt.userName}
          </DialogTitle>
          <DialogDescription>
            Zahlungsinformationen für deine offenen Schulden
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-muted-foreground mb-1">Gesamt ausstehend</p>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
          </div>

          {/* Private Debt */}
          {debt.privateDebt > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">Privates Konto</h3>
                  <Badge className="ml-auto bg-green-600">{formatCurrency(debt.privateDebt)}</Badge>
                </div>
                
                <div className="space-y-2">
                  {profile?.paypal && (
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">💳 PayPal</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background px-3 py-1.5 rounded border">
                          {profile.paypal}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(profile.paypal!, 'PayPal')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {profile?.iban && (
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">🏦 IBAN</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background px-3 py-1.5 rounded border">
                          {profile.iban}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(profile.iban!, 'IBAN')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Company Debt */}
          {debt.companyDebt > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Firmenkonto</h3>
                  <Badge className="ml-auto bg-blue-600">{formatCurrency(debt.companyDebt)}</Badge>
                </div>
                
                <div className="space-y-2">
                  {profile?.company_paypal && (
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">🏢 Firmen-PayPal</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background px-3 py-1.5 rounded border">
                          {profile.company_paypal}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(profile.company_paypal!, 'Firmen-PayPal')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {profile?.company_iban && (
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">🏦 Firmen-IBAN</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background px-3 py-1.5 rounded border">
                          {profile.company_iban}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(profile.company_iban!, 'Firmen-IBAN')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-xs">
              💡 <strong>Hinweis:</strong> Bitte überweise den entsprechenden Betrag auf das jeweilige Konto und lade einen Zahlungsbeleg in der Ausgaben-Detailansicht hoch.
            </p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
