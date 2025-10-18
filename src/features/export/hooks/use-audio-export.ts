import { useState } from 'react'
import { toast } from 'sonner'
import type { AudioEffects } from '@/hooks/use-audio-processor'

interface UseAudioExportProps {
  audioBuffer: AudioBuffer | null
  fileName: string
  exportAudio: (effects: AudioEffects) => Promise<Blob>
}

export function useAudioExport({ audioBuffer, fileName, exportAudio }: UseAudioExportProps) {
  const [isAudioExporting, setIsAudioExporting] = useState(false)
  const [audioExportProgress, setAudioExportProgress] = useState(0)

  const handleAudioExport = async (effects: AudioEffects) => {
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

  return {
    isAudioExporting,
    audioExportProgress,
    handleAudioExport,
  }
}
