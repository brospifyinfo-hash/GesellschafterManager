import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Expense } from '@/types'

interface ReceiptDialogProps {
  expense: Expense
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiptDialog({ expense, open, onOpenChange }: ReceiptDialogProps) {
  if (!expense.receipt_url) return null

  const isPDF = expense.receipt_filename?.toLowerCase().endsWith('.pdf')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Rechnung: {expense.description}</DialogTitle>
          <DialogDescription>
            {expense.receipt_filename}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="w-full h-[500px] bg-muted rounded-lg overflow-hidden">
            {isPDF ? (
              <iframe
                src={expense.receipt_url}
                className="w-full h-full"
                title="Receipt PDF"
              />
            ) : (
              <img
                src={expense.receipt_url}
                alt="Receipt"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(expense.receipt_url!, '_blank')}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Herunterladen
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
