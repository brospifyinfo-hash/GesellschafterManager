import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileDown, Download } from 'lucide-react'
import { exportToCSV, exportToJSON } from '@/lib/export'
import { USERS } from '@/constants/users'
import { UserCode } from '@/constants/users'
import { toast } from 'sonner'

export function ExportPage() {
  const { expenses } = useExpenses()
  const { timeEntries, manualEntries } = useTimeEntries()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleExportCSV = () => {
    if (!startDate || !endDate) {
      toast.error('Bitte wählen Sie einen Zeitraum aus')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Filter expenses
    const filteredExpenses = expenses.filter((e) => {
      const date = new Date(e.created_at)
      return date >= start && date <= end
    })

    // Filter time entries
    const filteredTimeEntries = timeEntries.filter((e) => {
      const date = new Date(e.check_in)
      return date >= start && date <= end
    })

    const filteredManualEntries = manualEntries.filter((e) => {
      const date = new Date(e.created_at)
      return date >= start && date <= end
    })

    // Prepare expense data for CSV
    const expenseData = filteredExpenses.map(e => {
      const editor = USERS.find((u) => u.code === e.edited_by)
      return {
        Datum: new Date(e.created_at).toLocaleDateString('de-DE'),
        Beschreibung: e.description,
        Betrag: e.total_amount,
        'Erstellt von': e.created_by,
        'Devid bezahlt': e.devid_paid ? 'Ja' : 'Nein',
        'Dennis bezahlt': e.dennis_paid ? 'Ja' : 'Nein',
        'Lara bezahlt': e.lukas_paid ? 'Ja' : 'Nein',
        'Eren bezahlt': e.david_paid ? 'Ja' : 'Nein',
        Bearbeitet: e.edited_at ? (e.edited_by_admin ? 'Ja (Admin)' : 'Ja') : 'Nein',
        'Bearbeitet von': editor?.name || e.edited_by || '',
        'Bearbeitet am': e.edited_at ? new Date(e.edited_at).toLocaleString('de-DE') : '',
      }
    })

    // Prepare time data for CSV: Ein-/Auschecken UND nachgetragene Zeiten,
    // klar getrennt über die Spalte "Art"
    const timeData = [
      ...filteredTimeEntries.map(entry => {
        const user = USERS.find((u) => u.code === entry.user_code)
        return {
          Name: user?.name,
          Art: 'Eingecheckt',
          Zeitpunkt: new Date(entry.check_in).toLocaleString('de-DE'),
          'Check-out': entry.check_out ? new Date(entry.check_out).toLocaleString('de-DE') : 'Aktiv',
          'Dauer (h)': entry.duration_minutes ? (entry.duration_minutes / 60).toFixed(2) : 'Aktiv',
          'Eingetragen von': '',
          Grund: '',
        }
      }),
      ...filteredManualEntries.map(entry => {
        const user = USERS.find((u) => u.code === entry.user_code)
        const addedBy = USERS.find((u) => u.code === entry.added_by)
        return {
          Name: user?.name,
          Art: 'Nachgetragen',
          Zeitpunkt: new Date(entry.created_at).toLocaleString('de-DE'),
          'Check-out': '-',
          'Dauer (h)': entry.hours.toFixed(2),
          'Eingetragen von': `${addedBy?.name || entry.added_by}${addedBy?.isAdmin ? ' (Admin)' : ''}`,
          Grund: entry.reason || '',
        }
      }),
    ]

    // Export both files
    exportToCSV(expenseData, `ausgaben_${startDate}_${endDate}`)
    exportToCSV(timeData, `zeiterfassung_${startDate}_${endDate}`)

    toast.success('CSV Export erfolgreich!')
  }

  const handleExportJSON = () => {
    if (!startDate || !endDate) {
      toast.error('Bitte wählen Sie einen Zeitraum aus')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const filteredExpenses = expenses.filter((e) => {
      const date = new Date(e.created_at)
      return date >= start && date <= end
    })

    const filteredTimeEntries = timeEntries.filter((e) => {
      const date = new Date(e.check_in)
      return date >= start && date <= end
    })

    const filteredManualEntries = manualEntries.filter((e) => {
      const date = new Date(e.created_at)
      return date >= start && date <= end
    })

    const exportData = {
      period: {
        start: startDate,
        end: endDate,
        generated_at: new Date().toISOString(),
      },
      expenses: filteredExpenses,
      timeEntries: filteredTimeEntries,
      manualTimeEntries: filteredManualEntries,
      summary: {
        total_expenses: filteredExpenses.reduce((sum, e) => sum + e.total_amount, 0),
        total_time_hours: filteredTimeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0) / 60, 0),
        backdated_time_hours: filteredManualEntries.reduce((sum, e) => sum + e.hours, 0),
        edited_expenses: filteredExpenses.filter((e) => !!e.edited_at).length,
        admin_edited_expenses: filteredExpenses.filter((e) => !!e.edited_by_admin).length,
      },
    }

    exportToJSON(exportData, `gesellschafter_export_${startDate}_${endDate}`)
    toast.success('JSON Export erfolgreich!')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Daten exportieren</h2>
        <p className="text-muted-foreground">
          Exportieren Sie Ausgaben und Zeiterfassung für einen bestimmten Zeitraum
        </p>
      </div>

      <Card className="glass apple-shadow p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Startdatum</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Enddatum</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Button
              onClick={handleExportCSV}
              disabled={!startDate || !endDate}
              className="flex-1 gap-2"
            >
              <FileDown className="w-5 h-5" />
              Als CSV exportieren
            </Button>

            <Button
              onClick={handleExportJSON}
              disabled={!startDate || !endDate}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Download className="w-5 h-5" />
              Als JSON exportieren
            </Button>
          </div>
        </div>
      </Card>

      <Card className="glass apple-shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Export-Information</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• CSV-Export eignet sich für Excel und Google Sheets</p>
          <p>• JSON-Export enthält alle Rohdaten für technische Verwendung</p>
          <p>• Alle Exporte enthalten Ausgaben, Zeiterfassung und Statistiken</p>
          <p>• Wählen Sie einen Zeitraum aus, um die Daten zu filtern</p>
        </div>
      </Card>
    </div>
  )
}
