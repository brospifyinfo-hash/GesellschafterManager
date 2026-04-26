import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useQueryClient } from '@tanstack/react-query'
import { DashboardSettings } from '@/components/dashboard/DashboardSettings'
import { GhostSwitchDialog } from '@/components/admin/GhostSwitchDialog'
import { TextEditorDialog } from '@/components/admin/TextEditorDialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Lock, 
  LogOut, 
  Palette, 
  Bell,
  Camera,
  Shield,
  TrendingUp,
  Clock,
  Wallet,
  Trophy,
  Award,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDashboardSettings } from '@/hooks/useDashboardSettings'
import { useExpenses } from '@/hooks/useExpenses'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useAccounts } from '@/hooks/useAccounts'
import { useAchievements } from '@/hooks/useAchievements'
import { formatCurrency } from '@/lib/calculations'
import { calculateUserStats } from '@/lib/calculations'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDashboardSettings()
  const queryClient = useQueryClient()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [ghostSwitchOpen, setGhostSwitchOpen] = useState(false)
  const [textEditorOpen, setTextEditorOpen] = useState(false)
  
  const [changePinDialog, setChangePinDialog] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [bio, setBio] = useState('')
  const [paypal, setPaypal] = useState('')
  const [iban, setIban] = useState('')
  const [companyPaypal, setCompanyPaypal] = useState('')
  const [companyIban, setCompanyIban] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Safe null check at the very top
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Bitte melden Sie sich an</p>
      </div>
    )
  }
  
  // Safe hooks with try-catch and defaults
  let profile = null
  let uploadAvatar = () => {}
  let updateProfile = () => {}
  let isLoadingProfile = true
  
  try {
    const profileHook = useProfile(user?.code)
    profile = profileHook.profile
    uploadAvatar = profileHook.uploadAvatar
    updateProfile = profileHook.updateProfile
    isLoadingProfile = profileHook.isLoading
  } catch (err) {
    console.error('Profile hook error:', err)
  }

  const { expenses = [], isLoading: isLoadingExpenses } = useExpenses()
  const { timeEntries = [], manualEntries = [], isLoading: isLoadingTime } = useTimeEntries()
  const { accounts = [], isLoading: isLoadingAccounts } = useAccounts()
  
  let achievements: any[] = []
  let isLoadingAchievements = true
  let getUserAchievements = (code: string) => []
  
  try {
    const achievementsHook = useAchievements()
    achievements = achievementsHook.achievements || []
    isLoadingAchievements = achievementsHook.loading
    getUserAchievements = achievementsHook.getUserAchievements || (() => [])
  } catch (err) {
    console.error('Achievements hook error:', err)
  }

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '')
      setPaypal(profile.paypal || '')
      setIban(profile.iban || '')
      setCompanyPaypal(profile.company_paypal || '')
      setCompanyIban(profile.company_iban || '')
    }
  }, [profile])

  const isLoading = isLoadingExpenses || isLoadingTime || isLoadingAccounts || isLoadingProfile || isLoadingAchievements

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Lade Profil...</p>
        </div>
      </div>
    )
  }

  // Safe data extraction with defaults and null checks
  const userAccount = Array.isArray(accounts) ? accounts.find((a) => a?.user_code === user.code) : null
  
  let stats = { totalPaid: 0, totalHours: 0, percentage: 0 }
  try {
    const allStats = calculateUserStats(
      Array.isArray(expenses) ? expenses : [], 
      Array.isArray(timeEntries) ? timeEntries : [], 
      Array.isArray(manualEntries) ? manualEntries : []
    )
    stats = allStats[user.code as keyof typeof allStats] || stats
  } catch (err) {
    console.error('Stats calculation error:', err)
  }

  let myAchievements: any[] = []
  try {
    myAchievements = typeof getUserAchievements === 'function' 
      ? getUserAchievements(user.code) || [] 
      : []
  } catch (err) {
    console.error('Get user achievements error:', err)
  }

  const handleChangePin = async () => {
    if (!user) return
    
    if (currentPin !== user.password) {
      toast.error('Aktuelle PIN ist falsch')
      return
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('PIN muss 4 Ziffern enthalten')
      return
    }
    if (newPin !== confirmPin) {
      toast.error('PINs stimmen nicht überein')
      return
    }

    toast.info('PIN-Änderung ist nur für die aktuelle Session gültig')
    setChangePinDialog(false)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    toast.success('PIN erfolgreich geändert')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie ein Bild')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild zu groß (max. 5MB)')
      return
    }

    try {
      const uploadToast = toast.loading('Profilbild wird hochgeladen...')
      await uploadAvatar({ userCode: user.code, file })
      toast.dismiss(uploadToast)
      queryClient.invalidateQueries({ queryKey: ['profile', user.code] })
    } catch (error) {
      console.error('Avatar upload error:', error)
    }
  }

  const handleSaveProfile = async () => {
    // Validate that all payment methods are provided
    if (!paypal.trim() || !iban.trim() || !companyPaypal.trim() || !companyIban.trim()) {
      toast.error('Bitte geben Sie alle Zahlungsmethoden an (Privat + Firma)')
      return
    }

    try {
      await updateProfile({
        userCode: user.code,
        updates: { bio, paypal, iban, company_paypal: companyPaypal, company_iban: companyIban },
      })
      toast.success('Profil gespeichert!')
    } catch (error) {
      console.error('Profile update error:', error)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Erfolgreich abgemeldet')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Profil & Einstellungen</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihr Konto und Ihre Einstellungen</p>
        </div>
        <Button
          onClick={() => setSettingsOpen(true)}
          variant="outline"
          size="icon"
          className="rounded-full"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className={`bg-user-${user.color} text-white text-3xl`}>
                {user.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground mb-2">@{user.code}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {user.isAdmin && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <Shield className="w-4 h-4" />
                  Administrator
                </div>
              )}
              {Array.isArray(myAchievements) && myAchievements.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full text-sm">
                  <Trophy className="w-4 h-4" />
                  {myAchievements.length} Achievement{myAchievements.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verfügbar</p>
              <p className="text-xl font-bold">{formatCurrency(userAccount?.free_available || 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gesamtstunden</p>
              <p className="text-xl font-bold">{stats.totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Beteiligung</p>
              <p className="text-xl font-bold">{stats.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Achievements Section */}
      {Array.isArray(myAchievements) && myAchievements.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Meine Achievements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {myAchievements.slice(0, 8).map((achievement: any) => (
              <div
                key={achievement.id}
                className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200 dark:border-yellow-900 text-center hover:scale-105 transition-transform"
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="text-sm font-semibold line-clamp-1">{achievement.title}</p>
                <Badge variant="secondary" className="text-xs mt-2">
                  {new Date(achievement.earned_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                </Badge>
              </div>
            ))}
          </div>
          {myAchievements.length > 8 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              + {myAchievements.length - 8} weitere Achievement{myAchievements.length - 8 !== 1 ? 's' : ''}
            </p>
          )}
        </Card>
      )}

      {/* Settings Sections */}
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Einstellungen
          </h3>
          <div className="space-y-2">
            <Button onClick={() => setSettingsOpen(true)} variant="outline" className="w-full gap-2">
              <Palette className="w-4 h-4" />
              Design anpassen (Farben & Widgets)
            </Button>
            <Button onClick={() => setChangePinDialog(true)} variant="outline" className="w-full gap-2">
              <Lock className="w-4 h-4" />
              Passwort ändern
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Benachrichtigungen
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push-Benachrichtigungen</p>
                <p className="text-sm text-muted-foreground">
                  Benachrichtigungen bei neuen Ausgaben
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Automatische Sicherung</p>
                <p className="text-sm text-muted-foreground">
                  Daten automatisch sichern
                </p>
              </div>
              <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Persönliche Informationen
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Erzählen Sie etwas über sich..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground">💰 Privat-Konto</h4>
                <div className="space-y-2">
                  <Label htmlFor="paypal">PayPal Email *</Label>
                  <Input
                    id="paypal"
                    type="email"
                    placeholder="privat@example.com"
                    value={paypal}
                    onChange={(e) => setPaypal(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN *</Label>
                  <Input
                    id="iban"
                    placeholder="DE89 3704 0044..."
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground">🏢 Firmen-Konto</h4>
                <div className="space-y-2">
                  <Label htmlFor="company-paypal">PayPal Email *</Label>
                  <Input
                    id="company-paypal"
                    type="email"
                    placeholder="firma@example.com"
                    value={companyPaypal}
                    onChange={(e) => setCompanyPaypal(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-iban">IBAN *</Label>
                  <Input
                    id="company-iban"
                    placeholder="DE89 3704 0044..."
                    value={companyIban}
                    onChange={(e) => setCompanyIban(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">💡 Wichtig:</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Alle 4 Zahlungsmethoden (Privat + Firma) sind Pflicht und werden bei Ausgaben automatisch angezeigt, je nachdem ob die Rechnung als "Privat" oder "Firma" markiert wurde.
              </p>
            </div>

            <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
              Profil speichern
            </Button>
          </div>
        </div>

        <Separator />

        {user.isAdmin && (
          <>
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin-Funktionen
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={() => setGhostSwitchOpen(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  👻 Ghost Switch Mode
                </Button>
                <Button
                  onClick={() => setTextEditorOpen(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  📝 Text Editor
                </Button>
              </div>
            </div>
            <Separator />
          </>
        )}

        <div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>
      </Card>

      {/* Change PIN Dialog */}
      <Dialog open={changePinDialog} onOpenChange={setChangePinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PIN ändern</DialogTitle>
            <DialogDescription>
              Ändern Sie Ihre 4-stellige PIN
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current">Aktuelle PIN</Label>
              <Input
                id="current"
                type="password"
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="••••"
              />
            </div>
            <div>
              <Label htmlFor="new">Neue PIN</Label>
              <Input
                id="new"
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••"
              />
            </div>
            <div>
              <Label htmlFor="confirm">PIN bestätigen</Label>
              <Input
                id="confirm"
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleChangePin} className="flex-1">
                Bestätigen
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setChangePinDialog(false)
                  setCurrentPin('')
                  setNewPin('')
                  setConfirmPin('')
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DashboardSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GhostSwitchDialog open={ghostSwitchOpen} onOpenChange={setGhostSwitchOpen} />
      <TextEditorDialog open={textEditorOpen} onOpenChange={setTextEditorOpen} />
    </div>
  )
}
