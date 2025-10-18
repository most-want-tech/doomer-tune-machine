import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DownloadSimple } from '@phosphor-icons/react'

interface VideoExportProps {
  isExporting: boolean
  isDisabled: boolean
  progress: number
  stage: string
  onExport: () => void
}

export function VideoExport({
  isExporting,
  isDisabled,
  progress,
  stage,
  onExport,
}: VideoExportProps) {
  return (
    <>
      <Button
        onClick={onExport}
        disabled={isDisabled}
        size="lg"
        className="w-full"
      >
        {isExporting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
            {stage || 'Rendering…'}
          </span>
        ) : (
          <>
            <DownloadSimple size={20} className="mr-2" />
            Export as MP4
          </>
        )}
      </Button>
      {isExporting && (
        <div className="mt-2 space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground text-center" aria-live="polite">
            {stage || 'Rendering…'}
          </p>
        </div>
      )}
    </>
  )
}
