import { useState } from 'react'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Upload, Calendar, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function SubscriptionsPage() {
  const { user } = useAuth()
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } =
    useSubscriptions()
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    receiptUrl: '',
    receiptFilename: '',
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('receipts').getPublicUrl(filePath)

      setFormData((prev) => ({
        ...prev,
        receiptUrl: publicUrl,
        receiptFilename: file.name,
      }))

      toast.success('Datei hochgeladen')
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Hochladen')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    addSubscription({
      name: formData.name,
      description: formData.description,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      startDate: formData.startDate,
      receiptUrl: formData.receiptUrl,
      receiptFilename: formData.receiptFilename,
      createdBy: user.code,
    })

    setFormData({
      name: '',
      description: '',
      amount: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      receiptUrl: '',
      receiptFilename: '',
    })
    setOpen(false)
  }

  const frequencyLabels = {
    monthly: 'Monatlich',
    quarterly: 'Quartalsweise',
    yearly: 'Jährlich',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Abonnements</h1>
          <p className="text-muted-foreground">
            Wiederkehrende Ausgaben verwalten
          </p>
        </div>

        {user?.isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                Neues Abo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Neues Abonnement hinzufügen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="amount">Betrag (€) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="frequency">Häufigkeit *</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monatlich</SelectItem>
                        <SelectItem value="quarterly">Quartalsweise</SelectItem>
                        <SelectItem value="yearly">Jährlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Startdatum *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="receipt">Beleg / Rechnung</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    {formData.receiptFilename && (
                      <Badge variant="secondary">{formData.receiptFilename}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={uploading}>
                    Hinzufügen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Subscriptions List */}
      <div className="grid gap-4">
        {subscriptions.map((sub) => (
          <Card key={sub.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{sub.name}</h3>
                  <Badge variant={sub.active ? 'default' : 'secondary'}>
                    {sub.active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                  <Badge variant="outline">{frequencyLabels[sub.frequency]}</Badge>
                </div>

                {sub.description && (
                  <p className="text-muted-foreground mb-3">{sub.description}</p>
                )}

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Betrag</p>
                    <p className="font-semibold text-lg">{formatCurrency(sub.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Startdatum</p>
                    <p className="font-semibold">
                      {new Date(sub.start_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nächste Fälligkeit</p>
                    <p className="font-semibold">
                      {new Date(sub.next_due_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>

                {sub.receipt_url && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-3 px-0"
                    onClick={() => window.open(sub.receipt_url!, '_blank')}
                  >
                    Beleg ansehen
                  </Button>
                )}
              </div>

              {user?.isAdmin && (
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      updateSubscription({ id: sub.id, active: !sub.active })
                    }
                    title={sub.active ? 'Deaktivieren' : 'Aktivieren'}
                  >
                    {sub.active ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm('Abo wirklich löschen?')) {
                        deleteSubscription(sub.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}

        {subscriptions.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Abonnements vorhanden</p>
          </Card>
        )}
      </div>
    </div>
  )
}
