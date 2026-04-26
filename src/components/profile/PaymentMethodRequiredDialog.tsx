import { useState, useEffect } from 'react'
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
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'

interface PaymentMethodRequiredDialogProps {
  open: boolean
  userCode: string
  onComplete: () => void
}

export function PaymentMethodRequiredDialog({
  open,
  userCode,
  onComplete,
}: PaymentMethodRequiredDialogProps) {
  const { profile } = useProfile(userCode)
  const [paypal, setPaypal] = useState('')
  const [iban, setIban] = useState('')
  const [companyPaypal, setCompanyPaypal] = useState('')
  const [companyIban, setCompanyIban] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load existing values when profile is loaded
  useEffect(() => {
    if (profile) {
      setPaypal(profile.paypal || '')
      setIban(profile.iban || '')
      setCompanyPaypal(profile.company_paypal || '')
      setCompanyIban(profile.company_iban || '')
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const missingPayPal = !paypal.trim()
    const missingIBAN = !iban.trim()
    const missingCompanyPayPal = !companyPaypal.trim()
    const missingCompanyIBAN = !companyIban.trim()

    if (missingPayPal || missingIBAN || missingCompanyPayPal || missingCompanyIBAN) {
      const missing = []
      if (missingPayPal) missing.push('Privat PayPal')
      if (missingIBAN) missing.push('Privat IBAN')
      if (missingCompanyPayPal) missing.push('Firma PayPal')
      if (missingCompanyIBAN) missing.push('Firma IBAN')
      toast.error(`Bitte ${missing.join(', ')} angeben`)
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          paypal, 
          iban,
          company_paypal: companyPaypal,
          company_iban: companyIban 
        })
        .eq('id', userCode)

      if (error) throw error

      toast.success('Zahlungsmethoden gespeichert!')
      onComplete()
    } catch (error: any) {
      console.error('Error updating payment methods:', error)
      toast.error(error.message || 'Fehler beim Speichern')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasPayPal = !!profile?.paypal?.trim()
  const hasIBAN = !!profile?.iban?.trim()
  const hasCompanyPayPal = !!profile?.company_paypal?.trim()
  const hasCompanyIBAN = !!profile?.company_iban?.trim()
  const isMissingAny = !hasPayPal || !hasIBAN || !hasCompanyPayPal || !hasCompanyIBAN

  return (
    <Dialog open={open} onOpenChange={onComplete}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Zahlungsmethoden erforderlich
          </DialogTitle>
          <DialogDescription>
            Bitte hinterlegen Sie beide Zahlungsmethoden, um die App vollständig nutzen zu können
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
              ⚠️ Alle 4 Zahlungsmethoden erforderlich!
            </p>
            <p className="text-xs text-muted-foreground">
              Bitte hinterlegen Sie sowohl private als auch geschäftliche Zahlungsmethoden (PayPal + IBAN).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-3">💰 Privat-Konto</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="paypal" className="flex items-center gap-2">
                    PayPal Email {!hasPayPal && '*'}
                    {hasPayPal && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </Label>
                  <Input
                    id="paypal"
                    type="email"
                    placeholder="privat@example.com"
                    value={paypal}
                    onChange={(e) => setPaypal(e.target.value)}
                    required={!hasPayPal}
                    disabled={hasPayPal && !!paypal}
                    className={hasPayPal ? 'bg-green-50 dark:bg-green-900/10' : ''}
                  />
                  {hasPayPal && (
                    <p className="text-xs text-green-600 dark:text-green-400">✓ Bereits hinterlegt</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban" className="flex items-center gap-2">
                    IBAN {!hasIBAN && '*'}
                    {hasIBAN && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </Label>
                  <Input
                    id="iban"
                    placeholder="DE89 3704 0044..."
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    required={!hasIBAN}
                    disabled={hasIBAN && !!iban}
                    className={hasIBAN ? 'bg-green-50 dark:bg-green-900/10' : ''}
                  />
                  {hasIBAN && (
                    <p className="text-xs text-green-600 dark:text-green-400">✓ Bereits hinterlegt</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">🏢 Firmen-Konto</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="company-paypal" className="flex items-center gap-2">
                    PayPal Email {!hasCompanyPayPal && '*'}
                    {hasCompanyPayPal && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </Label>
                  <Input
                    id="company-paypal"
                    type="email"
                    placeholder="firma@example.com"
                    value={companyPaypal}
                    onChange={(e) => setCompanyPaypal(e.target.value)}
                    required={!hasCompanyPayPal}
                    disabled={hasCompanyPayPal && !!companyPaypal}
                    className={hasCompanyPayPal ? 'bg-green-50 dark:bg-green-900/10' : ''}
                  />
                  {hasCompanyPayPal && (
                    <p className="text-xs text-green-600 dark:text-green-400">✓ Bereits hinterlegt</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-iban" className="flex items-center gap-2">
                    IBAN {!hasCompanyIBAN && '*'}
                    {hasCompanyIBAN && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </Label>
                  <Input
                    id="company-iban"
                    placeholder="DE89 3704 0044..."
                    value={companyIban}
                    onChange={(e) => setCompanyIban(e.target.value)}
                    required={!hasCompanyIBAN}
                    disabled={hasCompanyIBAN && !!companyIban}
                    className={hasCompanyIBAN ? 'bg-green-50 dark:bg-green-900/10' : ''}
                  />
                  {hasCompanyIBAN && (
                    <p className="text-xs text-green-600 dark:text-green-400">✓ Bereits hinterlegt</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onComplete}
              disabled={isSubmitting}
              className="flex-1"
            >
              Später
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
