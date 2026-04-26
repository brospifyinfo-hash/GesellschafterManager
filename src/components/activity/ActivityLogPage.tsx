import { useState } from 'react'
import { useActivityLog } from '@/hooks/useActivityLog'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, MessageSquare, Filter } from 'lucide-react'
import { formatDateTime } from '@/lib/calculations'
import { USERS } from '@/constants/users'

const activityTypeLabels: Record<string, string> = {
  login: 'Login',
  check_in: 'Eingecheckt',
  check_out: 'Ausgecheckt',
  expense_added: 'Ausgabe hinzugefügt',
  expense_updated: 'Ausgabe aktualisiert',
  expense_deleted: 'Ausgabe gelöscht',
  manual_time_added: 'Manuelle Zeit hinzugefügt',
  revenue_added: 'Umsatz eingetragen',
  subscription_added: 'Abo hinzugefügt',
  withdrawal: 'Auszahlung',
}

export function ActivityLogPage() {
  const { user } = useAuth()
  const { activities = [], addComment, isLoading, error } = useActivityLog()
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [commentDialog, setCommentDialog] = useState<{
    open: boolean
    activityId: string
    currentComment: string
  }>({ open: false, activityId: '', currentComment: '' })
  const [newComment, setNewComment] = useState('')

  // Only Admin (DK) and Dennis (DF) can see activity logs
  if (!user || (user.code !== 'DK' && user.code !== 'DF')) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nur der Administrator und Dennis können diese Seite sehen.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Fehler beim Laden der Aktivitäten</p>
          <Button onClick={() => window.location.reload()}>Neu laden</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Lade Aktivitäten...</p>
        </div>
      </div>
    )
  }

  const filteredActivities = (Array.isArray(activities) ? activities : []).filter((activity) => {
    if (!activity) return false
    if (filterUser !== 'all' && activity.user_code !== filterUser) return false
    if (filterType !== 'all' && activity.activity_type !== filterType) return false
    if (
      searchText &&
      !activity.description.toLowerCase().includes(searchText.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const uniqueTypes = Array.from(new Set((Array.isArray(activities) ? activities : []).filter(a => a && a.activity_type).map((a) => a.activity_type)))

  const handleAddComment = () => {
    try {
      if (newComment.trim()) {
        addComment({
          id: commentDialog.activityId,
          comment: newComment,
        })
        setCommentDialog({ open: false, activityId: '', currentComment: '' })
        setNewComment('')
      }
    } catch (err) {
      console.error('Error adding comment:', err)
    }
  }

  const getUserName = (userCode: string) => {
    return USERS.find((u) => u.code === userCode)?.name || userCode
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Aktivitätsprotokoll</h1>
        <p className="text-muted-foreground">
          Alle Aktivitäten in der App werden hier protokolliert
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Filter</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Benutzer</label>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Benutzer</SelectItem>
                {USERS.filter((u) => !u.isTimeAccount).map((u) => (
                  <SelectItem key={u.code} value={u.code}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Aktivitätstyp</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {activityTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Suche</label>
            <Input
              placeholder="Beschreibung durchsuchen..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Activities List */}
      <div className="space-y-3">
        {filteredActivities.map((activity) => (
          <Card key={activity.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {activityTypeLabels[activity.activity_type] ||
                      activity.activity_type}
                  </Badge>
                  <Badge variant="secondary">{getUserName(activity.user_code)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(activity.created_at)}
                  </span>
                </div>
                <p className="text-sm mb-2">{activity.description}</p>
                {activity.admin_comment && (
                  <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        Admin-Kommentar:
                      </span>
                    </div>
                    <p className="text-sm">{activity.admin_comment}</p>
                  </div>
                )}
              </div>
              <Dialog
                open={commentDialog.open && commentDialog.activityId === activity.id}
                onOpenChange={(open) =>
                  setCommentDialog({
                    open,
                    activityId: activity.id,
                    currentComment: activity.admin_comment || '',
                  })
                }
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCommentDialog({
                        open: true,
                        activityId: activity.id,
                        currentComment: activity.admin_comment || '',
                      })
                      setNewComment(activity.admin_comment || '')
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Kommentar hinzufügen/bearbeiten</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ihr Kommentar..."
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddComment} className="flex-1">
                        Speichern
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCommentDialog({
                            open: false,
                            activityId: '',
                            currentComment: '',
                          })
                          setNewComment('')
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ))}

        {filteredActivities.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Keine Aktivitäten gefunden</p>
          </Card>
        )}
      </div>
    </div>
  )
}
