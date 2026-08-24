# Julins Buch - Dokumentation

Eine umfassende Finanz- und Zeitverwaltungsplattform im Apple-Style für vier Gesellschafter.

## 📋 Übersicht

### Benutzer
- **Devid (DK)** - Administrator - Passwort: 8789
- **Dennis (DF)** - Logistik - Passwort: 9281  
- **Lara (LS)** - Social Media - Passwort: 0281
- **Eren (DM)** - Finanzen - Passwort: 1035

### Hauptfunktionen

#### 💸 Finanzübersicht & Ausgabenverwaltung
- Ausgabenliste mit automatischer Berechnung pro Person (÷4)
- Zahlungsstatus-Tracking für jeden Gesellschafter
- **Zahlungsbeleg-Pflicht**: Jeder User muss beim Abhaken einer Zahlung einen Beleg hochladen
- Multi-Receipt Upload: Mehrere Belege pro Ausgabe möglich
- Kategorien & Tags für bessere Organisation
- Favoriten-Funktion für wichtige Ausgaben
- Kommentare & Reaktionen (Emojis) pro Ausgabe
- **Split-Payment System**: Flexible Aufteilung wenn mehrere zahlen (z.B. 50/50)
- **Firmen- vs. Privatkonto**: 
  - Ausgaben können als "Privat" oder "Firma" markiert werden
  - Schulden werden getrennt angezeigt
  - Beide Zahlungsmethoden (PayPal + IBAN) müssen hinterlegt sein

#### 🕒 Arbeitszeit-Erfassung
- Einchecken/Auschecken System
- Automatische Berechnung der Arbeitsdauer
- Admin kann Zeiten nachtragen – jeder nachgetragene Eintrag wird sichtbar als **„Nachgetragen“** markiert (Name, Zeitpunkt, Grund)
- Gesamtarbeitszeit je Gesellschafter

#### 💰 Umsatzverteilung
- **Intervall**: Alle 2 Wochen eintragen
- **Automatische Aufteilung**:
  - 55% → Steuerrücklage (nicht auszahlbar)
  - 45% → Verteilung nach prozentualer Beteiligung
- **Kontenverteilung** (von den 45%):
  - 20% → Privatkonto (frei verfügbar, auszahlbar)
  - 80% → Firmenkonto (nicht auszahlbar)
- Berechnung basiert auf:
  - Geldliche Investitionen (Ausgaben)
  - Zeitliche Investitionen (Arbeitsstunden)

#### 📦 Retouren-System
- Nur Admin & Logistik können Retouren erfassen
- Automatischer Abzug vom nächsten Umsatz
- Dokumentation mit Bestellnummer & Betrag
- Status-Tracking (pending → applied)

#### 💳 Auszahlungen
- Nur Admin (Finanzabteilung) kann Auszahlungen vornehmen
- Betrag wird vom privaten Konto abgezogen
- Vollständige Dokumentation in Activity Log

#### 🧾 Steuererklärungen
- Nur Admin kann erstellen
- Pflicht-Upload eines Belegs
- Betrag wird automatisch von Steuerrücklage abgezogen
- Vollständige Historie

#### 📊 Analyse-Seite
- Gesamtinvestitionen (Geld + Zeit)
- Prozentuale Beteiligung je Gesellschafter
- Visuelle Darstellung (Charts)
- "Top-Investor" & "Meiste Stunden" Badges

#### 📬 Inbox-System
- Benachrichtigungen für:
  - Neue Ausgaben (an alle außer Ersteller)
  - Zahlungen erhalten (an Ersteller der Ausgabe)
  - Umsatz verteilt (an alle mit persönlichem Anteil)
- Ungelesene Badge in Navigation
- "Alle als gelesen" Funktion
- Automatisches Lesen beim Scrollen

#### 🗃️ Archiv-System
- **Automatische Archivierung**: Wenn alle Gesellschafter bezahlt haben
- **Archiv-Ordner**: 
  - Hierarchisches Ordner-System mit Unterordnern
  - Farbkodierung & Emoji-Icons
  - Datei-Upload & Verwaltung
  - Verschieben von Dateien zwischen Ordnern
- Vollständige Historie mit:
  - Originalbelegen
  - Kommentaren
  - Reaktionen
  - Zahlungsbelegen

#### 📄 Dokumente
- Zentrale Dokumentenverwaltung
- Upload mit Kategorien & Tags
- Private/Öffentliche Dokumente
- Volltextsuche

#### 🏆 Bestenliste & Achievements
- Gamification-System
- Achievements für:
  - Erste Ausgabe
  - 10/50/100 Ausgaben
  - Pünktlichkeit
  - Belege hochladen
  - Früher Vogel / Nachtarbeiter

#### 📅 Abonnements
- Wiederkehrende Zahlungen tracken
- Automatische Berechnung der nächsten Fälligkeit
- Frequenzen: Monatlich, Vierteljährlich, Jährlich

### 🔐 Berechtigungen

#### Admin (nur Devid)
- Einträge löschen & bearbeiten
- Umsätze eintragen & verwalten
- Zeiten nachtragen (wird als „Nachgetragen“ markiert)
- Auszahlungen vornehmen
- Steuererklärungen erstellen
- Benutzerstatistiken exportieren
- Retouren verwalten

#### Logistik (Dennis, Lara)
- Retouren erfassen
- Standard-Benutzerrechte

#### Standard-Benutzer (alle)
- Ausgaben hinzufügen
- Ein-/Auschecken
- Eigene Zahlungen abhaken (mit Beleg!)
- Kommentare & Reaktionen
- Dokumente hochladen

### ⚙️ Besondere Features

#### Ausgaben-Einschränkungen
- **Nur Mo-Fr erlaubt**: Ausgaben können nur von Montag bis Freitag erstellt werden
- Tag wird automatisch getrackt

#### Zahlungsmethoden-Pflicht
- Jeder User muss BEIDE hinterlegen:
  - PayPal (Privat & Firma)
  - IBAN (Privat & Firma)
- Dialog beim Login wenn fehlend
- Grüne Markierung für hinterlegte Daten

#### Split-Payment Details
- Bei Erstellung wählen: Wer hat bezahlt?
- Prozentuale Aufteilung eingeben
- Automatische Berechnung der Schulden
- Andere schulden an die Zahler (nicht untereinander)
- Getrennte Anzeige: Privat vs. Firmenkonto

#### Nachvollziehbarkeit / Markierungen
- **„Nachgetragen“**: Zeiten, die nicht per Ein-/Auschecken entstanden sind, tragen überall
  ein Badge – in der Zeitenliste, in den Stundensummen („davon Xh nachgetragen“), im Activity
  Log und im CSV/JSON-Export (Spalte „Art“). Wurde die Zeit von einem Admin eingetragen,
  steht dort „Nachgetragen (Admin)“.
- **„Vom Admin bearbeitet“**: Wird eine Ausgabe nachträglich über den Bearbeiten-Dialog
  geändert, wird sie mit Name und Zeitpunkt markiert (`edited_at`, `edited_by`,
  `edited_by_admin`). Das reine Abhaken einer Zahlung zählt nicht als Bearbeitung.
- Beide Markierungen sind für alle Gesellschafter sichtbar, nicht nur für den Admin.

#### Ghost-Mode (Admin)
- Admin kann als andere User agieren
- Zurück-Button immer sichtbar
- Nützlich für Support & Testing

### 🎨 Design

- **Apple-Style**: Clean, modern, übersichtlich
- **Farbschema**:
  - Devid: Blau
  - Dennis: Grün
  - Lara: Gelb
  - Eren: Rot
- **Dark/Light Mode** verfügbar
- **Responsive**: Desktop, Tablet, Mobile
- Animationen & Konfetti bei Erfolgen
- Abgerundete Ecken, dezente Schatten
- Minimalistische Icons

### 📱 Mobile Features

- Custom Dashboard mit Widgets
- Widget-Verwaltung (aktivieren/deaktivieren, sortieren)
- Bottom Navigation
- Swipe-Gesten
- Touch-optimierte Bedienung

### 📊 Export-Funktionen

- Zeitraum-basierter Export
- PDF & CSV Format
- Ausgaben-Liste
- Zeiterfassung
- Kontoübersicht

### 🔄 Automatisierungen

1. **Auto-Archivierung**: Wenn alle bezahlt haben
2. **Benachrichtigungen**: Bei allen wichtigen Events
3. **Umsatzverteilung**: Automatische Berechnung & Kontobuchung
4. **Retouren-Abzug**: Beim nächsten Umsatz
5. **Summen-Berechnung**: Immer aktuell

## 🛠️ Technische Details

### Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: OnSpace Cloud (Supabase-kompatibel)
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React

### Datenbank-Schema

**Haupttabellen**:
- `expenses` - Ausgaben mit allen Details
- `expense_receipts` - Multi-Receipt Support
- `expense_comments` - Kommentare
- `expense_reactions` - Reaktionen (Emojis)
- `archived_expenses` - Archivierte Ausgaben mit Historie
- `time_entries` - Check-in/out Daten
- `manual_time_entries` - Manuell hinzugefügte Zeiten
- `user_accounts` - Kontostände (privat & firma)
- `revenue_distributions` - Umsatzverteilungen
- `returns` - Retouren
- `tax_declarations` - Steuererklärungen
- `notifications` - Inbox-Nachrichten
- `activity_log` - Vollständige Activity Historie
- `documents` - Dokumentenverwaltung
- `archive_folders` - Hierarchische Ordnerstruktur
- `subscriptions` - Abonnements
- `achievements` - User-Achievements
- `user_profiles` - Profile mit Zahlungsmethoden

**Migrationen**: `supabase/migrations/20260824_add_edit_tracking.sql` ergänzt
`expenses.edited_at`, `expenses.edited_by` und `expenses.edited_by_admin`.
Ohne diese Migration speichert die App weiterhin normal, nur die Bearbeitungs-Markierung
bleibt leer.

**Storage Buckets**:
- `receipts` - Rechnungsbelege
- `documents` - Dokumente
- `avatars` - Profilbilder

### Sicherheit

- Row Level Security (RLS) auf allen Tabellen
- Nur authentifizierte User
- Admin-Checks auf kritischen Operationen
- Sichere File-Uploads
- Session-basierte Authentifizierung

## 📝 Wichtige Hinweise

1. **Umsatz alle 2 Wochen**: Nicht vergessen, zweimal pro Monat einzutragen!
2. **Zahlungsbelege**: Immer hochladen beim Abhaken - sonst geht's nicht!
3. **Beide Zahlungsmethoden**: PayPal UND IBAN müssen hinterlegt sein
4. **Ausgaben Mo-Fr**: Am Wochenende keine Ausgaben möglich
5. **Auto-Archiv**: Bei vollständiger Zahlung automatisch archiviert

## 🎯 Workflow-Beispiel

### Neue Ausgabe
1. User erstellt Ausgabe (Mo-Fr) → Wählt Privat/Firma
2. Andere 3 User erhalten Benachrichtigung in Inbox
3. Jeder klickt Checkbox → Muss Zahlungsbeleg hochladen
4. Bei letzter Zahlung → Konfetti + Auto-Archivierung
5. Ersteller erhält Benachrichtigungen bei jeder Zahlung

### Umsatzverteilung (alle 2 Wochen)
1. Admin trägt Umsatz ein
2. System prüft pending Retouren → Zieht automatisch ab
3. Berechnet 55% Steuer, 45% Verteilung
4. Verteilt nach aktueller Beteiligung (Geld + Zeit)
5. 20% → Privatkonto, 80% → Firmenkonto
6. Alle User erhalten Inbox-Benachrichtigung mit ihrem Anteil

### Retoure
1. Admin/Logistik erfasst Retoure
2. Status: "Pending"
3. Beim nächsten Umsatz → Automatischer Abzug
4. Status: "Applied"
5. In Umsatz-Historie dokumentiert

## 🚀 Zukünftige Erweiterungen

- Export als PDF/CSV (bereits implementiert)
- Mehr Achievements
- Dashboard-Customization (bereits implementiert)
- Erweiterte Analytics mit Prognosen
- Mobile App (PWA bereits responsive)

---

**Version**: 2.1  
**Letztes Update**: Dezember 2025  
**Entwickelt für**: Devid, Dennis, Lara, Eren

---

**Julins Buch** - Die moderne Plattform für gemeinsame Finanzen und Zeitverwaltung
