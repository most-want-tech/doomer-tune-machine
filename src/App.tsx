import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useAudioProcessor, DEFAULT_EFFECTS, type AudioEffects } from '@/hooks/use-audio-processor'
import { WaveformDisplay } from '@/components/waveform-display'
import { AppHeader, AppFooter } from '@/components/layout'
import { AudioUpload, PlaybackControls, VolumeControl, formatTime } from '@/features/audio-player'
import { EffectsPanel } from '@/features/effects'
import { usePresets, PresetControls } from '@/features/presets'
import { ExportPanel, useAudioExport, useVideoExport, useVideoImage } from '@/features/export'
import { toast, Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [effects, setEffects] = useState<AudioEffects>(DEFAULT_EFFECTS)
  const [volume, setVolume] = useState(0.7)
  
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

  const { isAudioExporting, audioExportProgress, handleAudioExport } = useAudioExport({
    audioBuffer,
    fileName,
    exportAudio,
  })

  const { isVideoExporting, videoExportProgress, videoExportStage, handleVideoExport } = useVideoExport({
    audioBuffer,
    fileName,
  })

  const {
    videoImage,
    imagePreviewUrl,
    videoOrientation,
    imageInputRef,
    setVideoOrientation,
    handleImageInput,
  } = useVideoImage()

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

              <ExportPanel
                isAudioExporting={isAudioExporting}
                audioExportProgress={audioExportProgress}
                onAudioExport={() => handleAudioExport(effects)}
                isVideoExporting={isVideoExporting}
                videoExportProgress={videoExportProgress}
                videoExportStage={videoExportStage}
                videoImage={videoImage}
                imagePreviewUrl={imagePreviewUrl}
                imageInputRef={imageInputRef}
                videoOrientation={videoOrientation}
                onImageInput={handleImageInput}
                onOrientationChange={setVideoOrientation}
                onVideoExport={() => handleVideoExport(effects, videoImage!, videoOrientation)}
              />
            </>
          )}
        </div>
      </TooltipProvider>
      
      <AppFooter />
    </div>
  )
}

export default App