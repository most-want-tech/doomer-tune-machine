export interface AudioPlayerState {
  audioBuffer: AudioBuffer | null
  fileName: string
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}

export interface AudioPlayerActions {
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  loadAudioFile: (file: File) => Promise<AudioBuffer>
}
