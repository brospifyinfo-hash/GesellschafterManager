import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Lock, User } from 'lucide-react'
import { toast } from 'sonner'

export function LoginForm() {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const success = await login(code, password)
    
    if (success) {
      toast.success('Erfolgreich angemeldet!')
    } else {
      toast.error('Ungültige Anmeldedaten')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <Card className="glass apple-shadow-lg w-full max-w-md p-8 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Gesellschafter Manager</h1>
          <p className="text-muted-foreground">
            Melden Sie sich mit Ihren Zugangsdaten an
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Benutzername</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="code"
                type="text"
                placeholder="z.B. DK"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
          </Button>
        </form>

        <div className="pt-4 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Finanz- und Zeitverwaltung für Gesellschafter
          </p>
        </div>
      </Card>
    </div>
  )
}
