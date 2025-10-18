import { useState } from 'react'
import type { AudioPlayerState } from '../types'

interface UseAudioPlayerReturn extends AudioPlayerState {
  setAudioBuffer: (buffer: AudioBuffer | null) => void
  setFileName: (name: string) => void
  setVolume: (volume: number) => void
}

/**
 * Hook to manage audio player state (file, playback info, volume)
 * Note: Actual playback control is handled by useAudioProcessor hook
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [volume, setVolume] = useState(0.7)

  return {
    // State
    audioBuffer,
    fileName,
    volume,
    isPlaying: false, // This will be managed by useAudioProcessor
    currentTime: 0,   // This will be managed by useAudioProcessor
    duration: 0,      // This will be managed by useAudioProcessor
    
    // Actions
    setAudioBuffer,
    setFileName,
    setVolume,
  }
}
