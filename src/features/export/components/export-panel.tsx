import type { ChangeEvent, RefObject } from 'react'
import { Card } from '@/components/ui/card'
import { AudioExport } from './audio-export'
import { VideoImageUpload } from './video-image-upload'
import { VideoOrientationSelector } from './video-orientation-selector'
import { VideoExport } from './video-export'
import type { VideoOrientation } from '@/video/video-layout'

interface ExportPanelProps {
  // Audio export
  isAudioExporting: boolean
  audioExportProgress: number
  onAudioExport: () => void
  
  // Video export
  isVideoExporting: boolean
  videoExportProgress: number
  videoExportStage: string
  videoImage: File | null
  imagePreviewUrl: string | null
  imageInputRef: RefObject<HTMLInputElement | null>
  videoOrientation: VideoOrientation
  onImageInput: (event: ChangeEvent<HTMLInputElement>) => void
  onOrientationChange: (orientation: VideoOrientation) => void
  onVideoExport: () => void
}

export function ExportPanel({
  isAudioExporting,
  audioExportProgress,
  onAudioExport,
  isVideoExporting,
  videoExportProgress,
  videoExportStage,
  videoImage,
  imagePreviewUrl,
  imageInputRef,
  videoOrientation,
  onImageInput,
  onOrientationChange,
  onVideoExport,
}: ExportPanelProps) {
  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Export</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <AudioExport
          isExporting={isAudioExporting}
          progress={audioExportProgress}
          onExport={onAudioExport}
        />

        <div className="space-y-4">
          <VideoImageUpload
            imagePreviewUrl={imagePreviewUrl}
            imageInputRef={imageInputRef}
            isDisabled={isVideoExporting}
            onImageInput={onImageInput}
          />

          <VideoOrientationSelector
            orientation={videoOrientation}
            isDisabled={isVideoExporting}
            onOrientationChange={onOrientationChange}
          />

          <VideoExport
            isExporting={isVideoExporting}
            isDisabled={isVideoExporting || !videoImage}
            progress={videoExportProgress}
            stage={videoExportStage}
            onExport={onVideoExport}
          />
        </div>
      </div>
    </Card>
  )
}
