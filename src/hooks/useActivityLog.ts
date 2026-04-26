import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ActivityLog } from '@/types'
import { toast } from 'sonner'

export function useActivityLog() {
  const queryClient = useQueryClient()

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      return data as ActivityLog[]
    },
  })

  const addComment = useMutation({
    mutationFn: async ({
      id,
      comment,
    }: {
      id: string
      comment: string
    }) => {
      const { data, error } = await supabase
        .from('activity_log')
        .update({ admin_comment: comment })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-log'] })
      toast.success('Kommentar hinzugefügt')
    },
  })

  const logActivity = async (
    userCode: string,
    activityType: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    await supabase.from('activity_log').insert({
      user_code: userCode,
      activity_type: activityType,
      description,
      metadata,
    })
  }

  return {
    activities,
    isLoading,
    addComment: addComment.mutate,
    logActivity,
  }
}
