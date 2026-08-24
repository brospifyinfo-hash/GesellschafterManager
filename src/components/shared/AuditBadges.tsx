import { Badge } from '@/components/ui/badge'
import { History, Pencil } from 'lucide-react'
import { formatDateTime } from '@/lib/calculations'
import { USERS } from '@/constants/users'

function userName(code?: string | null) {
  if (!code) return 'Unbekannt'
  return USERS.find((u) => u.code === code)?.name || code
}

function isAdminCode(code?: string | null) {
  if (!code) return false
  return !!USERS.find((u) => u.code === code)?.isAdmin
}

interface BackdatedBadgeProps {
  addedBy?: string | null
  addedAt?: string | null
  reason?: string | null
  className?: string
}

/**
 * Markiert Zeiten, die nicht über Ein-/Auschecken entstanden sind,
 * sondern nachträglich eingetragen wurden.
 */
export function BackdatedBadge({ addedBy, addedAt, reason, className }: BackdatedBadgeProps) {
  const byAdmin = isAdminCode(addedBy)
  const tooltip = [
    `Nachgetragen von ${userName(addedBy)}${byAdmin ? ' (Admin)' : ''}`,
    addedAt ? `am ${formatDateTime(addedAt)}` : null,
    reason ? `Grund: ${reason}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Badge
      title={tooltip}
      className={`gap-1 border-amber-500/40 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300 ${className || ''}`}
    >
      <History className="w-3 h-3" />
      {byAdmin ? 'Nachgetragen (Admin)' : 'Nachgetragen'}
    </Badge>
  )
}

interface EditedBadgeProps {
  editedAt?: string | null
  editedBy?: string | null
  editedByAdmin?: boolean | null
  className?: string
}

/**
 * Markiert Datensätze, die nach dem Anlegen bearbeitet wurden.
 * Admin-Bearbeitungen werden zusätzlich hervorgehoben.
 */
export function EditedBadge({ editedAt, editedBy, editedByAdmin, className }: EditedBadgeProps) {
  if (!editedAt && !editedBy) return null

  const byAdmin = editedByAdmin ?? isAdminCode(editedBy)
  const tooltip = [
    `Bearbeitet von ${userName(editedBy)}${byAdmin ? ' (Admin)' : ''}`,
    editedAt ? `am ${formatDateTime(editedAt)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Badge
      title={tooltip}
      className={`gap-1 ${
        byAdmin
          ? 'border-orange-500/40 bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:text-orange-300'
          : 'border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted'
      } ${className || ''}`}
    >
      <Pencil className="w-3 h-3" />
      {byAdmin ? 'Vom Admin bearbeitet' : 'Bearbeitet'}
      {editedAt ? ` · ${formatDateTime(editedAt)}` : ''}
    </Badge>
  )
}
