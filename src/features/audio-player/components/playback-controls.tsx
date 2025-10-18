import { Button } from '@/components/ui/button'
import { Play, Pause, Stop } from '@phosphor-icons/react'

interface PlaybackControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

export function PlaybackControls({ isPlaying, onPlay, onPause, onStop }: PlaybackControlsProps) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={isPlaying ? onPause : onPlay}
        variant="default"
        size="lg"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </Button>
      <Button onClick={onStop} variant="secondary" size="lg">
        <Stop size={20} />
      </Button>
    </div>
  )
}
