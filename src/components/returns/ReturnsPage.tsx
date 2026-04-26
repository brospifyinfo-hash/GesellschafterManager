import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useReturns } from '@/hooks/useReturns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Package, Plus, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/calculations'
import { USERS } from '@/constants/users'
import { toast } from 'sonner'

export function ReturnsPage() {
  const { user } = useAuth()
  const { returns, createReturn, deleteReturn, isLoading } = useReturns()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [amount, setAmount] = useState('')

  if (!user) return null

  // Check if user is admin or logistik (DK, DF, LS)
  const canCreateReturn = user.isAdmin || ['DF', 'LS'].includes(user.code)
  const canDeleteReturn = user.isAdmin || ['DF', 'LS'].includes(user.code)

  const handleCreateReturn = () => {
    const amountNum = parseFloat(amount)
    if (!orderNumber.trim()) {
      toast.error('Bitte Bestellnummer eingeben')
      return
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Bitte gültigen Betrag eingeben')
      return
    }

    createReturn({
      created_by: user.code,
      order_number: orderNumber,
      amount: amountNum,
    })

    setOrderNumber('')
    setAmount('')
    setShowCreateDialog(false)
  }

  const pendingReturns = returns.filter((r) => r.status === 'pending')
  const appliedReturns = returns.filter((r) => r.status === 'applied')
  const totalPending = pendingReturns.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8" />
            Retouren
          </h1>
          <p className="text-muted-foreground mt-1">
            Verwaltung von Retouren und automatischer Abzug vom Umsatz
          </p>
        </div>
        {canCreateReturn && (
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neue Retoure
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ausstehend</p>
              <p className="text-2xl font-bold">{pendingReturns.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Verarbeitet</p>
              <p className="text-2xl font-bold">{appliedReturns.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200">
          <div>
            <p className="text-sm text-muted-foreground">Offener Betrag</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Wird beim nächsten Umsatz abgezogen
            </p>
          </div>
        </Card>
      </div>

      {/* Returns List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Alle Retouren</h2>

        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Lädt Retouren...</p>
          </Card>
        ) : returns.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Keine Retouren vorhanden</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {returns.map((returnItem) => (
              <Card key={returnItem.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">Bestellung #{returnItem.order_number}</p>
                      <Badge
                        variant={returnItem.status === 'applied' ? 'default' : 'secondary'}
                        className={
                          returnItem.status === 'applied'
                            ? 'bg-green-500'
                            : 'bg-orange-500'
                        }
                      >
                        {returnItem.status === 'applied' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verarbeitet
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Ausstehend
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mb-2">
                      -{formatCurrency(returnItem.amount)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Erstellt von{' '}
                        {USERS.find((u) => u.code === returnItem.created_by)?.name}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(returnItem.created_at)}</span>
                      {returnItem.applied_to_revenue_id && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-medium">
                            Vom Umsatz abgezogen
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  {canDeleteReturn && returnItem.status === 'pending' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Retoure #${returnItem.order_number} wirklich löschen?`)) {
                          deleteReturn(returnItem.id)
                        }
                      }}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Löschen
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Retoure erstellen</DialogTitle>
            <DialogDescription>
              Der Betrag wird automatisch vom nächsten Umsatz abgezogen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bestellnummer *</Label>
              <Input
                placeholder="z.B. 12345"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Betrag (€) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="z.B. 30.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-sm text-orange-900 dark:text-orange-100">
                💡 <strong>Hinweis:</strong> Dieser Betrag wird automatisch vom nächsten
                Umsatz-Eintrag abgezogen.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button onClick={handleCreateReturn} className="flex-1">
                Retoure erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
