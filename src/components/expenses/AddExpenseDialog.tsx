import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useProfile } from '@/hooks/useProfile'
import { USERS } from '@/constants/users'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Camera, X, Image as ImageIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CATEGORIES = [
  '📦 Logistik',
  '📱 Social Media',
  '🏢 Büro Einrichtung',
  '💻 IT',
  '🏠 Miete',
  '📋 Allgemein',
]

export function AddExpenseDialog({ open, onOpenChange }: AddExpenseDialogProps) {
  const { user } = useAuth()
  const { createExpense } = useExpenses()
  
  // Load payment methods for all users
  const { profile: dkProfile } = useProfile('DK')
  const { profile: lsProfile } = useProfile('LS')
  const { profile: dfProfile } = useProfile('DF')
  const { profile: emProfile } = useProfile('EM')
  
  const paymentMethods = {
    DK: dkProfile?.payment_method,
    LS: lsProfile?.payment_method,
    DF: dfProfile?.payment_method,
    EM: emProfile?.payment_method,
  }
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [paidBy, setPaidBy] = useState(user?.code || '')
  const [paymentType, setPaymentType] = useState<'private' | 'company'>('private')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Split payment state
  const [isSplit, setIsSplit] = useState(false)
  const [splitPercentages, setSplitPercentages] = useState<Record<string, number>>({
    DK: 0,
    LS: 0,
    DF: 0,
    EM: 0,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles([...files, ...selectedFiles])
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // UPLOAD-PFLICHT: Rechnung muss hochgeladen werden
    if (files.length === 0) {
      toast.error('Bitte laden Sie mindestens eine Rechnung hoch!')
      return
    }
    
    setIsSubmitting(true)

    // Validate split percentages if split is enabled
    if (isSplit) {
      const totalPercentage = Object.values(splitPercentages).reduce((sum, p) => sum + p, 0)
      if (totalPercentage !== 100) {
        toast.error(`Split-Prozente müssen 100% ergeben! Aktuell: ${totalPercentage}%`)
        setIsSubmitting(false)
        return
      }
    }
    
    // Build split payments array with calculated amounts
    const totalAmount = parseFloat(amount)
    const splitPayments = isSplit 
      ? Object.entries(splitPercentages)
          .filter(([_, percentage]) => percentage > 0)
          .map(([userCode, percentage]) => ({
            user_code: userCode,
            percentage,
            amount: (totalAmount * percentage) / 100,
          }))
      : []

    createExpense(
      {
        description,
        total_amount: totalAmount,
        created_by: paidBy,
        receipt_files: files,
        category: category || null,
        tags: tags.length > 0 ? tags : null,
        payment_type: paymentType,
        split_payments: splitPayments.length > 0 ? splitPayments : null,
      },
      {
        onSuccess: () => {
          setDescription('')
          setAmount('')
          setCategory('')
          setTags([])
          setFiles([])
          setPaidBy(user?.code || '')
          onOpenChange(false)
        },
        onSettled: () => setIsSubmitting(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Ausgabe hinzufügen</DialogTitle>
          <DialogDescription>
            Fügen Sie eine neue gemeinsame Ausgabe mit Rechnungen hinzu
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="z.B. Büromaterial, Miete, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Gesamtbetrag (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {amount && (
                <p className="text-xs text-muted-foreground">
                  Pro Person: {(parseFloat(amount) / 4).toFixed(2)} €
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">Zahlungsart *</Label>
            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as 'private' | 'company')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">💵 Privates Konto (persönliches Geld)</SelectItem>
                <SelectItem value="company">🏢 Firmenkonto (privates Firmenguthaben)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {paymentType === 'private' 
                ? '💡 Du zahlst mit deinem privaten Geld - andere schulden dir privat' 
                : '💡 Du zahlst von deinem Firmenkonto - andere schulden auf dein Firmenkonto'}
            </p>
          </div>

          {/* Split Payment Toggle */}
          <div className="space-y-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">🔀 Split-Zahlung</Label>
              <Button
                type="button"
                variant={isSplit ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsSplit(!isSplit)}
              >
                {isSplit ? 'Aktiviert' : 'Deaktiviert'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isSplit 
                ? '✅ Mehrere Personen teilen sich die Kosten' 
                : '💡 Aktivieren, um Kosten auf mehrere Personen aufzuteilen'}
            </p>

            {isSplit && (
              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm">Prozentuale Aufteilung:</Label>
                {USERS.filter(u => !u.isTimeAccount).map((u) => (
                  <div key={u.code} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-user-${u.color} shrink-0`}></div>
                    <span className="text-sm font-medium w-20">{u.name}</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={splitPercentages[u.code]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setSplitPercentages(prev => ({
                          ...prev,
                          [u.code]: Math.min(100, Math.max(0, value))
                        }))
                      }}
                      className="w-20"
                    />
                    <span className="text-sm">%</span>
                    {amount && splitPercentages[u.code] > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({((parseFloat(amount) * splitPercentages[u.code]) / 100).toFixed(2)} €)
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">Gesamt:</span>
                  <Badge variant={Object.values(splitPercentages).reduce((sum, p) => sum + p, 0) === 100 ? 'default' : 'destructive'}>
                    {Object.values(splitPercentages).reduce((sum, p) => sum + p, 0)}%
                  </Badge>
                </div>
                {Object.values(splitPercentages).reduce((sum, p) => sum + p, 0) !== 100 && (
                  <p className="text-xs text-destructive">
                    ⚠️ Die Prozente müssen 100% ergeben!
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">Wer hat bezahlt? 💰</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USERS.filter(u => !u.isTimeAccount).map((u) => (
                  <SelectItem key={u.code} value={u.code}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-user-${u.color}`}></div>
                      {u.name}
                      {paymentMethods[u.code as keyof typeof paymentMethods] && (
                        <span className="text-xs text-muted-foreground">- {paymentMethods[u.code as keyof typeof paymentMethods]}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              💡 Die anderen Gesellschafter werden dieser Person Geld schulden
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Tag hinzufügen..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-red-500 font-semibold">Rechnungen (Pflicht) *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Galerie
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                Kamera
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative p-2 border rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs truncate flex-1">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Person's Payment Method */}
          {paidBy && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="text-sm font-bold flex items-center gap-2 mb-2">
                {paymentType === 'private' ? '💳 Private ' : '🏢 Firmen-'}Zahlungsinformation von {USERS.find(u => u.code === paidBy)?.name}
              </Label>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {paymentType === 'private' 
                    ? 'Die anderen zahlen auf das private Konto:' 
                    : 'Die anderen zahlen auf das Firmenkonto:'}
                </p>
                {/* PayPal */}
                {paymentType === 'private' && paymentMethods[paidBy as keyof typeof paymentMethods] && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-background px-3 py-2 rounded border">
                      {paymentMethods[paidBy as keyof typeof paymentMethods]}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentMethods[paidBy as keyof typeof paymentMethods]!)
                        toast.success('Kopiert!')
                      }}
                    >
                      Kopieren
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
