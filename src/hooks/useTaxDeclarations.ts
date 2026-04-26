import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TaxDeclaration } from '@/types'
import { toast } from 'sonner'

export function useTaxDeclarations() {
  const queryClient = useQueryClient()

  const { data: taxDeclarations = [], isLoading } = useQuery({
    queryKey: ['tax-declarations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_declarations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as TaxDeclaration[]
    },
  })

  const createTaxDeclaration = useMutation({
    mutationFn: async ({
      amount,
      documentUrl,
      documentName,
      description,
      createdBy,
    }: {
      amount: number
      documentUrl: string
      documentName: string
      description?: string
      createdBy: string
    }) => {
      const { data, error } = await supabase
        .from('tax_declarations')
        .insert({
          amount,
          document_url: documentUrl,
          document_name: documentName,
          description,
          created_by: createdBy,
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: createdBy,
        activity_type: 'tax_declared',
        description: `Steuererklärung erstellt: ${amount.toFixed(2)}€`,
        metadata: { amount, document_url: documentUrl },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-declarations'] })
      toast.success('Steuererklärung erstellt')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Erstellen')
    },
  })

  const deleteTaxDeclaration = useMutation({
    mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
      const { error } = await supabase
        .from('tax_declarations')
        .delete()
        .eq('id', id)

      if (error) throw error

      await supabase.from('activity_log').insert({
        user_code: deletedBy,
        activity_type: 'tax_declaration_deleted',
        description: 'Steuererklärung gelöscht',
        metadata: { tax_declaration_id: id },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-declarations'] })
      toast.success('Steuererklärung gelöscht')
    },
    onError: () => {
      toast.error('Fehler beim Löschen')
    },
  })

  return {
    taxDeclarations,
    isLoading,
    createTaxDeclaration: createTaxDeclaration.mutate,
    deleteTaxDeclaration: deleteTaxDeclaration.mutate,
  }
}
