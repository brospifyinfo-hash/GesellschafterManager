import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface Notification {
  id: string
  created_at: string
  user_code: string
  notification_type: 'new_expense' | 'payment_received' | 'expense_archived' | 'revenue_distributed' | 'revenue_added'
  title: string
  message: string
  read: boolean
  metadata?: any
  related_expense_id?: string
}

export function useNotifications(userCode: string) {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userCode],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_code', userCode)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching notifications:', error)
          return []
        }
        return (data || []) as Notification[]
      } catch (err) {
        console.error('Notifications query error:', err)
        return []
      }
    },
    enabled: !!userCode,
    retry: 1,
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userCode] })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_code', userCode)
        .eq('read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userCode] })
      toast.success('Alle als gelesen markiert')
    },
  })

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userCode] })
      toast.success('Benachrichtigung gelöscht')
    },
  })

  const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    const { error } = await supabase.from('notifications').insert({
      user_code: notification.user_code,
      notification_type: notification.notification_type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      related_expense_id: notification.related_expense_id,
    })

    if (error) {
      console.error('Error creating notification:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    createNotification,
  }
}
