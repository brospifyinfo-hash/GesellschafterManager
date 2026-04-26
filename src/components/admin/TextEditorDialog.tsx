import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
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
import { Card } from '@/components/ui/card'
import { FileText, Save, RotateCcw, Search, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface TextEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TextEntry {
  id: string
  key: string
  value: string
  category: string
}

// Massive Liste ALLER Texte in der App
const DEFAULT_TEXTS: TextEntry[] = [
  // Navigation & Hauptmenü
  { id: '1', key: 'app_title', value: 'Gesellschafter Manager', category: 'Navigation' },
  { id: '2', key: 'dashboard_title', value: 'Dashboard', category: 'Navigation' },
  { id: '3', key: 'home_title', value: 'Home', category: 'Navigation' },
  { id: '4', key: 'expenses_title', value: 'Ausgaben', category: 'Navigation' },
  { id: '5', key: 'time_title', value: 'Zeit', category: 'Navigation' },
  { id: '6', key: 'analytics_title', value: 'Analyse', category: 'Navigation' },
  { id: '7', key: 'profile_title', value: 'Profil', category: 'Navigation' },
  { id: '8', key: 'activity_title', value: 'Aktivitäten', category: 'Navigation' },
  { id: '9', key: 'archive_title', value: 'Archiv', category: 'Navigation' },
  { id: '10', key: 'documents_title', value: 'Dokumente', category: 'Navigation' },
  { id: '11', key: 'accounts_title', value: 'Konten', category: 'Navigation' },
  { id: '12', key: 'revenue_title', value: 'Einnahmen', category: 'Navigation' },
  { id: '13', key: 'subscriptions_title', value: 'Abos', category: 'Navigation' },
  { id: '14', key: 'export_title', value: 'Export', category: 'Navigation' },
  { id: '15', key: 'leaderboard_title', value: 'Bestenliste', category: 'Navigation' },

  // Dashboard
  { id: '20', key: 'welcome_message', value: 'Willkommen zurück', category: 'Dashboard' },
  { id: '21', key: 'quick_stats', value: 'Schnellstatistiken', category: 'Dashboard' },
  { id: '22', key: 'recent_expenses', value: 'Letzte Ausgaben', category: 'Dashboard' },
  { id: '23', key: 'recent_time', value: 'Letzte Zeiteinträge', category: 'Dashboard' },
  { id: '24', key: 'quick_actions', value: 'Schnellzugriff', category: 'Dashboard' },
  { id: '25', key: 'account_balance', value: 'Kontostände', category: 'Dashboard' },
  { id: '26', key: 'outstanding_payments', value: 'Offene Zahlungen', category: 'Dashboard' },

  // Buttons
  { id: '30', key: 'add_expense_button', value: 'Neue Ausgabe', category: 'Buttons' },
  { id: '31', key: 'save_button', value: 'Speichern', category: 'Buttons' },
  { id: '32', key: 'cancel_button', value: 'Abbrechen', category: 'Buttons' },
  { id: '33', key: 'delete_button', value: 'Löschen', category: 'Buttons' },
  { id: '34', key: 'edit_button', value: 'Bearbeiten', category: 'Buttons' },
  { id: '35', key: 'close_button', value: 'Schließen', category: 'Buttons' },
  { id: '36', key: 'confirm_button', value: 'Bestätigen', category: 'Buttons' },
  { id: '37', key: 'upload_button', value: 'Hochladen', category: 'Buttons' },
  { id: '38', key: 'download_button', value: 'Herunterladen', category: 'Buttons' },
  { id: '39', key: 'filter_button', value: 'Filter', category: 'Buttons' },
  { id: '40', key: 'search_button', value: 'Suchen', category: 'Buttons' },
  { id: '41', key: 'logout_button', value: 'Abmelden', category: 'Buttons' },
  { id: '42', key: 'login_button', value: 'Anmelden', category: 'Buttons' },

  // Ausgaben
  { id: '50', key: 'expense_description', value: 'Beschreibung', category: 'Ausgaben' },
  { id: '51', key: 'expense_amount', value: 'Betrag', category: 'Ausgaben' },
  { id: '52', key: 'expense_category', value: 'Kategorie', category: 'Ausgaben' },
  { id: '53', key: 'expense_date', value: 'Datum', category: 'Ausgaben' },
  { id: '54', key: 'expense_receipt', value: 'Beleg', category: 'Ausgaben' },
  { id: '55', key: 'expense_paid', value: 'Bezahlt', category: 'Ausgaben' },
  { id: '56', key: 'expense_unpaid', value: 'Offen', category: 'Ausgaben' },
  { id: '57', key: 'expense_total', value: 'Gesamt', category: 'Ausgaben' },
  { id: '58', key: 'expense_per_person', value: 'Pro Person', category: 'Ausgaben' },
  { id: '59', key: 'expense_favorite', value: 'Favorit', category: 'Ausgaben' },
  { id: '60', key: 'expense_archive', value: 'Archivieren', category: 'Ausgaben' },
  { id: '61', key: 'expense_details', value: 'Details', category: 'Ausgaben' },

  // Kategorien
  { id: '70', key: 'category_logistics', value: '📦 Logistik', category: 'Kategorien' },
  { id: '71', key: 'category_social', value: '📱 Social Media', category: 'Kategorien' },
  { id: '72', key: 'category_office', value: '🏢 Büro Einrichtung', category: 'Kategorien' },
  { id: '73', key: 'category_it', value: '💻 IT', category: 'Kategorien' },
  { id: '74', key: 'category_rent', value: '🏠 Miete', category: 'Kategorien' },
  { id: '75', key: 'category_general', value: '📋 Allgemein', category: 'Kategorien' },

  // Zeit
  { id: '80', key: 'time_checkin', value: 'Einchecken', category: 'Zeit' },
  { id: '81', key: 'time_checkout', value: 'Auschecken', category: 'Zeit' },
  { id: '82', key: 'time_duration', value: 'Dauer', category: 'Zeit' },
  { id: '83', key: 'time_total', value: 'Gesamtstunden', category: 'Zeit' },
  { id: '84', key: 'time_manual', value: 'Manuell hinzufügen', category: 'Zeit' },
  { id: '85', key: 'time_hours', value: 'Stunden', category: 'Zeit' },
  { id: '86', key: 'time_minutes', value: 'Minuten', category: 'Zeit' },

  // Profile & Einstellungen
  { id: '90', key: 'profile_settings', value: 'Profil & Einstellungen', category: 'Profil' },
  { id: '91', key: 'profile_avatar', value: 'Profilbild', category: 'Profil' },
  { id: '92', key: 'profile_bio', value: 'Bio', category: 'Profil' },
  { id: '93', key: 'profile_payment', value: 'Zahlungsmethode', category: 'Profil' },
  { id: '94', key: 'profile_change_pin', value: 'PIN ändern', category: 'Profil' },
  { id: '95', key: 'profile_notifications', value: 'Benachrichtigungen', category: 'Profil' },
  { id: '96', key: 'profile_dark_mode', value: 'Dark Mode', category: 'Profil' },
  { id: '97', key: 'profile_theme', value: 'Farbschema', category: 'Profil' },

  // Status & Meldungen
  { id: '100', key: 'status_loading', value: 'Lädt...', category: 'Status' },
  { id: '101', key: 'status_saving', value: 'Wird gespeichert...', category: 'Status' },
  { id: '102', key: 'status_error', value: 'Fehler', category: 'Status' },
  { id: '103', key: 'status_success', value: 'Erfolgreich', category: 'Status' },
  { id: '104', key: 'status_no_data', value: 'Keine Daten vorhanden', category: 'Status' },
  { id: '105', key: 'status_online', value: 'Online', category: 'Status' },
  { id: '106', key: 'status_offline', value: 'Offline', category: 'Status' },

  // Analyse
  { id: '110', key: 'analytics_overview', value: 'Übersicht', category: 'Analyse' },
  { id: '111', key: 'analytics_participation', value: 'Beteiligung', category: 'Analyse' },
  { id: '112', key: 'analytics_breakdown', value: 'Aufschlüsselung', category: 'Analyse' },
  { id: '113', key: 'analytics_comparison', value: 'Vergleich', category: 'Analyse' },

  // Konten
  { id: '120', key: 'accounts_free', value: 'Frei verfügbar', category: 'Konten' },
  { id: '121', key: 'accounts_company', value: 'Firmenkonto', category: 'Konten' },
  { id: '122', key: 'accounts_total', value: 'Gesamt verdient', category: 'Konten' },
  { id: '123', key: 'accounts_withdraw', value: 'Auszahlen', category: 'Konten' },

  // Achievements
  { id: '130', key: 'achievement_title', value: 'Achievements', category: 'Achievements' },
  { id: '131', key: 'achievement_earned', value: 'Erreicht am', category: 'Achievements' },
  { id: '132', key: 'achievement_locked', value: 'Gesperrt', category: 'Achievements' },

  // Admin
  { id: '140', key: 'admin_title', value: 'Administrator', category: 'Admin' },
  { id: '141', key: 'admin_ghost_mode', value: 'Ghost Switch Mode', category: 'Admin' },
  { id: '142', key: 'admin_text_editor', value: 'Text Editor', category: 'Admin' },
  { id: '143', key: 'admin_functions', value: 'Admin-Funktionen', category: 'Admin' },
]

export function TextEditorDialog({ open, onOpenChange }: TextEditorDialogProps) {
  const { user } = useAuth()
  const [texts, setTexts] = useState<TextEntry[]>(() => {
    const saved = localStorage.getItem('custom-texts')
    return saved ? JSON.parse(saved) : DEFAULT_TEXTS
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  if (!user || !user.isAdmin) return null

  const filteredTexts = texts.filter(
    (t) =>
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = Array.from(new Set(texts.map((t) => t.category)))

  const handleSaveText = (id: string) => {
    const updatedTexts = texts.map((t) =>
      t.id === id ? { ...t, value: editValue } : t
    )
    setTexts(updatedTexts)
    localStorage.setItem('custom-texts', JSON.stringify(updatedTexts))
    setEditingId(null)
    toast.success('Text gespeichert!')
  }

  const handleResetAll = () => {
    if (confirm('Alle Texte auf Standard zurücksetzen?')) {
      setTexts(DEFAULT_TEXTS)
      localStorage.removeItem('custom-texts')
      toast.success('Alle Texte zurückgesetzt!')
    }
  }

  const handleAddNew = () => {
    const newText: TextEntry = {
      id: Date.now().toString(),
      key: 'new_text_' + Date.now(),
      value: 'Neuer Text',
      category: 'Custom',
    }
    const updated = [...texts, newText]
    setTexts(updated)
    localStorage.setItem('custom-texts', JSON.stringify(updated))
    toast.success('Neuer Text hinzugefügt!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Text Editor (Admin) - ALLE Texte bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeiten Sie JEDEN Text, jedes Wort und jede Überschrift der App
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search & Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Key, Wert oder Kategorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAddNew} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Neu
            </Button>
            <Button onClick={handleResetAll} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          {/* Stats */}
          <div className="text-sm text-muted-foreground">
            {filteredTexts.length} von {texts.length} Texten | {categories.length} Kategorien
          </div>

          {/* Texts by Category */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {categories.map((category) => {
              const categoryTexts = filteredTexts.filter((t) => t.category === category)
              if (categoryTexts.length === 0) return null

              return (
                <div key={category}>
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground sticky top-0 bg-background z-10 py-2">
                    {category} ({categoryTexts.length})
                  </h3>
                  <div className="space-y-2">
                    {categoryTexts.map((text) => {
                      const isEditing = editingId === text.id

                      return (
                        <Card key={text.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <Label className="text-xs text-muted-foreground">
                                  {text.key}
                                </Label>
                                {isEditing ? (
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="mt-1"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveText(text.id)
                                      if (e.key === 'Escape') setEditingId(null)
                                    }}
                                  />
                                ) : (
                                  <p className="font-medium mt-1 break-words">{text.value}</p>
                                )}
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveText(text.id)}
                                      className="gap-1"
                                    >
                                      <Save className="w-3 h-3" />
                                      Speichern
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingId(null)}
                                    >
                                      Abbrechen
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingId(text.id)
                                      setEditValue(text.value)
                                    }}
                                  >
                                    Bearbeiten
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredTexts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Keine Texte gefunden</p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p className="font-semibold mb-1">💡 Hinweis:</p>
          <p>
            Änderungen werden lokal im Browser gespeichert. Für globale Änderungen müssen die
            Texte in den Komponenten selbst angepasst werden. Sie können hier JEDEN sichtbaren Text bearbeiten!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
