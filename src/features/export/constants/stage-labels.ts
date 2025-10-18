import type { VideoExportStage } from '@/video/video-exporter'

export const VIDEO_STAGE_LABELS: Record<VideoExportStage, string> = {
  initializing: 'Preparing export…',
  'processing-audio': 'Processing audio…',
  'encoding-audio': 'Encoding audio…',
  'encoding-video': 'Encoding video…',
  finalizing: 'Finalizing…',
}
