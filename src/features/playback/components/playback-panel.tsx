import { Card } from '@/components/ui/card'
import { WaveformDisplay } from '@/components/waveform-display'
import { PlaybackControls, VolumeControl, formatTime } from '@/features/audio-player'

interface PlaybackPanelProps {
  audioBuffer: AudioBuffer
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  onSeek: (time: number) => void
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onVolumeChange: (volume: number) => void
}

export function PlaybackPanel({
  audioBuffer,
  currentTime,
  duration,
  isPlaying,
  volume,
  onSeek,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
}: PlaybackPanelProps) {
  return (
    <Card className="p-6 space-y-4">
      <WaveformDisplay
        audioBuffer={audioBuffer}
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
      />
      
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        
        <PlaybackControls
          isPlaying={isPlaying}
          onPlay={onPlay}
          onPause={onPause}
          onStop={onStop}
        />
        
        <VolumeControl volume={volume} onVolumeChange={onVolumeChange} />
      </div>
    </Card>
  )
}
