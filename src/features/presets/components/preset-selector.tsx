import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Preset } from '../types'

interface PresetSelectorProps {
  presets: Preset[]
  onSelect: (presetName: string) => void
}

export function PresetSelector({ presets, onSelect }: PresetSelectorProps) {
  if (presets.length === 0) {
    return null
  }

  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Load preset" />
      </SelectTrigger>
      <SelectContent>
        {presets.map((preset) => (
          <SelectItem key={preset.name} value={preset.name}>
            {preset.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
