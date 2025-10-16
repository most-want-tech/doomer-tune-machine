import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { CloudArrowUp, Play, Pause, Stop, DownloadSimple, FloppyDisk, Trash, Info } from '@phosphor-icons/react'
import { useAudioProcessor, DEFAULT_EFFECTS, type AudioEffects } from '@/hooks/use-audio-processor'
import { WaveformDisplay } from '@/components/waveform-display'
import { toast, Toaster } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Preset {
  name: string
  effects: AudioEffects
}

const EFFECT_INFO = {
  delayTime: {
    name: 'Delay Time',
    description: 'Controls how long it takes for the delayed signal to repeat. Longer times create more spaced-out echoes.'
  },
  delayFeedback: {
    name: 'Delay Feedback',
    description: 'Determines how many times the delay repeats. Higher values create more echoes that fade gradually.'
  },
  reverbMix: {
    name: 'Reverb Mix',
    description: 'Blends the reverb effect with the dry signal. Higher values create a more spacious, ambient sound.'
  },
  reverbDecay: {
    name: 'Reverb Decay',
    description: 'Controls how long the reverb tail lasts. Longer decay simulates larger spaces like halls or cathedrals.'
  },
  noiseLevel: {
    name: 'Noise Level',
    description: 'Adds analog-style background noise for a vintage tape or cassette feel. Subtle amounts add warmth.'
  },
  vinylCrackle: {
    name: 'Vinyl Crackle',
    description: 'Simulates the pops and crackles of vinyl records for an authentic retro sound aesthetic.'
  },
  lowPassFreq: {
    name: 'Low Pass Filter',
    description: 'Cuts high frequencies above the set value. Lower settings create a muffled, distant, or underwater sound.'
  },
  highPassFreq: {
    name: 'High Pass Filter',
    description: 'Cuts low frequencies below the set value. Higher settings thin out the sound and remove bass rumble.'
  },
  pitchShift: {
    name: 'Pitch Shift',
    description: 'Changes the pitch without affecting speed. Negative values create darker tones, positive values brighten.'
  },
  playbackRate: {
    name: 'Playback Speed',
    description: 'Changes both pitch and speed together. Lower values create a slowed-down, dreamy effect.'
  }
}

function App() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [effects, setEffects] = useState<AudioEffects>(DEFAULT_EFFECTS)
  const [volume, setVolume] = useState(0.7)
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [presets, setPresets] = useKV<Preset[]>('doomer-presets', [])
  const [newPresetName, setNewPresetName] = useState('')
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    loadAudioFile,
    play,
    pause,
    stop,
    seek,
    setVolume: setAudioVolume,
    updateEffects,
    exportAudio,
    isPlaying,
    currentTime,
    duration,
  } = useAudioProcessor()

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file (MP3, WAV, OGG)')
      return
    }

    try {
      const buffer = await loadAudioFile(file)
      setAudioBuffer(buffer)
      setFileName(file.name)
      toast.success('Audio loaded successfully')
    } catch (error) {
      toast.error('Failed to load audio file')
      console.error(error)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleEffectChange = (key: keyof AudioEffects, value: number | boolean) => {
    const newEffects = { ...effects, [key]: value }
    setEffects(newEffects)
    updateEffects(newEffects)
  }

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0]
    setVolume(vol)
    setAudioVolume(vol)
  }

  const handleExport = async () => {
    if (!audioBuffer) {
      toast.error('No audio loaded')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    const progressInterval = setInterval(() => {
      setExportProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      const blob = await exportAudio(effects)
      clearInterval(progressInterval)
      setExportProgress(100)

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `doomer-${fileName.replace(/\.[^/.]+$/, '')}.wav`
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      // Append before click to satisfy Safari's download requirements.
      requestAnimationFrame(() => {
        anchor.click()
        requestAnimationFrame(() => {
          URL.revokeObjectURL(url)
          anchor.remove()
        })
      })

      toast.success('Audio exported successfully')
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)
    } catch (error) {
      clearInterval(progressInterval)
      toast.error('Failed to export audio')
      console.error(error)
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    setPresets((current) => [
      ...(current || []),
      { name: newPresetName, effects: { ...effects } }
    ])
    
    toast.success(`Preset "${newPresetName}" saved`)
    setNewPresetName('')
    setIsPresetDialogOpen(false)
  }

  const handleLoadPreset = (presetName: string) => {
    const preset = (presets || []).find(p => p.name === presetName)
    if (preset) {
      setEffects(preset.effects)
      updateEffects(preset.effects)
      toast.success(`Loaded preset "${presetName}"`)
    }
  }

  const handleDeletePreset = (presetName: string) => {
    setPresets((current) => (current || []).filter(p => p.name !== presetName))
    toast.success(`Deleted preset "${presetName}"`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Toaster position="top-center" theme="dark" />
      <TooltipProvider>
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-primary tracking-tight">Doomer Mix Maker</h1>
            <p className="text-muted-foreground">Transform your tracks into melancholic masterpieces</p>
          </header>

          <Card className="p-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <CloudArrowUp className="mx-auto mb-4 text-primary" size={48} />
              <p className="text-lg mb-2">
                {fileName || 'Drop your audio file here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground">Supports MP3, WAV, OGG</p>
            </div>
          </Card>

          {audioBuffer && (
            <>
              <Card className="p-6 space-y-4">
                <WaveformDisplay
                  audioBuffer={audioBuffer}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={seek}
                />
                
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={isPlaying ? pause : play}
                      variant="default"
                      size="lg"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </Button>
                    <Button onClick={() => stop()} variant="secondary" size="lg">
                      <Stop size={20} />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 w-32">
                    <Label className="text-xs">Vol</Label>
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={1}
                      step={0.01}
                      className="flex-1"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Effects</h2>
                  
                  <div className="flex gap-2">
                    {(presets || []).length > 0 && (
                      <Select onValueChange={handleLoadPreset}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Load preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {(presets || []).map((preset) => (
                            <SelectItem key={preset.name} value={preset.name}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm">
                          <FloppyDisk size={16} className="mr-2" />
                          Save Preset
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Preset</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="preset-name">Preset Name</Label>
                            <Input
                              id="preset-name"
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              placeholder="My Doomer Mix"
                            />
                          </div>
                          {(presets || []).length > 0 && (
                            <div className="space-y-2">
                              <Label>Existing Presets</Label>
                              <div className="space-y-2">
                                {(presets || []).map((preset) => (
                                  <div key={preset.name} className="flex items-center justify-between p-2 rounded bg-muted">
                                    <span className="text-sm">{preset.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeletePreset(preset.name)}
                                    >
                                      <Trash size={16} />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSavePreset}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>Delay Time</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.delayTime.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {effects.delayTime.toFixed(2)}s
                        </span>
                      </div>
                      <Slider
                        value={[effects.delayTime]}
                        onValueChange={(v) => handleEffectChange('delayTime', v[0])}
                        max={2}
                        step={0.01}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>Delay Feedback</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.delayFeedback.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {(effects.delayFeedback * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        value={[effects.delayFeedback]}
                        onValueChange={(v) => handleEffectChange('delayFeedback', v[0])}
                        max={0.9}
                        step={0.01}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>Reverb Mix</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.reverbMix.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {(effects.reverbMix * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        value={[effects.reverbMix]}
                        onValueChange={(v) => handleEffectChange('reverbMix', v[0])}
                        max={1}
                        step={0.01}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>Reverb Decay</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.reverbDecay.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {effects.reverbDecay.toFixed(1)}s
                        </span>
                      </div>
                      <Slider
                        value={[effects.reverbDecay]}
                        onValueChange={(v) => handleEffectChange('reverbDecay', v[0])}
                        min={0.5}
                        max={5}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>Noise Level</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.noiseLevel.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {(effects.noiseLevel * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        value={[effects.noiseLevel]}
                        onValueChange={(v) => handleEffectChange('noiseLevel', v[0])}
                        max={0.3}
                        step={0.01}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="vinyl-crackle">Vinyl Crackle</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info size={16} className="text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{EFFECT_INFO.vinylCrackle.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        id="vinyl-crackle"
                        checked={effects.vinylCrackle}
                        onCheckedChange={(checked) => handleEffectChange('vinylCrackle', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>Low Pass Filter</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.lowPassFreq.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {effects.lowPassFreq.toFixed(0)} Hz
                        </span>
                      </div>
                      <Slider
                        value={[effects.lowPassFreq]}
                        onValueChange={(v) => handleEffectChange('lowPassFreq', v[0])}
                        min={200}
                        max={22000}
                        step={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>High Pass Filter</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.highPassFreq.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {effects.highPassFreq.toFixed(0)} Hz
                        </span>
                      </div>
                      <Slider
                        value={[effects.highPassFreq]}
                        onValueChange={(v) => handleEffectChange('highPassFreq', v[0])}
                        min={20}
                        max={1000}
                        step={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>Pitch Shift</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.pitchShift.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {effects.pitchShift > 0 ? '+' : ''}{effects.pitchShift} semitones
                        </span>
                      </div>
                      <Slider
                        value={[effects.pitchShift]}
                        onValueChange={(v) => handleEffectChange('pitchShift', v[0])}
                        min={-12}
                        max={12}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Label>Playback Speed</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info size={16} className="text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{EFFECT_INFO.playbackRate.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {effects.playbackRate.toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        value={[effects.playbackRate]}
                        onValueChange={(v) => handleEffectChange('playbackRate', v[0])}
                        min={0.5}
                        max={2}
                        step={0.01}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  size="lg"
                  className="w-full"
                >
                  {isExporting ? (
                    <>Exporting...</>
                  ) : (
                    <>
                      <DownloadSimple size={20} className="mr-2" />
                      Export as WAV
                    </>
                  )}
                </Button>
                {isExporting && (
                  <Progress value={exportProgress} className="mt-4" />
                )}
              </Card>
            </>
          )}
        </div>
      </TooltipProvider>
      
      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-sm text-muted-foreground border-t">
        <p>
          Made with 🩷 by HS Trejo Luna, Frontend Developer at{' '}
          <a 
            href="https://mostwant.tech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline underline-offset-4"
          >
            Most Want Tech
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App