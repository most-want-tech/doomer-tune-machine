import { useState } from 'react'
import { downloadYouTubeAudio } from '../utils'

export interface UseYouTubeLoaderReturn {
  isLoadingYouTube: boolean
  youtubeProgress: number
  loadFromYouTube: (url: string) => Promise<{ buffer: AudioBuffer; title: string }>
}

export function useYouTubeLoader(
  audioContext: AudioContext | null,
): UseYouTubeLoaderReturn {
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false)
  const [youtubeProgress, setYoutubeProgress] = useState(0)

  const loadFromYouTube = async (
    url: string,
  ): Promise<{ buffer: AudioBuffer; title: string }> => {
    if (!audioContext) {
      throw new Error('Audio context not initialized')
    }

    setIsLoadingYouTube(true)
    setYoutubeProgress(0)

    try {
      // Download audio with progress tracking
      const { buffer: arrayBuffer, title } = await downloadYouTubeAudio(
        url,
        (progress) => {
          setYoutubeProgress(progress)
        },
      )

      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))

      return { buffer: audioBuffer, title }
    } finally {
      setIsLoadingYouTube(false)
      setYoutubeProgress(0)
    }
  }

  return {
    isLoadingYouTube,
    youtubeProgress,
    loadFromYouTube,
  }
}
