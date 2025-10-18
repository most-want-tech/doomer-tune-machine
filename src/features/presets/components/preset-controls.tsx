import { PresetSelector } from './preset-selector'
import { PresetSaveDialog } from './preset-save-dialog'
import type { Preset } from '../types'

interface PresetControlsProps {
  presets: Preset[]
  onLoad: (name: string) => void
  onSave: (name: string) => void
  onDelete: (name: string) => void
}

export function PresetControls({ presets, onLoad, onSave, onDelete }: PresetControlsProps) {
  return (
    <div className="flex gap-2">
      <PresetSelector presets={presets} onSelect={onLoad} />
      <PresetSaveDialog presets={presets} onSave={onSave} onDelete={onDelete} />
    </div>
  )
}
