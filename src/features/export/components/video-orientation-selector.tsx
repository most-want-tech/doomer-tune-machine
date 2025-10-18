import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VIDEO_ORIENTATIONS } from '@/video/video-layout'
import type { VideoOrientation } from '@/video/video-layout'

interface VideoOrientationSelectorProps {
  orientation: VideoOrientation
  isDisabled: boolean
  onOrientationChange: (value: VideoOrientation) => void
}

export function VideoOrientationSelector({
  orientation,
  isDisabled,
  onOrientationChange,
}: VideoOrientationSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="orientation-select">Orientation</Label>
      <Select
        value={orientation}
        onValueChange={(value) => onOrientationChange(value as VideoOrientation)}
        disabled={isDisabled}
      >
        <SelectTrigger id="orientation-select">
          <SelectValue placeholder="Select orientation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="landscape">
            Landscape ({VIDEO_ORIENTATIONS.landscape.width}x{VIDEO_ORIENTATIONS.landscape.height})
          </SelectItem>
          <SelectItem value="portrait">
            Portrait ({VIDEO_ORIENTATIONS.portrait.width}x{VIDEO_ORIENTATIONS.portrait.height})
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
