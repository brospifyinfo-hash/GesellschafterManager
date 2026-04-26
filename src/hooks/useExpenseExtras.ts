import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ExpenseReceipt, ExpenseReaction, ExpenseComment } from '@/types'
import { toast } from 'sonner'

export function useExpenseExtras(expenseId: string) {
  const queryClient = useQueryClient()

  // Receipts
  const { data: receipts = [] } = useQuery({
    queryKey: ['expense-receipts', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_receipts')
        .select('*')
        .eq('expense_id', expenseId)
        .order('uploaded_at', { ascending: true })
      
      if (error) throw error
      return data as ExpenseReceipt[]
    },
    enabled: !!expenseId,
  })

  // Reactions
  const { data: reactions = [] } = useQuery({
    queryKey: ['expense-reactions', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_reactions')
        .select('*')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data as ExpenseReaction[]
    },
    enabled: !!expenseId,
  })

  // Comments
  const { data: comments = [] } = useQuery({
    queryKey: ['expense-comments', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_comments')
        .select('*')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data as ExpenseComment[]
    },
    enabled: !!expenseId,
  })

  // Add receipt
  const addReceipt = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${expenseId}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      const { data, error } = await supabase
        .from('expense_receipts')
        .insert({
          expense_id: expenseId,
          receipt_url: urlData.publicUrl,
          receipt_filename: file.name,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-receipts', expenseId] })
      toast.success('Rechnung hinzugefügt')
    },
    onError: () => {
      toast.error('Fehler beim Hochladen')
    },
  })

  // Toggle reaction
  const toggleReaction = useMutation({
    mutationFn: async ({ userCode, emoji }: { userCode: string; emoji: string }) => {
      // Check if reaction exists
      const existing = reactions.find(
        (r) => r.user_code === userCode && r.emoji === emoji
      )

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('expense_reactions')
          .delete()
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Add reaction
        const { error } = await supabase
          .from('expense_reactions')
          .insert({
            expense_id: expenseId,
            user_code: userCode,
            emoji,
          })
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-reactions', expenseId] })
    },
  })

  // Add comment
  const addComment = useMutation({
    mutationFn: async ({ userCode, comment }: { userCode: string; comment: string }) => {
      const { data, error } = await supabase
        .from('expense_comments')
        .insert({
          expense_id: expenseId,
          user_code: userCode,
          comment,
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: userCode,
        activity_type: 'comment_added',
        description: `Kommentar hinzugefügt zu Ausgabe`,
        metadata: { expense_id: expenseId },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-comments', expenseId] })
      toast.success('Kommentar hinzugefügt')
    },
  })

  // Delete comment
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('expense_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-comments', expenseId] })
      toast.success('Kommentar gelöscht')
    },
  })

  return {
    receipts,
    reactions,
    comments,
    addReceipt: addReceipt.mutate,
    toggleReaction: toggleReaction.mutate,
    addComment: addComment.mutate,
    deleteComment: deleteComment.mutate,
  }
}
