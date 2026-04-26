import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTaxDeclarations } from '@/hooks/useTaxDeclarations'
import { useRevenue } from '@/hooks/useRevenue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText, Upload, Download, Trash2, Shield } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/calculations'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function TaxDeclarationsPage() {
  const { user } = useAuth()
  const { taxDeclarations, isLoading, createTaxDeclaration, deleteTaxDeclaration } = useTaxDeclarations()
  const { distributions } = useRevenue()
  const [showDialog, setShowDialog] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          Nur der Administrator kann diese Seite sehen.
        </p>
      </div>
    )
  }

  const totalTaxReserve = distributions.reduce((sum, d) => sum + Number(d.tax_reserve), 0)
  const totalDeclared = taxDeclarations.reduce((sum, d) => sum + Number(d.amount), 0)
  const remainingReserve = totalTaxReserve - totalDeclared

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Bitte laden Sie ein Dokument hoch')
      return
    }

    const amountNum = parseFloat(amount)
    if (amountNum <= 0 || isNaN(amountNum)) {
      toast.error('Betrag muss größer als 0 sein')
      return
    }

    if (amountNum > remainingReserve) {
      toast.error('Betrag übersteigt verfügbare Steuerrücklage')
      return
    }

    setUploading(true)
    try {
      // Upload document
      const fileExt = file.name.split('.').pop()
      const fileName = `tax_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      // Create tax declaration
      createTaxDeclaration({
        amount: amountNum,
        documentUrl: urlData.publicUrl,
        documentName: file.name,
        description,
        createdBy: user.code,
      })

      setShowDialog(false)
      setAmount('')
      setDescription('')
      setFile(null)
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Hochladen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Steuererklärungen
          </h1>
          <p className="text-muted-foreground mt-1">
            Steuererklärungen erstellen und von Rücklagen abziehen
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          Neue Erklärung
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <div className="flex items-center gap-4">
            <Shield className="w-12 h-12 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Steuerrücklage</p>
              <p className="text-3xl font-bold">{formatCurrency(totalTaxReserve)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5">
          <div className="flex items-center gap-4">
            <FileText className="w-12 h-12 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Erklärt</p>
              <p className="text-3xl font-bold">{formatCurrency(totalDeclared)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="flex items-center gap-4">
            <Shield className="w-12 h-12 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Verfügbar</p>
              <p className="text-3xl font-bold">{formatCurrency(remainingReserve)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tax Declarations List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Steuererklärungen</h2>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Lädt...</p>
          ) : taxDeclarations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Noch keine Steuererklärungen erstellt
            </p>
          ) : (
            taxDeclarations.map((declaration) => (
              <div
                key={declaration.id}
                className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold">{formatCurrency(declaration.amount)}</p>
                  {declaration.description && (
                    <p className="text-sm text-muted-foreground">{declaration.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(declaration.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(declaration.document_url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {declaration.document_name}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm('Steuererklärung wirklich löschen?')) {
                        deleteTaxDeclaration({ id: declaration.id, deletedBy: user.code })
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Steuererklärung</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Betrag (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Verfügbar: {formatCurrency(remainingReserve)}
              </p>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. Steuererklärung 2024"
              />
            </div>

            <div>
              <Label htmlFor="file">Dokument</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG erlaubt
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading} className="flex-1">
                {uploading ? 'Lädt hoch...' : 'Erstellen'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
