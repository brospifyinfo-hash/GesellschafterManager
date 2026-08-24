-- Bearbeitungs-Markierung für Ausgaben
-- Wird von EditExpenseDialog gesetzt und in ExpenseList / ExpenseDetailDialog
-- als Badge "Vom Admin bearbeitet" bzw. "Bearbeitet" angezeigt.
--
-- Hinweis: Solange diese Spalten fehlen, speichert die App Ausgaben weiterhin
-- (useExpenses.ts entfernt die Felder dann automatisch) – nur die Markierung
-- funktioniert erst nach dieser Migration.

alter table public.expenses
  add column if not exists edited_at        timestamptz,
  add column if not exists edited_by        text,
  add column if not exists edited_by_admin  boolean not null default false;

comment on column public.expenses.edited_at is
  'Zeitpunkt der letzten inhaltlichen Bearbeitung (nicht: Zahlungs-Häkchen)';
comment on column public.expenses.edited_by is
  'User-Code der Person, die zuletzt bearbeitet hat';
comment on column public.expenses.edited_by_admin is
  'true, wenn die letzte Bearbeitung von einem Admin vorgenommen wurde';

-- Nachgetragene Zeiten brauchen keine neue Spalte: manual_time_entries.added_by
-- reicht aus, um "Nachgetragen (Admin)" zu markieren.
