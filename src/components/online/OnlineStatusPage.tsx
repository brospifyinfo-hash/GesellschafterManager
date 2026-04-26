import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, Activity, User } from 'lucide-react'
import { USERS } from '@/constants/users'
import { useProfile } from '@/hooks/useProfile'

export function OnlineStatusPage() {
  const { userStatuses, isLoading } = useOnlineStatus()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Lade Status...</p>
        </div>
      </div>
    )
  }

  const activeUsers = USERS.filter(u => !u.isTimeAccount)
  const anyCheckedIn = userStatuses.some(s => s.isCheckedIn)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Team Status</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Übersicht wer gerade eingecheckt (gestempelt) ist
        </p>
      </div>

      {/* Overall Status Banner */}
      <Card className={`glass apple-shadow p-6 border-2 ${
        anyCheckedIn 
          ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
          : 'border-gray-300 dark:border-gray-700'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            anyCheckedIn 
              ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' 
              : 'bg-gray-400'
          }`}>
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${
              anyCheckedIn ? 'text-green-600 dark:text-green-400' : 'text-gray-600'
            }`}>
              {anyCheckedIn ? '🟢 AKTIV' : '⚫ OFFLINE'}
            </h2>
            <p className="text-muted-foreground">
              {anyCheckedIn 
                ? `${userStatuses.filter(s => s.isCheckedIn).length} Person(en) eingecheckt` 
                : 'Niemand ist gerade eingecheckt'}
            </p>
          </div>
        </div>
      </Card>

      {/* User Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeUsers.map((u) => {
          const status = userStatuses.find(s => s.userCode === u.code)
          const isCheckedIn = status?.isCheckedIn || false
          const isOnline = status?.isOnline || false
          
          return (
            <UserStatusCard 
              key={u.code} 
              user={u} 
              isCheckedIn={isCheckedIn}
              isOnline={isOnline}
              checkInTime={status?.checkInTime}
            />
          )
        })}
      </div>

      {/* Legend */}
      <Card className="glass apple-shadow p-4 border">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Legende
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span><strong className="text-green-600 dark:text-green-400">Eingecheckt:</strong> Person hat aktiv eingecheckt (gestempelt) und nicht ausgecheckt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span><strong className="text-blue-600 dark:text-blue-400">Online:</strong> In den letzten 15 Minuten eingeloggt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span><strong>Offline:</strong> Nicht eingecheckt oder längere Zeit nicht eingeloggt</span>
          </div>
          <p className="text-xs italic mt-3 pt-3 border-t">
            🔄 Aktualisiert automatisch alle 10 Sekunden
          </p>
        </div>
      </Card>
    </div>
  )
}

function UserStatusCard({ 
  user, 
  isCheckedIn, 
  isOnline,
  checkInTime 
}: { 
  user: typeof USERS[0]
  isCheckedIn: boolean
  isOnline: boolean
  checkInTime?: string
}) {
  const { profile } = useProfile(user.code)

  const getTimeSinceCheckIn = () => {
    if (!checkInTime) return null
    const now = new Date()
    const checkIn = new Date(checkInTime)
    const diffMs = now.getTime() - checkIn.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <Card className={`glass apple-shadow p-6 border-2 transition-all ${
      isCheckedIn 
        ? `border-${user.color}/50 bg-${user.color}/5` 
        : 'border-gray-200 dark:border-gray-800'
    }`}>
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="w-16 h-16 border-2 border-background">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className={`bg-user-${user.color} text-white text-xl`}>
              {user.name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center ${
            isCheckedIn 
              ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' 
              : isOnline
              ? 'bg-blue-500'
              : 'bg-gray-400'
          }`}>
            {isCheckedIn ? (
              <Clock className="w-3 h-3 text-white" />
            ) : isOnline ? (
              <User className="w-3 h-3 text-white" />
            ) : null}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{user.name}</h3>
          
          <div className="space-y-2">
            {/* Check-in Status */}
            <div className="flex items-center gap-2">
              <Badge variant={isCheckedIn ? 'default' : 'secondary'} className={
                isCheckedIn ? 'bg-green-600' : ''
              }>
                {isCheckedIn ? '✓ EINGECHECKT' : 'Nicht eingecheckt'}
              </Badge>
              {isCheckedIn && checkInTime && (
                <span className="text-xs text-muted-foreground">
                  seit {getTimeSinceCheckIn()}
                </span>
              )}
            </div>

            {/* Online Status */}
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? 'default' : 'outline'} className={
                isOnline ? 'bg-blue-600' : ''
              }>
                {isOnline ? '⚡ ONLINE' : 'Offline'}
              </Badge>
            </div>

            {/* Additional Info */}
            {isCheckedIn && (
              <div className="mt-3 p-2 bg-secondary/30 rounded text-xs text-muted-foreground">
                <p>🕐 Aktive Arbeitssitzung läuft</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
