import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { UserAccount } from '@/types'
import { toast } from 'sonner'

export function useAccounts() {
  const queryClient = useQueryClient()

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['user-accounts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('user_accounts')
          .select('*')
          .order('user_code')

        if (error) {
          console.error('Error fetching accounts:', error)
          return []
        }
        return (data || []) as UserAccount[]
      } catch (err) {
        console.error('Accounts query error:', err)
        return []
      }
    },
    retry: 1,
  })

  const updateAccount = useMutation({
    mutationFn: async ({
      userCode,
      freeAvailable,
      companyAccount,
      totalEarned,
    }: {
      userCode: string
      freeAvailable?: number
      companyAccount?: number
      totalEarned?: number
    }) => {
      const updates: any = {}
      if (freeAvailable !== undefined) updates.free_available = freeAvailable
      if (companyAccount !== undefined) updates.company_account = companyAccount
      if (totalEarned !== undefined) updates.total_earned = totalEarned

      const { data, error } = await supabase
        .from('user_accounts')
        .update(updates)
        .eq('user_code', userCode)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] })
    },
  })

  const processWithdrawal = useMutation({
    mutationFn: async ({
      userCode,
      amount,
      processedBy,
      note,
    }: {
      userCode: string
      amount: number
      processedBy: string
      note?: string
    }) => {
      // Get current account
      const account = accounts.find((a) => a.user_code === userCode)
      if (!account) throw new Error('Account not found')
      if (account.free_available < amount) {
        throw new Error('Nicht genügend Guthaben verfügbar')
      }

      // Create withdrawal record
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_code: userCode,
          amount,
          processed_by: processedBy,
          note,
        })

      if (withdrawalError) throw withdrawalError

      // Update account
      const newFreeAvailable = account.free_available - amount
      const { error: updateError } = await supabase
        .from('user_accounts')
        .update({ free_available: newFreeAvailable })
        .eq('user_code', userCode)

      if (updateError) throw updateError

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: processedBy,
        activity_type: 'withdrawal',
        description: `${amount.toFixed(2)}€ von ${userCode} ausgezahlt`,
        metadata: { user_code: userCode, amount },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] })
      toast.success('Auszahlung erfolgreich')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler bei der Auszahlung')
    },
  })

  const createWithdrawal = processWithdrawal

  return {
    accounts,
    isLoading,
    updateAccount: updateAccount.mutate,
    processWithdrawal: processWithdrawal.mutate,
    createWithdrawal: processWithdrawal.mutate,
  }
}
