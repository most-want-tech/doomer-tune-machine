import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { DownloadSimple } from '@phosphor-icons/react'

interface AudioExportProps {
  isExporting: boolean
  progress: number
  onExport: () => void
}

export function AudioExport({ isExporting, progress, onExport }: AudioExportProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">Audio</Label>
        <p className="text-xs text-muted-foreground">
          Download the processed track as a high-quality WAV file.
        </p>
      </div>
      <Button
        onClick={onExport}
        disabled={isExporting}
        size="lg"
        className="w-full"
      >
        {isExporting ? (
          <>Exporting...</>
        ) : (
          <>
            <DownloadSimple size={20} className="mr-2" />
            Export as WAV
          </>
        )}
      </Button>
      {isExporting && (
        <Progress value={progress} className="mt-2" />
      )}
    </div>
  )
}
