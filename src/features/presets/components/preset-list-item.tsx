import { Button } from '@/components/ui/button'
import { Trash } from '@phosphor-icons/react'
import type { Preset } from '../types'

interface PresetListItemProps {
  preset: Preset
  onDelete: (name: string) => void
}

export function PresetListItem({ preset, onDelete }: PresetListItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-muted">
      <span className="text-sm">{preset.name}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(preset.name)}
      >
        <Trash size={16} />
      </Button>
    </div>
  )
}
