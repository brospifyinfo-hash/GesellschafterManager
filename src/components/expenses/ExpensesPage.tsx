import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { Button } from '@/components/ui/button'
import { Plus, Filter, ChevronDown, ChevronUp, Star, Archive } from 'lucide-react'
import { ExpenseList } from './ExpenseList'
import { AddExpenseDialog } from './AddExpenseDialog'
import { ExpenseSummary } from './ExpenseSummary'
import { DebtSummary } from './DebtSummary'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USERS } from '@/constants/users'
import { Expense } from '@/types'

const CATEGORIES = [
  '📦 Logistik',
  '📱 Social Media',
  '🏢 Büro Einrichtung',
  '💻 IT',
  '🏠 Miete',
  '📋 Allgemein',
]

interface ExpensesPageProps {
  onNavigate?: (page: string) => void
}

export function ExpensesPage({ onNavigate }: ExpensesPageProps = {}) {
  const { user } = useAuth()
  const { expenses = [], isLoading, error } = useExpenses()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // Collapsible sections - standardmäßig geschlossen
  const [showSummary, setShowSummary] = useState(false)
  const [showDebts, setShowDebts] = useState(false)
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPerson, setFilterPerson] = useState<string>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  if (!user) return null

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Fehler beim Laden der Ausgaben</p>
          <Button onClick={() => window.location.reload()}>Neu laden</Button>
        </div>
      </div>
    )
  }

  // Apply filters
  const filteredExpenses = expenses.filter((expense: Expense) => {
    if (filterCategory !== 'all' && expense.category !== filterCategory) return false
    if (filterPerson !== 'all' && expense.created_by !== filterPerson) return false
    if (showFavoritesOnly && !expense.is_favorite) return false
    return true
  })

  const activeFiltersCount = 
    (filterCategory !== 'all' ? 1 : 0) + 
    (filterPerson !== 'all' ? 1 : 0) + 
    (showFavoritesOnly ? 1 : 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ausgabenverwaltung</h2>
          <p className="text-muted-foreground">
            Verwalten Sie alle gemeinsamen Ausgaben
          </p>
        </div>
        <div className="flex gap-2">
          {onNavigate && (
            <Button 
              onClick={() => onNavigate('archive')} 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-full shadow-lg"
              title="Archiv anzeigen"
            >
              <Archive className="w-6 h-6" />
            </Button>
          )}
          <Button onClick={() => setIsAddDialogOpen(true)} size="icon" className="h-12 w-12 rounded-full shadow-lg">
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold">Filter</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} aktiv</Badge>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Kategorien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPerson} onValueChange={setFilterPerson}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Personen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Personen</SelectItem>
              {USERS.filter(u => !u.isTimeAccount).map(u => (
                <SelectItem key={u.code} value={u.code}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-user-${u.color}`}></div>
                    {u.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant={showFavoritesOnly ? 'default' : 'outline'}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-2"
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Nur Favoriten
          </Button>
        </div>
        {activeFiltersCount > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.length} von {expenses.length} Ausgaben
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setFilterCategory('all')
                setFilterPerson('all')
                setShowFavoritesOnly(false)
              }}
            >
              Filter zurücksetzen
            </Button>
          </div>
        )}
      </Card>

      {/* Collapsible Summary */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Gesamtzahlungen & Pro Person</h3>
            <Badge variant="outline">{showSummary ? 'Eingeklappt' : 'Ausgeklappt'}</Badge>
          </div>
          {showSummary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {showSummary && (
          <div className="p-4 pt-0 border-t animate-scale-in">
            <ExpenseSummary expenses={filteredExpenses} />
          </div>
        )}
      </Card>
      
      {/* Collapsible Debts */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowDebts(!showDebts)}
          className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Offene Schulden</h3>
            <Badge variant="outline">{showDebts ? 'Eingeklappt' : 'Ausgeklappt'}</Badge>
          </div>
          {showDebts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {showDebts && (
          <div className="p-4 pt-0 border-t animate-scale-in">
            <DebtSummary />
          </div>
        )}
      </Card>
      
      <ExpenseList expenses={filteredExpenses} isLoading={isLoading} />

      <AddExpenseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  )
}
