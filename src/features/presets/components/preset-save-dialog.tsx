import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { FloppyDisk } from '@phosphor-icons/react'
import { PresetListItem } from './preset-list-item'
import type { Preset } from '../types'

interface PresetSaveDialogProps {
  presets: Preset[]
  onSave: (name: string) => void
  onDelete: (name: string) => void
}

export function PresetSaveDialog({ presets, onSave, onDelete }: PresetSaveDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  const handleSave = () => {
    onSave(newPresetName)
    setNewPresetName('')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <FloppyDisk size={16} className="mr-2" />
          Save Preset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Preset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="My Doomer Mix"
            />
          </div>
          {presets.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Presets</Label>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <PresetListItem
                    key={preset.name}
                    preset={preset}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
