import { useState } from 'react'
import { toast } from 'sonner'
import { exportVideo, type VideoExportProgress } from '@/video/video-exporter'
import type { VideoOrientation } from '@/video/video-layout'
import type { AudioEffects } from '@/hooks/use-audio-processor'
import { VIDEO_STAGE_LABELS } from '../constants'

interface UseVideoExportProps {
  audioBuffer: AudioBuffer | null
  fileName: string
}

export function useVideoExport({ audioBuffer, fileName }: UseVideoExportProps) {
  const [isVideoExporting, setIsVideoExporting] = useState(false)
  const [videoExportProgress, setVideoExportProgress] = useState(0)
  const [videoExportStage, setVideoExportStage] = useState('')

  const handleVideoExport = async (
    effects: AudioEffects,
    videoImage: File,
    videoOrientation: VideoOrientation
  ) => {
    if (!audioBuffer) {
      toast.error('Load audio before exporting video')
      return
    }

    if (!videoImage) {
      toast.error('Upload an image to include in the video')
      return
    }

    if (isVideoExporting) {
      return
    }

    setIsVideoExporting(true)
    setVideoExportProgress(0)
    setVideoExportStage(VIDEO_STAGE_LABELS['processing-audio'])

    try {
      const result = await exportVideo({
        audioBuffer,
        effects,
        imageFile: videoImage,
        orientation: videoOrientation,
        onProgress: (progress: VideoExportProgress) => {
          setVideoExportProgress(Math.round(progress.percent * 100))
          const label = progress.detail || VIDEO_STAGE_LABELS[progress.stage] || 'Working…'
          setVideoExportStage(label)
        },
      })

      const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'track'
      const downloadName = `doomer-${baseName}-${videoOrientation}.mp4`

      const url = URL.createObjectURL(result.blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = downloadName
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      requestAnimationFrame(() => {
        anchor.click()
        requestAnimationFrame(() => {
          URL.revokeObjectURL(url)
          anchor.remove()
        })
      })

      toast.success('Video exported successfully')
      setVideoExportProgress(100)
      setTimeout(() => {
        setIsVideoExporting(false)
        setVideoExportProgress(0)
        setVideoExportStage('')
      }, 1200)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export video'
      toast.error(message)
      console.error(error)
      setIsVideoExporting(false)
      setVideoExportProgress(0)
      setVideoExportStage('')
    }
  }

  return {
    isVideoExporting,
    videoExportProgress,
    videoExportStage,
    handleVideoExport,
  }
}
