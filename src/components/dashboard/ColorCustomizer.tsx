import { useState, useEffect } from 'react'
import { useDashboardSettings } from '@/hooks/useDashboardSettings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Moon, Sun, Palette, Sparkles, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface ColorCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ColorCustomizer({ open, onOpenChange }: ColorCustomizerProps) {
  const { isDarkMode, toggleDarkMode, customColors, setCustomColors } = useDashboardSettings()
  
  const [primary, setPrimary] = useState(customColors?.primary || '#8B5CF6')
  const [secondary, setSecondary] = useState(customColors?.secondary || '#10B981')
  const [accent, setAccent] = useState(customColors?.accent || '#F59E0B')
  const [background, setBackground] = useState(customColors?.background || '#FFFFFF')

  // Load saved colors on mount
  useEffect(() => {
    if (customColors) {
      setPrimary(customColors.primary)
      setSecondary(customColors.secondary)
      setAccent(customColors.accent)
      setBackground(customColors.background)
    }
  }, [customColors])

  const handleSaveColors = () => {
    const colors = { primary, secondary, accent, background }
    setCustomColors(colors)
    
    // Apply colors to CSS variables immediately
    const root = document.documentElement
    root.style.setProperty('--custom-primary', primary)
    root.style.setProperty('--custom-secondary', secondary)
    root.style.setProperty('--custom-accent', accent)
    root.style.setProperty('--custom-background', background)
    
    toast.success('Farben gespeichert!')
  }

  const handleResetColors = () => {
    setPrimary('#8B5CF6')
    setSecondary('#10B981')
    setAccent('#F59E0B')
    setBackground('#FFFFFF')
    setCustomColors(null)
    
    // Remove custom CSS variables
    const root = document.documentElement
    root.style.removeProperty('--custom-primary')
    root.style.removeProperty('--custom-secondary')
    root.style.removeProperty('--custom-accent')
    root.style.removeProperty('--custom-background')
    
    toast.success('Auf Standard zurückgesetzt!')
  }

  const presets = [
    { name: 'Lila Power', primary: '#8B5CF6', secondary: '#10B981', accent: '#F59E0B' },
    { name: 'Ocean Blue', primary: '#3B82F6', secondary: '#06B6D4', accent: '#F59E0B' },
    { name: 'Forest Green', primary: '#10B981', secondary: '#059669', accent: '#FBBF24' },
    { name: 'Sunset Orange', primary: '#F97316', secondary: '#FB923C', accent: '#FCD34D' },
    { name: 'Pink Dream', primary: '#EC4899', secondary: '#F472B6', accent: '#FBBF24' },
    { name: 'Dark Knight', primary: '#1F2937', secondary: '#374151', accent: '#9CA3AF' },
  ]

  const applyPreset = (preset: typeof presets[0]) => {
    setPrimary(preset.primary)
    setSecondary(preset.secondary)
    setAccent(preset.accent)
    toast.success(`Vorlage "${preset.name}" geladen!`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Individuelles Design
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie Ihr einzigartiges Farbschema
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Eigene Farben</TabsTrigger>
            <TabsTrigger value="presets">Vorlagen</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-6">
            {/* Dark Mode Toggle */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-primary" />
                  ) : (
                    <Sun className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <Label className="text-base font-semibold">
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isDarkMode
                        ? 'Dunkles Design aktiviert'
                        : 'Helles Design aktiviert'}
                    </p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </Card>

            {/* Color Pickers */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primärfarbe (Buttons, Highlights)</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    placeholder="#8B5CF6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sekundärfarbe (Hintergründe, Karten)</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Akzentfarbe (Hervorhebungen)</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    placeholder="#F59E0B"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hintergrundfarbe</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Live Vorschau</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg" style={{ backgroundColor: primary, color: 'white' }}>
                  <p className="font-medium">Primärfarbe</p>
                  <p className="text-sm opacity-90">Buttons & wichtige Elemente</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: secondary, color: 'white' }}>
                  <p className="font-medium">Sekundärfarbe</p>
                  <p className="text-sm opacity-90">Hintergründe & Karten</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: accent, color: 'white' }}>
                  <p className="font-medium">Akzentfarbe</p>
                  <p className="text-sm opacity-90">Hervorgehobene Elemente</p>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSaveColors} className="flex-1">
                <Palette className="w-4 h-4 mr-2" />
                Farben übernehmen
              </Button>
              <Button onClick={handleResetColors} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Zurücksetzen
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wählen Sie eine Vorlage und passen Sie sie nach Ihren Wünschen an
            </p>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <Card
                  key={preset.name}
                  className="p-4 cursor-pointer hover:scale-105 transition-transform hover:ring-2 ring-primary"
                  onClick={() => applyPreset(preset)}
                >
                  <h4 className="font-semibold mb-3">{preset.name}</h4>
                  <div className="flex gap-2">
                    <div
                      className="w-full h-12 rounded"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-full h-12 rounded"
                      style={{ backgroundColor: preset.secondary }}
                    />
                    <div
                      className="w-full h-12 rounded"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                </Card>
              ))}
            </div>
            <Button onClick={handleSaveColors} className="w-full">
              <Palette className="w-4 h-4 mr-2" />
              Gewählte Farben übernehmen
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
