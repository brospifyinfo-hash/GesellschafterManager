import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, Calendar, TrendingUp, Clock } from 'lucide-react'

export function RevenueInfoCard() {
  return (
    <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 space-y-3">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            Wichtige Informationen zur Umsatzverteilung
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Umsatz-Intervall: Alle 2 Wochen
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  Der Umsatz wird alle 2 Wochen eingetragen. Die monatliche Historie fasst beide Einträge zusammen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Automatische Aufteilung
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  55% → Steuerrücklage (nicht auszahlbar) • 45% → Verteilung nach Anteilen
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Verteilung auf Konten
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  Von den 45%: 20% → Privatkonto (auszahlbar) • 80% → Firmenkonto (nicht auszahlbar)
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white dark:bg-blue-950">
                💰 Alle 2 Wochen eintragen
              </Badge>
              <Badge variant="outline" className="bg-white dark:bg-blue-950">
                📊 Automatische Berechnung
              </Badge>
              <Badge variant="outline" className="bg-white dark:bg-blue-950">
                🎯 Nach Beteiligung verteilt
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
