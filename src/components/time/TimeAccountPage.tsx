import { useState } from 'react'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useAuth } from '@/hooks/useAuth'
import { USERS } from '@/constants/users'
import { Card } from '@/components/ui/card'
import { Clock, LogOut } from 'lucide-react'
import { formatDateTime, formatHours } from '@/lib/calculations'
import { Button } from '@/components/ui/button'

export function TimeAccountPage() {
  const { timeEntries, checkIn, checkOut } = useTimeEntries()
  const { logout } = useAuth()

  const regularUsers = USERS.filter((u) => !u.isTimeAccount)

  const getUserActiveEntry = (userCode: string) => {
    return timeEntries.find(
      (entry) => entry.user_code === userCode && !entry.check_out
    )
  }

  const getUserTotalHours = (userCode: string) => {
    const entries = timeEntries.filter((e) => e.user_code === userCode && e.duration_minutes)
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
    return totalMinutes / 60
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background p-3 md:p-4">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <Card className="glass apple-shadow p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Zeiterfassung</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Für alle Mitarbeiter ein- und auschecken
              </p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        </Card>

        {/* User Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

          {regularUsers.map((u) => {
            const activeEntry = getUserActiveEntry(u.code)
            const totalHours = getUserTotalHours(u.code)

            return (
              <Card key={u.code} className="glass apple-shadow p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 md:gap-4 mb-4">
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-user-${u.color} flex items-center justify-center text-white text-xl md:text-2xl font-bold`}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold">{u.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Gesamt: {formatHours(totalHours)}
                      </p>
                    </div>
                  </div>

                  {!activeEntry ? (
                    <Button
                      onClick={() => checkIn(u.code)}
                      className="w-full h-14 md:h-16 text-base md:text-lg gap-2 md:gap-3"
                    >
                      <Clock className="w-4 h-4 md:w-5 md:h-5" />
                      Einchecken
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="glass bg-primary/5 p-3 rounded-lg">
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">
                          Eingecheckt seit:
                        </p>
                        <p className="text-sm md:text-base font-semibold">
                          {formatDateTime(activeEntry.check_in)}
                        </p>
                      </div>
                      <Button
                        onClick={() => checkOut(activeEntry.id)}
                        variant="destructive"
                        className="w-full h-12 md:h-14 text-base md:text-lg gap-2 md:gap-3"
                      >
                        <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                        Auschecken
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
