/**
 * React hook for YouTube to MP3 conversion
 */

import { useState, useCallback } from 'react'
import { convertYouTubeToMp3, validateYouTubeUrl } from '../api/github-converter'
import type { ConversionStatus } from '../types'
import { ConversionError } from '../types'

export interface UseYouTubeActionResult {
  status: ConversionStatus
  progress: number
  error: string | null
  isLoading: boolean
  convertAndLoad: (url: string) => Promise<{ buffer: ArrayBuffer; filename: string } | null>
  reset: () => void
}

export function useYouTubeAction(): UseYouTubeActionResult {
  const [status, setStatus] = useState<ConversionStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const isLoading = status !== 'idle' && status !== 'complete' && status !== 'error'

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setError(null)
  }, [])

  const convertAndLoad = useCallback(async (url: string) => {
    // Reset state
    setStatus('triggering')
    setProgress(0)
    setError(null)

    // Validate URL
    if (!validateYouTubeUrl(url)) {
      setStatus('error')
      setError('Invalid YouTube URL. Please enter a valid YouTube video link.')
      return null
    }

    try {
      // Start conversion with progress updates
      const result = await convertYouTubeToMp3(url, (progressValue, message) => {
        setProgress(progressValue)
        
        // Update status based on progress
        if (progressValue < 10) {
          setStatus('triggering')
        } else if (progressValue < 80) {
          setStatus('processing')
        } else if (progressValue < 100) {
          setStatus('downloading')
        } else {
          setStatus('complete')
        }
      })

      setStatus('complete')
      setProgress(100)
      
      return result
    } catch (err) {
      console.error('Conversion error:', err)
      
      let errorMessage = 'Failed to convert video. Please try again.'
      
      if (err instanceof ConversionError) {
        switch (err.code) {
          case 'INVALID_URL':
            errorMessage = 'Invalid YouTube URL format.'
            break
          case 'TRIGGER_FAILED':
            errorMessage = 'Failed to start conversion. Please check your internet connection.'
            break
          case 'TIMEOUT':
            errorMessage = 'Conversion timed out. The video might be too long or unavailable.'
            break
          case 'NOT_FOUND':
            errorMessage = 'Video not found. It might be private or deleted.'
            break
          case 'DOWNLOAD_FAILED':
            errorMessage = 'Failed to download the converted audio.'
            break
          default:
            errorMessage = err.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setStatus('error')
      setError(errorMessage)
      return null
    }
  }, [])

  return {
    status,
    progress,
    error,
    isLoading,
    convertAndLoad,
    reset,
  }
}
