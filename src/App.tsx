import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { DownloadSimple } from '@phosphor-icons/react'
import { useAudioProcessor, DEFAULT_EFFECTS, type AudioEffects } from '@/hooks/use-audio-processor'
import { WaveformDisplay } from '@/components/waveform-display'
import { AppHeader, AppFooter } from '@/components/layout'
import { AudioUpload, PlaybackControls, VolumeControl, formatTime } from '@/features/audio-player'
import { EffectsPanel } from '@/features/effects'
import { usePresets, PresetControls } from '@/features/presets'
import { toast, Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { exportVideo, type VideoExportProgress, type VideoExportStage } from '@/video/video-exporter'
import { VIDEO_ORIENTATIONS, type VideoOrientation } from '@/video/video-layout'
import { validateImageFile } from '@/video/image-utils'

const VIDEO_STAGE_LABELS: Record<VideoExportStage, string> = {
  initializing: 'Preparing export…',
  'processing-audio': 'Rendering audio effects…',
  'encoding-audio': 'Encoding audio…',
  'encoding-video': 'Encoding video…',
  finalizing: 'Finalizing output…',
}

function App() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [effects, setEffects] = useState<AudioEffects>(DEFAULT_EFFECTS)
  const [volume, setVolume] = useState(0.7)
  const [isAudioExporting, setIsAudioExporting] = useState(false)
  const [audioExportProgress, setAudioExportProgress] = useState(0)
  const [videoImage, setVideoImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [videoOrientation, setVideoOrientation] = useState<VideoOrientation>('landscape')
  const [isVideoExporting, setIsVideoExporting] = useState(false)
  const [videoExportProgress, setVideoExportProgress] = useState(0)
  const [videoExportStage, setVideoExportStage] = useState('')
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const { presets, savePreset, loadPreset, deletePreset } = usePresets()
  
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
    const buffer = await loadAudioFile(file)
    setAudioBuffer(buffer)
    setFileName(file.name)
  }

  const handleEffectChange = (key: keyof AudioEffects, value: number | boolean) => {
    const newEffects = { ...effects, [key]: value }
    setEffects(newEffects)
    updateEffects(newEffects)
  }

  const handleVolumeChange = (vol: number) => {
    setVolume(vol)
    setAudioVolume(vol)
  }

  const updateImagePreview = (file: File) => {
    setImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return URL.createObjectURL(file)
    })
  }

  const handleImageFile = (file: File) => {
    try {
      validateImageFile(file)
      setVideoImage(file)
      updateImagePreview(file)
      toast.success('Image ready for video export')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unsupported image format'
      toast.error(message)
    }
  }

  const handleImageInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const handleVideoExport = async () => {
    if (!audioBuffer) {
      toast.error('Load audio before exporting video')
      return
    }

    if (!videoImage) {
      toast.error('Upload an image to include in the video')
      return
    }

    if (isVideoExporting) {
      return
    }

    setIsVideoExporting(true)
    setVideoExportProgress(0)
    setVideoExportStage(VIDEO_STAGE_LABELS['processing-audio'])

    try {
      const result = await exportVideo({
        audioBuffer,
        effects,
        imageFile: videoImage,
        orientation: videoOrientation,
        onProgress: (progress: VideoExportProgress) => {
          setVideoExportProgress(Math.round(progress.percent * 100))
          const label = progress.detail || VIDEO_STAGE_LABELS[progress.stage] || 'Working…'
          setVideoExportStage(label)
        },
      })

      const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'track'
      const downloadName = `doomer-${baseName}-${videoOrientation}.mp4`

      const url = URL.createObjectURL(result.blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = downloadName
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      requestAnimationFrame(() => {
        anchor.click()
        requestAnimationFrame(() => {
          URL.revokeObjectURL(url)
          anchor.remove()
        })
      })

      toast.success('Video exported successfully')
      setVideoExportProgress(100)
      setTimeout(() => {
        setIsVideoExporting(false)
        setVideoExportProgress(0)
        setVideoExportStage('')
      }, 1200)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export video'
      toast.error(message)
      console.error(error)
      setIsVideoExporting(false)
      setVideoExportProgress(0)
      setVideoExportStage('')
    }
  }

  const handleAudioExport = async () => {
    if (!audioBuffer) {
      toast.error('No audio loaded')
      return
    }

    setIsAudioExporting(true)
    setAudioExportProgress(0)

    const progressInterval = setInterval(() => {
      setAudioExportProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      const blob = await exportAudio(effects)
      clearInterval(progressInterval)
      setAudioExportProgress(100)

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
        setIsAudioExporting(false)
        setAudioExportProgress(0)
      }, 1000)
    } catch (error) {
      clearInterval(progressInterval)
      toast.error('Failed to export audio')
      console.error(error)
      setIsAudioExporting(false)
      setAudioExportProgress(0)
    }
  }

  const handleLoadPreset = (presetName: string) => {
    loadPreset(presetName)
    const preset = presets.find(p => p.name === presetName)
    if (preset) {
      setEffects(preset.effects)
      updateEffects(preset.effects)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Toaster position="top-center" theme="dark" />
      <TooltipProvider>
        <div className="max-w-6xl mx-auto space-y-6">
          <AppHeader />

          <AudioUpload fileName={fileName} onFileSelect={handleFileSelect} />

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
                  
                  <PlaybackControls
                    isPlaying={isPlaying}
                    onPlay={play}
                    onPause={pause}
                    onStop={stop}
                  />
                  
                  <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
                </div>
              </Card>

              <EffectsPanel
                effects={effects}
                onEffectChange={handleEffectChange}
                presetControls={
                  <PresetControls
                    presets={presets}
                    onLoad={handleLoadPreset}
                    onSave={(name) => savePreset(name, effects)}
                    onDelete={deletePreset}
                  />
                }
              />

              <Card className="p-6 space-y-6">
                <h2 className="text-xl font-semibold">Export</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Audio</Label>
                      <p className="text-xs text-muted-foreground">
                        Download the processed track as a high-quality WAV file.
                      </p>
                    </div>
                    <Button
                      onClick={handleAudioExport}
                      disabled={isAudioExporting}
                      size="lg"
                      className="w-full"
                    >
                      {isAudioExporting ? (
                        <>Exporting...</>
                      ) : (
                        <>
                          <DownloadSimple size={20} className="mr-2" />
                          Export as WAV
                        </>
                      )}
                    </Button>
                    {isAudioExporting && (
                      <Progress value={audioExportProgress} className="mt-2" />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Video Image</Label>
                      <p className="text-xs text-muted-foreground">
                        Choose a JPG, PNG, or GIF that will stay centered in the video export.
                      </p>
                    </div>

                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center cursor-pointer transition-colors ${
                        isVideoExporting ? 'opacity-60 pointer-events-none' : 'hover:border-primary/60'
                      }`}
                    >
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        className="hidden"
                        onChange={handleImageInput}
                      />
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="Video artwork preview"
                          className="h-32 w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">Click to add image</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orientation-select">Orientation</Label>
                      <Select
                        value={videoOrientation}
                        onValueChange={(value) => setVideoOrientation(value as VideoOrientation)}
                        disabled={isVideoExporting}
                      >
                        <SelectTrigger id="orientation-select">
                          <SelectValue placeholder="Select orientation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landscape">
                            Landscape ({VIDEO_ORIENTATIONS.landscape.width}x{VIDEO_ORIENTATIONS.landscape.height})
                          </SelectItem>
                          <SelectItem value="portrait">
                            Portrait ({VIDEO_ORIENTATIONS.portrait.width}x{VIDEO_ORIENTATIONS.portrait.height})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleVideoExport}
                      disabled={isVideoExporting || !videoImage}
                      size="lg"
                      className="w-full"
                    >
                      {isVideoExporting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
                          {videoExportStage || 'Rendering…'}
                        </span>
                      ) : (
                        <>
                          <DownloadSimple size={20} className="mr-2" />
                          Export as MP4
                        </>
                      )}
                    </Button>
                    {isVideoExporting && (
                      <div className="mt-2 space-y-1">
                        <Progress value={videoExportProgress} />
                        <p className="text-xs text-muted-foreground text-center" aria-live="polite">
                          {videoExportStage || 'Rendering…'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </TooltipProvider>
      
      <AppFooter />
    </div>
  )
}

export default App