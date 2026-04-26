import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Document } from '@/types'
import { toast } from 'sonner'

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Fehler beim Laden der Dokumente')
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (
    file: File,
    metadata: {
      title: string
      description?: string
      category: string
      tags?: string[]
      isPrivate: boolean
      uploadedBy: string
    }
  ) => {
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Insert document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          uploaded_by: metadata.uploadedBy,
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          tags: metadata.tags || [],
          is_private: metadata.isPrivate
        })

      if (insertError) throw insertError

      toast.success('Dokument erfolgreich hochgeladen!')
      fetchDocuments()
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Fehler beim Hochladen des Dokuments')
    }
  }

  const deleteDocument = async (documentId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/documents/')
      const filePath = urlParts[urlParts.length - 1]

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      toast.success('Dokument gelöscht!')
      fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Fehler beim Löschen des Dokuments')
    }
  }

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments
  }
}
