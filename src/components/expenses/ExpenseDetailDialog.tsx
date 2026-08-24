import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExpenseExtras } from '@/hooks/useExpenseExtras'
import { useExpenses } from '@/hooks/useExpenses'
import { useProfile } from '@/hooks/useProfile'
import { useNotifications } from '@/hooks/useNotifications'
import { PaymentProofDialog } from './PaymentProofDialog'
import { supabase } from '@/lib/supabase'
import { triggerConfetti } from '@/lib/confetti'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Expense } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/calculations'
import { USERS } from '@/constants/users'
import { EditedBadge } from '@/components/shared/AuditBadges'
import { 
  Heart, 
  ThumbsUp, 
  Smile, 
  Star, 
  Flame,
  MessageCircle,
  Send,
  X,
  ExternalLink,
  Tag,
  Copy,
  CheckCheck,
} from 'lucide-react'
import { toast } from 'sonner'

interface ExpenseDetailDialogProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const REACTION_EMOJIS = [
  { emoji: '❤️', icon: Heart, label: 'Liebe' },
  { emoji: '👍', icon: ThumbsUp, label: 'Top' },
  { emoji: '😊', icon: Smile, label: 'Super' },
  { emoji: '⭐', icon: Star, label: 'Wichtig' },
  { emoji: '🔥', icon: Flame, label: 'Hot' },
]

export function ExpenseDetailDialog({
  expense,
  open,
  onOpenChange,
}: ExpenseDetailDialogProps) {
  const { user } = useAuth()
  const { updateExpense } = useExpenses()
  const { createNotification } = useNotifications(user?.code || '')
  const [commentText, setCommentText] = useState('')
  const [copiedPayment, setCopiedPayment] = useState<string | null>(null)
  const [showPaymentProofDialog, setShowPaymentProofDialog] = useState(false)
  const [pendingPaymentUser, setPendingPaymentUser] = useState<string | null>(null)

  // Load creator's payment method
  const { profile: creatorProfile } = useProfile(expense?.created_by || '')
  
  // Load payment methods for all split payers
  const splitPayers = expense?.split_payments || []
  const splitPayerProfiles = {
    DK: useProfile('DK').profile,
    LS: useProfile('LS').profile,
    DF: useProfile('DF').profile,
    EM: useProfile('EM').profile,
  }

  const {
    receipts,
    reactions,
    comments,
    toggleReaction,
    addComment,
    deleteComment,
  } = useExpenseExtras(expense?.id || '')

  if (!expense || !user) return null

  const handleToggleReaction = (emoji: string) => {
    toggleReaction({ userCode: user.code, emoji })
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    addComment(
      { userCode: user.code, comment: commentText },
      {
        onSuccess: () => setCommentText(''),
      }
    )
  }

  const handleToggleFavorite = () => {
    updateExpense({
      id: expense.id,
      is_favorite: !expense.is_favorite,
    })
  }

  const getReactionCount = (emoji: string) => {
    return reactions.filter((r) => r.emoji === emoji).length
  }

  const hasUserReacted = (emoji: string) => {
    return reactions.some((r) => r.emoji === emoji && r.user_code === user.code)
  }

  const handleCopyPaymentMethod = (paymentMethod: string) => {
    navigator.clipboard.writeText(paymentMethod)
    setCopiedPayment(paymentMethod)
    toast.success('Zahlungsinformation kopiert!')
    setTimeout(() => setCopiedPayment(null), 2000)
  }



  const handleTogglePayment = (userCode: string) => {
    console.log('🔔 handleTogglePayment called for:', userCode)
    console.log('📋 Current expense:', expense.id, expense.description)
    setPendingPaymentUser(userCode)
    setShowPaymentProofDialog(true)
    console.log('✅ Payment proof dialog opened')
  }

  const handlePaymentProofUploaded = async (file: File) => {
    if (!pendingPaymentUser) return

    try {
      // Upload proof to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `payment_${expense.id}_${pendingPaymentUser}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      // Update expense with payment proof
      const proofs = expense.payment_proofs || {}
      proofs[pendingPaymentUser] = urlData.publicUrl

      // Update payment status
      const userCodeToPaidField: Record<string, keyof Expense> = {
        'DK': 'devid_paid',
        'LS': 'lukas_paid',
        'DF': 'dennis_paid',
        'EM': 'david_paid',
      }

      const paidField = userCodeToPaidField[pendingPaymentUser]
      if (!paidField) return

      await updateExpense({
        id: expense.id,
        [paidField]: true,
        payment_proofs: proofs,
      })

      // Create notification for expense creator
      const payerName = USERS.find(u => u.code === pendingPaymentUser)?.name
      await createNotification({
        user_code: expense.created_by,
        notification_type: 'payment_received',
        title: '💰 Zahlung erhalten',
        message: `${payerName} hat die Ausgabe "${expense.description}" bezahlt (${formatCurrency(expense.amount_per_person)})`,
        metadata: { expense_id: expense.id, payer: pendingPaymentUser },
        related_expense_id: expense.id,
      })

      // Play confetti animation
      triggerConfetti()
      toast.success('✅ Zahlung bestätigt!')
      setPendingPaymentUser(null)
    } catch (error: any) {
      console.error('Payment proof upload error:', error)
      toast.error('Fehler beim Hochladen des Zahlungsbelegs')
    }
  }

  const getUserPaymentStatus = (userCode: string): boolean => {
    const userCodeToPaidField: Record<string, keyof Expense> = {
      'DK': 'devid_paid',
      'LS': 'lukas_paid',
      'DF': 'dennis_paid',
      'EM': 'david_paid',
    }
    const paidField = userCodeToPaidField[userCode]
    const isPaid = paidField ? !!expense[paidField] : false
    console.log(`🔍 getUserPaymentStatus: userCode=${userCode}, paidField=${paidField}, isPaid=${isPaid}`)
    return isPaid
  }

  const getUserPaymentProof = (userCode: string): string | null => {
    return expense.payment_proofs?.[userCode] || null
  }

  // Filter active users (exclude time account)
  const activeUsers = USERS.filter(u => !u.isTimeAccount)
  console.log('👥 Active Users:', activeUsers.map(u => `${u.name}(${u.code})`).join(', '))
  console.log('🔐 Current User:', user?.name, `(${user?.code})`)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{expense.description}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {USERS.find((u) => u.code === expense.created_by)?.name}
                </Badge>
                <Badge variant="outline">{formatDateTime(expense.created_at)}</Badge>
                <EditedBadge
                  editedAt={expense.edited_at}
                  editedBy={expense.edited_by}
                  editedByAdmin={expense.edited_by_admin}
                />
                {expense.category && (
                  <Badge className="gap-1">
                    <Tag className="w-3 h-3" />
                    {expense.category}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className={expense.is_favorite ? 'text-yellow-500' : ''}
              >
                <Star className={`w-5 h-5 ${expense.is_favorite ? 'fill-current' : ''}`} />
              </Button>

            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Info */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Gesamtbetrag</p>
                <p className="text-2xl font-bold">{formatCurrency(expense.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pro Person</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(expense.amount_per_person)}
                </p>
              </div>
            </div>
          </Card>

          {/* Payment Status for All Users */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCheck className="w-5 h-5" />
              Zahlungsstatus
            </h3>
            <div className="space-y-2">
              {activeUsers.map(u => {
                const isPaid = getUserPaymentStatus(u.code)
                const paymentProof = getUserPaymentProof(u.code)
                const isCurrentUser = u.code === user.code
                
                console.log(`💳 Rendering payment status for ${u.name}:`, {
                  userCode: u.code,
                  isPaid,
                  isCurrentUser,
                  currentUserCode: user.code,
                  showButton: !isPaid && isCurrentUser
                })
                
                return (
                  <div key={u.code} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-user-${u.color}`}></div>
                      <span className="font-medium">{u.name}</span>
                      {isPaid && <Badge variant="default" className="bg-green-500">✓ Bezahlt</Badge>}
                      {!isPaid && <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">⏳ Ausstehend</Badge>}
                      {paymentProof && user.isAdmin && (
                        <a
                          href={paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                          📄 Beleg ansehen
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isPaid && isCurrentUser && (
                        <Button
                          size="sm"
                          onClick={() => {
                            console.log('🎯 Button clicked! Opening payment dialog for:', u.code)
                            handleTogglePayment(u.code)
                          }}
                          className="gap-2"
                        >
                          <CheckCheck className="w-4 h-4" />
                          Als bezahlt markieren
                        </Button>
                      )}
                      {isPaid && isCurrentUser && (
                        <Badge variant="default" className="bg-green-600">✅ Von dir bezahlt</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Split Status & Payment Methods */}
          {splitPayers.length > 0 ? (
            <Card className="p-4 bg-amber-500/10 border-amber-500/30">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default" className="bg-amber-500">
                    🔀 Split-Zahlung
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Die Kosten werden aufgeteilt zwischen:
                  </span>
                </div>

                {splitPayers.map((payer: any) => {
                  const payerUser = USERS.find(u => u.code === payer.user_code)
                  const payerProfile = splitPayerProfiles[payer.user_code as keyof typeof splitPayerProfiles]
                  
                  return (
                    <div key={payer.user_code} className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full bg-user-${payerUser?.color}`}></div>
                        <span className="font-semibold">{payerUser?.name}</span>
                        <Badge variant="secondary">{payer.percentage}%</Badge>
                        <span className="text-sm text-muted-foreground">
                          ({formatCurrency((expense.total_amount * payer.percentage) / 100)})
                        </span>
                      </div>

                      {payerProfile && (
                        <div className="space-y-2 ml-5">
                          {payerProfile.paypal && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">PayPal:</p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-background/50 px-2 py-1.5 rounded border">
                                  {payerProfile.paypal}
                                </code>
                                <Button
                                  size="icon"
                                  variant={copiedPayment === payerProfile.paypal ? 'default' : 'outline'}
                                  onClick={() => handleCopyPaymentMethod(payerProfile.paypal!)}
                                  className="h-7 w-7 shrink-0"
                                >
                                  {copiedPayment === payerProfile.paypal ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {payerProfile.iban && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">IBAN:</p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-background/50 px-2 py-1.5 rounded border">
                                  {payerProfile.iban}
                                </code>
                                <Button
                                  size="icon"
                                  variant={copiedPayment === payerProfile.iban ? 'default' : 'outline'}
                                  onClick={() => handleCopyPaymentMethod(payerProfile.iban!)}
                                  className="h-7 w-7 shrink-0"
                                >
                                  {copiedPayment === payerProfile.iban ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                <p className="text-xs text-muted-foreground pt-2">
                  💡 Zahlen Sie Ihren Anteil an die jeweilige Person
                </p>
              </div>
            </Card>
          ) : (
            /* Regular Payment (No Split) */
            (creatorProfile?.paypal || creatorProfile?.iban) && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    💳 Zahlungsinformationen von {USERS.find(u => u.code === expense.created_by)?.name}
                  </Label>
                  
                  {creatorProfile.paypal && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">PayPal:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background/50 px-3 py-2 rounded border">
                          {creatorProfile.paypal}
                        </code>
                        <Button
                          size="icon"
                          variant={copiedPayment === creatorProfile.paypal ? 'default' : 'outline'}
                          onClick={() => handleCopyPaymentMethod(creatorProfile.paypal!)}
                          title="Kopieren"
                          className="shrink-0"
                        >
                          {copiedPayment === creatorProfile.paypal ? (
                            <CheckCheck className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {creatorProfile.iban && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">IBAN:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background/50 px-3 py-2 rounded border">
                          {creatorProfile.iban}
                        </code>
                        <Button
                          size="icon"
                          variant={copiedPayment === creatorProfile.iban ? 'default' : 'outline'}
                          onClick={() => handleCopyPaymentMethod(creatorProfile.iban!)}
                          title="Kopieren"
                          className="shrink-0"
                        >
                          {copiedPayment === creatorProfile.iban ? (
                            <CheckCheck className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    💡 Verwenden Sie diese Information, um {USERS.find(u => u.code === expense.created_by)?.name} zu bezahlen
                  </p>
                </div>
              </Card>
            )
          )}

          {/* Tags */}
          {expense.tags && expense.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {expense.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Receipts Gallery */}
          {receipts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Rechnungen ({receipts.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {receipts.map((receipt) => (
                  <a
                    key={receipt.id}
                    href={receipt.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    {receipt.receipt_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={receipt.receipt_url}
                        alt={receipt.receipt_filename}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-secondary rounded-lg border">
                        <p className="text-sm text-center p-2 truncate">
                          {receipt.receipt_filename}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reactions */}
          <div>
            <h3 className="font-semibold mb-3">Reaktionen</h3>
            <div className="flex flex-wrap gap-2">
              {REACTION_EMOJIS.map(({ emoji, icon: Icon, label }) => {
                const count = getReactionCount(emoji)
                const active = hasUserReacted(emoji)
                return (
                  <Button
                    key={emoji}
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleReaction(emoji)}
                    className="gap-2"
                  >
                    <span className="text-lg">{emoji}</span>
                    {count > 0 && <span className="text-xs">{count}</span>}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Kommentare ({comments.length})
            </h3>
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full bg-user-${
                          USERS.find((u) => u.code === comment.user_code)?.color
                        }`}
                      />
                      <span className="font-semibold text-sm">
                        {USERS.find((u) => u.code === comment.user_code)?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                    {(user.isAdmin || user.code === comment.user_code) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteComment(comment.id)}
                        className="h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </Card>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Kommentar hinzufügen..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                />
                <Button onClick={handleAddComment} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Proof Upload Dialog */}
        <PaymentProofDialog
          open={showPaymentProofDialog}
          onOpenChange={setShowPaymentProofDialog}
          onConfirm={handlePaymentProofUploaded}
          payerName={USERS.find(u => u.code === pendingPaymentUser)?.name || ''}
        />
      </DialogContent>
    </Dialog>
  )
}
