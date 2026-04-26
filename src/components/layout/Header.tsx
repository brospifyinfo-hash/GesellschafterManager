
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { USERS } from '@/constants/users'
import { BookHeart, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function Header() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.code)
  const { isUserOnline } = useOnlineStatus()

  if (!user) return null

  const regularUsers = USERS.filter((u) => !u.isTimeAccount)
  const onlineUsers = regularUsers.filter((u) => isUserOnline(u.code))

  return (
    <header className="glass-strong apple-shadow-lg border-b sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-primary glow-primary">
              <BookHeart className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Julins Buch
              </h1>
              <p className="text-xs text-muted-foreground">Gemeinsam Verwalten</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Online Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {onlineUsers.length}/{regularUsers.length}
              </span>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Avatar className="w-8 h-8 md:w-10 md:h-10 ring-2 ring-primary/20">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} />
                  ) : null}
                  <AvatarFallback className={cn('text-white text-xs md:text-sm', `bg-user-${user.color}`)}>
                    {user.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {isUserOnline(user.code) && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-background animate-pulse-glow" />
                )}
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-sm md:text-base">{user.name}</p>
                {user.isAdmin && (
                  <p className="text-xs text-primary font-medium">Administrator</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
