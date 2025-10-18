import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface VolumeControlProps {
  volume: number
  onVolumeChange: (volume: number) => void
}

export function VolumeControl({ volume, onVolumeChange }: VolumeControlProps) {
  const handleChange = (value: number[]) => {
    onVolumeChange(value[0])
  }

  return (
    <div className="flex items-center gap-2 w-32">
      <Label className="text-xs">Vol</Label>
      <Slider
        value={[volume]}
        onValueChange={handleChange}
        max={1}
        step={0.01}
        className="flex-1"
      />
    </div>
  )
}
