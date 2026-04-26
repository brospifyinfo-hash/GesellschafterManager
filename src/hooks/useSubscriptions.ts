import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Subscription } from '@/types'
import { toast } from 'sonner'

export function useSubscriptions() {
  const queryClient = useQueryClient()

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('next_due_date')

      if (error) throw error
      return data as Subscription[]
    },
  })

  const addSubscription = useMutation({
    mutationFn: async ({
      name,
      description,
      amount,
      frequency,
      startDate,
      receiptUrl,
      receiptFilename,
      createdBy,
    }: {
      name: string
      description?: string
      amount: number
      frequency: 'monthly' | 'quarterly' | 'yearly'
      startDate: string
      receiptUrl?: string
      receiptFilename?: string
      createdBy: string
    }) => {
      // Calculate next due date
      const start = new Date(startDate)
      let nextDue = new Date(start)
      
      if (frequency === 'monthly') {
        nextDue.setMonth(nextDue.getMonth() + 1)
      } else if (frequency === 'quarterly') {
        nextDue.setMonth(nextDue.getMonth() + 3)
      } else if (frequency === 'yearly') {
        nextDue.setFullYear(nextDue.getFullYear() + 1)
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          name,
          description,
          amount,
          frequency,
          start_date: startDate,
          next_due_date: nextDue.toISOString().split('T')[0],
          receipt_url: receiptUrl,
          receipt_filename: receiptFilename,
          created_by: createdBy,
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: createdBy,
        activity_type: 'subscription_added',
        description: `Abo hinzugefügt: ${name} (${amount.toFixed(2)}€ ${frequency})`,
        metadata: { name, amount, frequency },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Abo erfolgreich hinzugefügt')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Hinzufügen des Abos')
    },
  })

  const updateSubscription = useMutation({
    mutationFn: async ({
      id,
      active,
    }: {
      id: string
      active: boolean
    }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Abo aktualisiert')
    },
  })

  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Abo gelöscht')
    },
  })

  return {
    subscriptions,
    isLoading,
    addSubscription: addSubscription.mutate,
    updateSubscription: updateSubscription.mutate,
    deleteSubscription: deleteSubscription.mutate,
  }
}
