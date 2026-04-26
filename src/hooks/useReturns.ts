import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Return } from '@/types'
import { toast } from 'sonner'

export function useReturns() {
  const queryClient = useQueryClient()

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Return[]
    },
  })

  const createReturn = useMutation({
    mutationFn: async (returnData: {
      created_by: string
      order_number: string
      amount: number
    }) => {
      const { data, error } = await supabase
        .from('returns')
        .insert(returnData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast.success('Retoure erfasst!')
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`)
    },
  })

  const applyReturn = useMutation({
    mutationFn: async ({ id, revenueId }: { id: string; revenueId: string }) => {
      const { error } = await supabase
        .from('returns')
        .update({
          status: 'applied',
          applied_to_revenue_id: revenueId,
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast.success('Retoure angewendet!')
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`)
    },
  })

  const deleteReturn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('returns')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast.success('Retoure gelöscht!')
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`)
    },
  })

  const getPendingReturnAmount = () => {
    return returns
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0)
  }

  return {
    returns,
    isLoading,
    createReturn: createReturn.mutate,
    applyReturn: applyReturn.mutate,
    deleteReturn: deleteReturn.mutate,
    getPendingReturnAmount,
  }
}
