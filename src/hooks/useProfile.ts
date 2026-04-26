import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  username: string | null
  email: string
  avatar_url: string | null
  bio: string | null
  payment_method: string | null
  updated_at: string
}

export function useProfile(userCode?: string) {
  const queryClient = useQueryClient()

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', userCode],
    queryFn: async () => {
      if (!userCode) return null
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', userCode)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
          return null
        }
        return (data || null) as UserProfile | null
      } catch (err) {
        console.error('Profile query error:', err)
        return null
      }
    },
    enabled: !!userCode,
    retry: 1,
  })

  const updateProfile = useMutation({
    mutationFn: async ({
      userCode,
      updates,
    }: {
      userCode: string
      updates: Partial<UserProfile>
    }) => {
      // Check if profile exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', userCode)
        .maybeSingle()

      if (existing) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('username', userCode)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new profile with auto-generated UUID
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            username: userCode,
            email: `${userCode}@julinesbuch.app`,
            ...updates,
          })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userCode] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profil gespeichert!')
      
      // Auto reload after 500ms
      setTimeout(() => {
        window.location.reload()
      }, 500)
    },
    onError: (error: any) => {
      console.error('Profile update error:', error)
      toast.error('Speichern fehlgeschlagen - bitte erneut versuchen')
    },
  })

  const uploadAvatar = useMutation({
    mutationFn: async ({ userCode, file }: { userCode: string; file: File }) => {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Bitte nur Bilddateien hochladen')
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Datei ist zu groß (max. 5MB)')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `avatar_${userCode}_${Date.now()}.${fileExt}`

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', userCode)
        .maybeSingle()

      if (!existingProfile) {
        // Create profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            username: userCode,
            email: `${userCode}@julinesbuch.app`,
            avatar_url: urlData.publicUrl,
          })
        
        if (createError) throw createError
      } else {
        // Update profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            avatar_url: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('username', userCode)
        
        if (updateError) throw updateError
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_code: userCode,
        activity_type: 'avatar_updated',
        description: 'Profilbild aktualisiert',
      })

      return urlData.publicUrl
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userCode] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profilbild hochgeladen!')
      
      // Force reload after 500ms
      setTimeout(() => {
        window.location.reload()
      }, 500)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Hochladen')
    },
  })

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutateAsync,
    uploadAvatar: uploadAvatar.mutateAsync,
  }
}
