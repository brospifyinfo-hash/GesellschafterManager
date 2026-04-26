import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Inbox,
  Bell,
  CheckCheck,
  Trash2,
  DollarSign,
  Archive,
  TrendingUp,
} from 'lucide-react'
import { formatDateTime } from '@/lib/calculations'

export function InboxPage() {
  const { user } = useAuth()
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(user?.code || '')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  if (!user) return null

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_expense':
        return <DollarSign className="w-5 h-5 text-orange-500" />
      case 'payment_received':
        return <CheckCheck className="w-5 h-5 text-green-500" />
      case 'expense_archived':
        return <Archive className="w-5 h-5 text-blue-500" />
      case 'revenue_distributed':
      case 'revenue_added':
        return <TrendingUp className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
            <Inbox className="w-8 h-8" />
            Inbox
          </h1>
          <p className="text-muted-foreground">
            Alle Benachrichtigungen und Aktivitäten
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()} variant="outline" size="sm">
            <CheckCheck className="w-4 h-4 mr-2" />
            Alle als gelesen
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{notifications.length}</p>
              <p className="text-xs text-muted-foreground">Gesamt</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Inbox className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-xs text-muted-foreground">Ungelesen</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <CheckCheck className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
              <p className="text-xs text-muted-foreground">Gelesen</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="all">
            Alle ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Ungelesen ({unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-3 mt-6">
          {isLoading ? (
            <Card className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-muted-foreground">Lade Benachrichtigungen...</p>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-1">Keine Benachrichtigungen</p>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' 
                  ? 'Alle Benachrichtigungen gelesen!' 
                  : 'Hier erscheinen neue Ausgaben, Zahlungen und Updates'}
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 ${!notification.read ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default" className="h-5">NEU</Badge>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            title="Als gelesen markieren"
                            className="h-8 w-8"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                          title="Löschen"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-2">{notification.message}</p>
                    
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
