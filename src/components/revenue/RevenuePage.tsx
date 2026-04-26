import { useState } from 'react'
import { useRevenue } from '@/hooks/useRevenue'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useReturns } from '@/hooks/useReturns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TrendingUp, PiggyBank, Trash2, Pencil } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/calculations'
import { RevenueDistribution } from '@/types'
import { toast } from 'sonner'
import { RevenueInfoCard } from './RevenueInfoCard'

export function RevenuePage() {
  const { user } = useAuth()
  const { distributions = [], addRevenue, updateRevenue, deleteRevenue, isLoading: isLoadingRevenue } = useRevenue()
  const { expenses = [], isLoading: isLoadingExpenses } = useExpenses()
  const { timeEntries = [], manualEntries = [], isLoading: isLoadingTime } = useTimeEntries()
  const { getPendingReturnAmount } = useReturns()
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [totalRevenue, setTotalRevenue] = useState<string>('')
  const [editingRevenue, setEditingRevenue] = useState<RevenueDistribution | null>(null)
  const [editAmount, setEditAmount] = useState<string>('')

  // Safe user check
  if (!user) return null
  if (!user.isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nur der Administrator kann diese Seite sehen.
        </p>
      </div>
    )
  }

  const isLoading = isLoadingRevenue || isLoadingExpenses || isLoadingTime

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Lade Daten...</p>
        </div>
      </div>
    )
  }

  const pendingReturns = getPendingReturnAmount()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const amount = parseFloat(totalRevenue)
      if (amount > 0 && user) {
        addRevenue({ 
          month, 
          year, 
          totalRevenue: amount, 
          createdBy: user.code,
          expenses: Array.isArray(expenses) ? expenses : [],
          timeEntries: Array.isArray(timeEntries) ? timeEntries : [],
          manualEntries: Array.isArray(manualEntries) ? manualEntries : [],
          pendingReturns,
        })
        setTotalRevenue('')
      }
    } catch (err) {
      console.error('Error submitting revenue:', err)
    }
  }

  const handleEditRevenue = () => {
    try {
      if (!editingRevenue || !editAmount || !user) return
      const newAmount = parseFloat(editAmount)
      if (newAmount <= 0 || isNaN(newAmount)) {
        toast.error('Betrag muss größer als 0 sein')
        return
      }
      
      updateRevenue({
        id: editingRevenue.id,
        totalRevenue: newAmount,
        updatedBy: user.code,
        expenses: Array.isArray(expenses) ? expenses : [],
        timeEntries: Array.isArray(timeEntries) ? timeEntries : [],
        manualEntries: Array.isArray(manualEntries) ? manualEntries : [],
      })
      
      setEditingRevenue(null)
      setEditAmount('')
    } catch (err) {
      console.error('Error updating revenue:', err)
      toast.error('Fehler beim Aktualisieren des Umsatzes')
    }
  }

  const totalTaxReserve = Array.isArray(distributions) ? distributions.reduce((sum, d) => sum + (d?.tax_reserve || 0), 0) : 0
  const totalDistributable = Array.isArray(distributions) ? distributions.reduce((sum, d) => sum + (d?.distributable || 0), 0) : 0

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Umsatzverteilung</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Umsatz alle 2 Wochen eintragen und automatische Verteilung
        </p>
      </div>

      {/* Info Card */}
      <RevenueInfoCard />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-4">
            <PiggyBank className="h-12 w-12 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Gesamte Steuerrücklage</p>
              <p className="text-3xl font-bold">{formatCurrency(totalTaxReserve)}</p>
              <p className="text-xs text-muted-foreground mt-1">55% aller Umsätze</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-12 w-12 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Gesamt verteilt</p>
              <p className="text-3xl font-bold">{formatCurrency(totalDistributable)}</p>
              <p className="text-xs text-muted-foreground mt-1">45% aller Umsätze</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Revenue Form */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Neuen Umsatz eintragen</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="month">Monat</Label>
              <Select
                value={month.toString()}
                onValueChange={(v) => setMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2000, m - 1).toLocaleDateString('de-DE', {
                        month: 'long',
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Jahr</Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                    (y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="revenue">Gesamtumsatz (€)</Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                value={totalRevenue}
                onChange={(e) => setTotalRevenue(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Umsatz eintragen
          </Button>
        </form>

        {totalRevenue && parseFloat(totalRevenue) > 0 && (
          <div className="mt-4 p-4 bg-secondary/20 rounded-lg space-y-3">
            <p className="text-sm font-medium">Vorschau der Verteilung:</p>
            <div className="space-y-2 text-sm">
              {pendingReturns > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Ausstehende Retouren (Abzug):</span>
                  <span className="font-semibold">-{formatCurrency(pendingReturns)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Bereinigter Umsatz:</span>
                <span>{formatCurrency(parseFloat(totalRevenue) - pendingReturns)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Steuerrücklage (55%):</span>
                <span className="font-semibold">
                  {formatCurrency((parseFloat(totalRevenue) - pendingReturns) * 0.55)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zur Verteilung (45%):</span>
                <span className="font-semibold">
                  {formatCurrency((parseFloat(totalRevenue) - pendingReturns) * 0.45)}
                </span>
              </div>
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p>Die 45% werden nach aktueller Beteiligung aufgeteilt:</p>
                <p className="mt-1">• 20% jedes Anteils → Frei verfügbar (auszahlbar)</p>
                <p>• 80% jedes Anteils → Privates Firmenkonto (nicht auszahlbar)</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Revenue History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Umsatzhistorie</h2>
        <div className="space-y-3">
          {Array.isArray(distributions) && distributions.map((dist) => dist && (
            <div
              key={dist.id}
              className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg"
            >
              <div>
                <p className="font-semibold">
                  {new Date(dist.year, dist.month - 1).toLocaleDateString('de-DE', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(dist.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right space-y-1">
                  <p className="text-lg font-bold">
                    {formatCurrency(dist.total_revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Steuer: {formatCurrency(dist.tax_reserve)} | Verteilt:{' '}
                    {formatCurrency(dist.distributable)}
                  </p>
                </div>
                {user?.isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingRevenue(dist)
                        setEditAmount(dist.total_revenue.toString())
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm('Umsatzverteilung wirklich löschen?')) {
                          deleteRevenue({ id: dist.id, deletedBy: user.code })
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(!Array.isArray(distributions) || distributions.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              Noch keine Umsätze eingetragen
            </p>
          )}
        </div>
      </Card>

      {/* Edit Revenue Dialog */}
      <Dialog open={!!editingRevenue} onOpenChange={(open) => !open && setEditingRevenue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Umsatz bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie den Gesamtumsatz für{' '}
              {editingRevenue && new Date(editingRevenue.year, editingRevenue.month - 1).toLocaleDateString('de-DE', {
                month: 'long',
                year: 'numeric',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-amount">Gesamtumsatz (€)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {editAmount && parseFloat(editAmount) > 0 && (
              <div className="p-3 bg-secondary/20 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Steuerrücklage (55%):</span>
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(editAmount) * 0.55)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zur Verteilung (45%):</span>
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(editAmount) * 0.45)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleEditRevenue} className="flex-1">
                Speichern
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingRevenue(null)
                  setEditAmount('')
                }}
              >
                Abbrechen
              </Button>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">⚠️ Wichtig:</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Die Differenz wird automatisch auf alle Konten verteilt basierend auf der prozentualen Beteiligung zum Zeitpunkt der ursprünglichen Erstellung.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
