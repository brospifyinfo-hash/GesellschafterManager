import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Expense } from '@/types'
import { toast } from 'sonner'
import { useAchievements } from './useAchievements'
import { USERS } from '@/constants/users'

// Felder der Bearbeitungs-Markierung. Fehlen sie in der Datenbank noch,
// wird die Ausgabe trotzdem gespeichert (siehe updateExpenseMutation).
const EDIT_TRACKING_FIELDS = ['edited_at', 'edited_by', 'edited_by_admin'] as const

function isMissingEditColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  const message = error.message || ''
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    EDIT_TRACKING_FIELDS.some((field) => message.includes(field))
  )
}

export function useExpenses() {
  const queryClient = useQueryClient()
  const { checkAndAwardAchievements } = useAchievements()

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching expenses:', error)
          return []
        }
        return (data || []) as Expense[]
      } catch (err) {
        console.error('Expenses query error:', err)
        return []
      }
    },
    retry: 1,
  })

  const createExpense = useMutation({
    mutationFn: async (expense: {
      description: string
      total_amount: number
      created_by: string
      receipt_files?: File[]
      category?: string | null
      tags?: string[] | null
      payment_type?: 'private' | 'company'
    }) => {
      // Get day of week
      const daysOfWeek = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
      const dayOfWeek = daysOfWeek[new Date().getDay()]
      
      // Validate: Only Mon-Fri allowed
      if (!['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].includes(dayOfWeek)) {
        throw new Error('Ausgaben können nur von Montag bis Freitag erstellt werden!')
      }
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          description: expense.description,
          total_amount: expense.total_amount,
          amount_per_person: expense.total_amount / 4,
          created_by: expense.created_by,
          category: expense.category,
          tags: expense.tags,
          payment_type: expense.payment_type || 'private',
          day_of_week: dayOfWeek,
        })
        .select()
        .single()

      if (error) throw error

      // Upload multiple receipts
      if (expense.receipt_files && expense.receipt_files.length > 0) {
        for (const file of expense.receipt_files) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${data.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, file)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            continue
          }

          const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName)

          await supabase.from('expense_receipts').insert({
            expense_id: data.id,
            receipt_url: urlData.publicUrl,
            receipt_filename: file.name,
          })
        }
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: expense.created_by,
        activity_type: 'expense_added',
        description: `Ausgabe hinzugefügt: ${expense.description} (${expense.total_amount.toFixed(2)}€)`,
        metadata: { expense_id: data.id, amount: expense.total_amount },
      })

      // Create notifications for all OTHER users (not the creator)
      const creatorName = USERS.find(u => u.code === expense.created_by)?.name
      const otherUsers = ['DK', 'LS', 'DF', 'EM'].filter(code => code !== expense.created_by)
      
      for (const userCode of otherUsers) {
        await supabase.from('notifications').insert({
          user_code: userCode,
          notification_type: 'new_expense',
          title: '💸 Neue Ausgabe',
          message: `${creatorName} hat eine neue Ausgabe hinzugefügt: "${expense.description}" (${expense.total_amount.toFixed(2)}€ / ${(expense.total_amount / 4).toFixed(2)}€ pro Person)`,
          metadata: { expense_id: data.id, amount: expense.total_amount, created_by: expense.created_by },
          related_expense_id: data.id,
        })
      }

      return data
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Ausgabe wurde hinzugefügt', {
        duration: 3000,
        action: {
          label: '🎉',
          onClick: () => {},
        },
      })
      
      // Check for achievements
      const expenses = queryClient.getQueryData<Expense[]>(['expenses']) || []
      const receipts = await supabase
        .from('expense_receipts')
        .select('*')
      
      await checkAndAwardAchievements(variables.created_by, {
        expenses,
        receipts: receipts.data || [],
      })
    },
    onError: () => {
      toast.error('Fehler beim Hinzufügen der Ausgabe')
    },
  })

  const updateExpenseMutation = useMutation({
    mutationFn: async (expense: Partial<Expense> & { id: string }) => {
      // FIRST: Get the ORIGINAL expense data BEFORE updating
      const { data: originalExpense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expense.id)
        .single()

      if (fetchError) throw fetchError

      // NOW: Update the expense
      const updateRow = (payload: Partial<Expense> & { id: string }) =>
        supabase
          .from('expenses')
          .update(payload)
          .eq('id', payload.id)
          .select()
          .single()

      let { data, error } = await updateRow(expense)

      // Fallback: Solange die edited_*-Spalten fehlen, ohne Markierung speichern
      if (error && isMissingEditColumnError(error)) {
        console.warn(
          'Bearbeitungs-Markierung übersprungen – edited_*-Spalten fehlen in der Datenbank:',
          error.message
        )
        const payloadWithoutTracking = { ...expense }
        EDIT_TRACKING_FIELDS.forEach((field) => delete (payloadWithoutTracking as any)[field])
        ;({ data, error } = await updateRow(payloadWithoutTracking))
      }

      if (error) throw error

      // Check if a payment status changed from FALSE to TRUE
      const userMap = {
        devid_paid: 'DK',
        dennis_paid: 'DF',
        lukas_paid: 'LS',
        david_paid: 'EM'
      }
      
      for (const [field, userCode] of Object.entries(userMap)) {
        const wasUnpaid = !originalExpense[field as keyof typeof originalExpense]
        const isNowPaid = expense[field as keyof typeof expense] === true
        
        // If payment status changed from false to true
        if (wasUnpaid && isNowPaid) {
          console.log(`💰 Payment detected: ${userCode} paid for expense ${data.id}`)
          
          const payerName = USERS.find(u => u.code === userCode)?.name
          
          // Get current account
          const { data: accountData } = await supabase
            .from('user_accounts')
            .select('*')
            .eq('user_code', userCode)
            .single()
          
          if (accountData) {
            // ALWAYS use amount_per_person (= total_amount / 4)
            const paymentAmount = data.amount_per_person
            const newTotalEarned = accountData.total_earned + paymentAmount
            
            console.log(`📊 Updating ${userCode} account:`, {
              oldTotalEarned: accountData.total_earned,
              paymentAmount,
              newTotalEarned
            })
            
            // Update total_earned (this affects percentage calculations)
            await supabase
              .from('user_accounts')
              .update({
                total_earned: newTotalEarned,
                updated_at: new Date().toISOString(),
              })
              .eq('user_code', userCode)
          }
          
          // Notify expense creator (only if this is not the creator themselves)
          if (data.created_by !== userCode) {
            await supabase.from('notifications').insert({
              user_code: data.created_by,
              notification_type: 'payment_received',
              title: '✅ Rechnung bezahlt',
              message: `${payerName} hat die Rechnung "${data.description}" bezahlt (${data.amount_per_person.toFixed(2)}€)!`,
              metadata: { expense_id: data.id, payer: userCode },
              related_expense_id: data.id,
            })
          }
        }
      }

      // Check if all users have paid -> auto-archive
      if (data.devid_paid && data.dennis_paid && data.lukas_paid && data.david_paid) {
        // Get full expense data with receipts, comments, reactions
        const [receiptsRes, commentsRes, reactionsRes] = await Promise.all([
          supabase.from('expense_receipts').select('*').eq('expense_id', data.id),
          supabase.from('expense_comments').select('*').eq('expense_id', data.id),
          supabase.from('expense_reactions').select('*').eq('expense_id', data.id),
        ])

        // Archive the expense
        await supabase.from('archived_expenses').insert({
          original_expense_id: data.id,
          archived_by: 'SYSTEM',
          expense_data: data,
          receipts: receiptsRes.data || [],
          comments: commentsRes.data || [],
          reactions: reactionsRes.data || [],
        })

        // Delete the original expense
        await supabase.from('expenses').delete().eq('id', data.id)

        // Create notification for all users
        const users = ['DK', 'LS', 'DF', 'EM']
        for (const userCode of users) {
          await supabase.from('notifications').insert({
            user_code: userCode,
            notification_type: 'expense_archived',
            title: '✅ Ausgabe vollständig bezahlt',
            message: `Die Ausgabe "${data.description}" wurde automatisch archiviert, da alle bezahlt haben.`,
            metadata: { expense_id: data.id, amount: data.total_amount },
            related_expense_id: data.id,
          })
        }

        // Log activity
        await supabase.from('activity_log').insert({
          user_code: 'SYSTEM',
          activity_type: 'expense_auto_archived',
          description: `Ausgabe automatisch archiviert: ${data.description}`,
          metadata: { expense_id: data.id },
        })

        toast.success('🎉 Ausgabe vollständig bezahlt und archiviert!')
        return { ...data, auto_archived: true }
      }

      // Log activity
      const expenseLabel = expense.description || 'ID ' + expense.id
      await supabase.from('activity_log').insert({
        user_code: expense.edited_by || 'SYSTEM',
        activity_type: expense.edited_by_admin ? 'expense_admin_edited' : 'expense_updated',
        description: expense.edited_by_admin
          ? `Ausgabe vom Admin bearbeitet: ${expenseLabel}`
          : `Ausgabe aktualisiert: ${expenseLabel}`,
        metadata: {
          expense_id: expense.id,
          edited_by: expense.edited_by || null,
          edited_by_admin: !!expense.edited_by_admin,
        },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['archived-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Ausgabe wurde aktualisiert')
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Ausgabe')
    },
  })

  const deleteExpense = useMutation({
    mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: deletedBy,
        activity_type: 'expense_deleted',
        description: `Ausgabe gelöscht`,
        metadata: { expense_id: id },
      })
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['activity-log'] })
      
      toast.success('Ausgabe wurde gelöscht')
      
      // Force reload after short delay to ensure all data is fresh
      setTimeout(() => {
        window.location.reload()
      }, 500)
    },
    onError: () => {
      toast.error('Fehler beim Löschen der Ausgabe')
    },
  })

  return {
    expenses,
    isLoading,
    createExpense: createExpense.mutate,
    updateExpense: updateExpenseMutation.mutateAsync,
    deleteExpense: deleteExpense.mutate,
  }
}
