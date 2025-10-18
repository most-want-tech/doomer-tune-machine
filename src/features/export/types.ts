import type { VideoOrientation } from '@/video/video-layout'
import type { VideoExportStage } from '@/video/video-exporter'

export interface ExportState {
  isAudioExporting: boolean
  audioExportProgress: number
  isVideoExporting: boolean
  videoExportProgress: number
  videoExportStage: string
}

export interface VideoExportConfig {
  videoImage: File | null
  imagePreviewUrl: string | null
  videoOrientation: VideoOrientation
}

export type { VideoOrientation, VideoExportStage }
