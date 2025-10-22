import { useState } from 'react'
import { useAudioProcessor, DEFAULT_EFFECTS, type AudioEffects } from '@/hooks/use-audio-processor'
import { AppHeader, AppFooter } from '@/components/layout'
import { AudioUpload } from '@/features/audio-player'
import { PlaybackPanel } from '@/features/playback'
import { EffectsPanel } from '@/features/effects'
import { usePresets, PresetControls } from '@/features/presets'
import { ExportPanel, useAudioExport, useVideoExport, useVideoImage } from '@/features/export'
import { YouTubeActionInput, useYouTubeAction } from '@/features/youtube-action'
import { toast, Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [effects, setEffects] = useState<AudioEffects>(DEFAULT_EFFECTS)
  const [volume, setVolume] = useState(0.7)
  
  const { presets, savePreset, loadPreset, deletePreset } = usePresets()
  const {
    loadAudioFile, play, pause, stop, seek, setVolume: setAudioVolume,
    updateEffects, exportAudio, isPlaying, currentTime, duration,
  } = useAudioProcessor()
  const { isAudioExporting, audioExportProgress, handleAudioExport } = useAudioExport({ audioBuffer, fileName, exportAudio })
  const { isVideoExporting, videoExportProgress, videoExportStage, handleVideoExport } = useVideoExport({ audioBuffer, fileName })
  const { videoImage, imagePreviewUrl, videoOrientation, imageInputRef, setVideoOrientation, handleImageInput } = useVideoImage()
  const youtubeAction = useYouTubeAction()

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

  const handleYouTubeConvert = async (url: string) => {
    try {
      const result = await youtubeAction.convertAndLoad(url)
      
      if (result) {
        // Load the audio buffer into the processor
        // We need to decode the ArrayBuffer to AudioBuffer
        const audioContext = new AudioContext()
        const decodedBuffer = await audioContext.decodeAudioData(result.buffer.slice(0))
        await audioContext.close()
        
        // Load into audio processor (reuses the existing audio context)
        stop()
        const buffer = await loadAudioFile(new File([result.buffer], result.filename, { type: 'audio/mpeg' }))
        setAudioBuffer(buffer)
        setFileName(result.filename)
        
        toast.success('Audio loaded from YouTube successfully!')
      }
    } catch (error) {
      console.error('Failed to load YouTube audio:', error)
      toast.error('Failed to load audio from YouTube')
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Toaster position="top-center" theme="dark" />
      <TooltipProvider>
        <div className="max-w-6xl mx-auto space-y-6">
          <AppHeader />
          <AudioUpload fileName={fileName} onFileSelect={handleFileSelect} />
          <YouTubeActionInput
            onConvert={handleYouTubeConvert}
            status={youtubeAction.status}
            progress={youtubeAction.progress}
            error={youtubeAction.error}
            isLoading={youtubeAction.isLoading}
          />

          {audioBuffer && (
            <>
              <PlaybackPanel
                audioBuffer={audioBuffer}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                volume={volume}
                onSeek={seek}
                onPlay={play}
                onPause={pause}
                onStop={stop}
                onVolumeChange={handleVolumeChange}
              />

              <EffectsPanel
                effects={effects}
                onEffectChange={handleEffectChange}
                presetControls={
                  <PresetControls
                    presets={presets}
                    onLoad={(name) => {
                      const preset = loadPreset(name)
                      if (preset) {
                        setEffects(preset)
                        updateEffects(preset)
                      }
                    }}
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