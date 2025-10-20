import { useState } from 'react'
import { useAudioProcessor, DEFAULT_EFFECTS, type AudioEffects } from '@/hooks/use-audio-processor'
import { AppHeader, AppFooter } from '@/components/layout'
import { AudioUpload, YouTubeInput } from '@/features/audio-player'
import { downloadYouTubeAudio } from '@/features/audio-player/utils'
import { PlaybackPanel } from '@/features/playback'
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
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false)
  const [youtubeProgress, setYoutubeProgress] = useState(0)
  
  const { presets, savePreset, loadPreset, deletePreset } = usePresets()
  const {
    loadAudioFile, loadAudioBuffer, play, pause, stop, seek, setVolume: setAudioVolume,
    updateEffects, exportAudio, isPlaying, currentTime, duration,
  } = useAudioProcessor()
  const { isAudioExporting, audioExportProgress, handleAudioExport } = useAudioExport({ audioBuffer, fileName, exportAudio })
  const { isVideoExporting, videoExportProgress, videoExportStage, handleVideoExport } = useVideoExport({ audioBuffer, fileName })
  const { videoImage, imagePreviewUrl, videoOrientation, imageInputRef, setVideoOrientation, handleImageInput } = useVideoImage()

  const handleFileSelect = async (file: File) => {
    const buffer = await loadAudioFile(file)
    setAudioBuffer(buffer)
    setFileName(file.name)
  }

  const handleYouTubeLoad = async (url: string) => {
    setIsLoadingYouTube(true)
    setYoutubeProgress(0)

    try {
      const { buffer: arrayBuffer, title } = await downloadYouTubeAudio(
        url,
        (progress) => setYoutubeProgress(progress)
      )
      
      const buffer = await loadAudioBuffer(arrayBuffer)
      setAudioBuffer(buffer)
      setFileName(`${title}.mp3`)
    } finally {
      setIsLoadingYouTube(false)
      setYoutubeProgress(0)
    }
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Toaster position="top-center" theme="dark" />
      <TooltipProvider>
        <div className="max-w-6xl mx-auto space-y-6">
          <AppHeader />
          <AudioUpload fileName={fileName} onFileSelect={handleFileSelect} />
          <YouTubeInput 
            isLoading={isLoadingYouTube}
            progress={youtubeProgress}
            onSubmit={handleYouTubeLoad}
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