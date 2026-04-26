import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { USERS } from '@/constants/users'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Ghost, User, LogOut, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface GhostSwitchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GhostSwitchDialog({ open, onOpenChange }: GhostSwitchDialogProps) {
  const { user, ghostLogin, exitGhostMode, isGhostMode, originalUser } = useAuth()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  if (!user || !user.isAdmin) return null

  const handleGhostSwitch = (userCode: string) => {
    const targetUser = USERS.find(u => u.code === userCode)
    if (!targetUser) return

    ghostLogin({
      code: targetUser.code,
      name: targetUser.name,
      password: targetUser.password,
      isAdmin: targetUser.isAdmin,
      isTimeAccount: targetUser.isTimeAccount || false,
      color: targetUser.color,
    })

    toast.success(`👻 Ghost Mode: Jetzt als ${targetUser.name}`, {
      description: 'Sie können jetzt alles wie dieser Benutzer sehen und bedienen',
    })
    
    onOpenChange(false)
  }

  const handleExitGhost = () => {
    exitGhostMode()
    toast.success('✅ Ghost Mode beendet', {
      description: 'Sie sind wieder als Administrator angemeldet',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ghost className="w-5 h-5" />
            Ghost Switch Mode
          </DialogTitle>
          <DialogDescription>
            Als Administrator können Sie in jeden Account springen und alles wie der echte Benutzer sehen
          </DialogDescription>
        </DialogHeader>

        {isGhostMode && originalUser && (
          <Card className="p-4 bg-orange-500/10 border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ghost className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold">Ghost Mode aktiv</p>
                  <p className="text-sm text-muted-foreground">
                    Angemeldet als: {user.name} (Original: {originalUser.name})
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExitGhost}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Ghost Mode beenden
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Benutzer auswählen</h3>
          <div className="grid grid-cols-2 gap-3">
            {USERS.filter(u => !u.isTimeAccount).map((u) => {
              const isCurrentUser = user.code === u.code && !isGhostMode
              const isGhostActive = isGhostMode && user.code === u.code

              return (
                <Card
                  key={u.code}
                  className={`p-4 cursor-pointer hover:scale-105 transition-transform ${
                    isGhostActive ? 'ring-2 ring-orange-500 bg-orange-500/5' : ''
                  } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!isCurrentUser) {
                      handleGhostSwitch(u.code)
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-12 h-12 rounded-full bg-user-${u.color} flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {u.name.substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">@{u.code}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {u.isAdmin && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </Badge>
                    )}
                    {isGhostActive && (
                      <Badge variant="default" className="text-xs gap-1 bg-orange-500">
                        <Ghost className="w-3 h-3" />
                        Aktiv
                      </Badge>
                    )}
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">
                        Sie
                      </Badge>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p className="font-semibold mb-1">⚠️ Wichtige Hinweise:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Im Ghost Mode können Sie alles sehen und bearbeiten wie der gewählte Benutzer</li>
            <li>Alle Änderungen werden unter dem Ghost-Account gespeichert</li>
            <li>Klicken Sie auf "Ghost Mode beenden", um zurück zu wechseln</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
