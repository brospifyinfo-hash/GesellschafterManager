import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Ghost, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function GhostModeExitButton() {
  const { isGhostMode, originalUser, exitGhostMode } = useAuth()

  if (!isGhostMode || !originalUser) return null

  const handleExitGhost = () => {
    exitGhostMode()
    toast.success(`✅ Zurück als ${originalUser.name}`, {
      description: 'Ghost Mode beendet',
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <Button
          onClick={handleExitGhost}
          size="lg"
          className="rounded-full shadow-2xl bg-orange-500 hover:bg-orange-600 text-white gap-2 h-14 px-6 animate-pulse-slow"
        >
          <Ghost className="w-5 h-5" />
          <span className="font-bold">Ghost Mode beenden</span>
          <X className="w-5 h-5" />
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
