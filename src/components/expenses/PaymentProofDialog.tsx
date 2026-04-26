import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, FileIcon } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentProofDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => Promise<void>
  payerName: string
}

export function PaymentProofDialog({
  open,
  onOpenChange,
  onConfirm,
  payerName,
}: PaymentProofDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Datei zu groß (max. 10MB)')
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirm = async () => {
    if (!selectedFile) {
      toast.error('Bitte wählen Sie eine Datei')
      return
    }

    setIsUploading(true)
    try {
      await onConfirm(selectedFile)
      setSelectedFile(null)
      setPreviewUrl(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Zahlungsbeleg hochladen</DialogTitle>
          <DialogDescription>
            Bitte laden Sie einen Nachweis für Ihre Zahlung hoch (z.B. Screenshot, Foto der Überweisung)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Zahler: {payerName}</Label>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">
                ⚠️ Zahlungsnachweis erforderlich
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ohne Beleg kann die Zahlung nicht als "bezahlt" markiert werden
              </p>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />

            {!selectedFile ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-dashed"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Beleg hochladen</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bild oder PDF (max. 10MB)
                  </p>
                </div>
              </Button>
            ) : (
              <div className="relative border rounded-lg p-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-contain rounded"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <FileIcon className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? 'Wird hochgeladen...' : 'Bestätigen & Als bezahlt markieren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
