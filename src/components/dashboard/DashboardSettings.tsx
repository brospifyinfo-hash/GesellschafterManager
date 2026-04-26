import { useState } from 'react'
import { useDashboardSettings } from '@/hooks/useDashboardSettings'
import { ColorCustomizer } from './ColorCustomizer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RotateCcw, Palette } from 'lucide-react'

interface DashboardSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DashboardSettings({ open, onOpenChange }: DashboardSettingsProps) {
  const { widgets, toggleWidget, resetToDefault } = useDashboardSettings()
  const [colorCustomizerOpen, setColorCustomizerOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard anpassen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Design Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4" />
              <Label className="text-base font-semibold">Design</Label>
            </div>
            <Button
              variant="outline"
              onClick={() => setColorCustomizerOpen(true)}
              className="w-full"
            >
              <Palette className="w-4 h-4 mr-2" />
              Farben & Dark Mode
            </Button>
          </div>

          {/* Widget Toggles */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Widgets anzeigen</Label>
            <div className="space-y-3">
              {widgets.map((widget) => (
                <Card key={widget.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={widget.id} className="cursor-pointer">
                      {widget.title}
                    </Label>
                    <Switch
                      id={widget.id}
                      checked={widget.enabled}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={resetToDefault}
            className="w-full gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Auf Standard zurücksetzen
          </Button>
        </div>
      </DialogContent>

      <ColorCustomizer open={colorCustomizerOpen} onOpenChange={setColorCustomizerOpen} />
    </Dialog>
  )
}
