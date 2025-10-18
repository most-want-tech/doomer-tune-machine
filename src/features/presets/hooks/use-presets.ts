import { useKV } from '@github/spark/hooks'
import type { AudioEffects } from '@/hooks/use-audio-processor'
import type { Preset } from '../types'
import { toast } from 'sonner'

interface UsePresetsReturn {
  presets: Preset[]
  savePreset: (name: string, effects: AudioEffects) => void
  loadPreset: (name: string) => AudioEffects | null
  deletePreset: (name: string) => void
}

export function usePresets(): UsePresetsReturn {
  const [presets, setPresets] = useKV<Preset[]>('doomer-presets', [])

  const savePreset = (name: string, effects: AudioEffects) => {
    if (!name.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    setPresets((current) => [
      ...(current || []),
      { name, effects: { ...effects } }
    ])
    
    toast.success(`Preset "${name}" saved`)
  }

  const loadPreset = (name: string): AudioEffects | null => {
    const preset = (presets || []).find(p => p.name === name)
    if (preset) {
      toast.success(`Loaded preset "${name}"`)
      return preset.effects
    }
    return null
  }

  const deletePreset = (name: string) => {
    setPresets((current) => (current || []).filter(p => p.name !== name))
    toast.success(`Deleted preset "${name}"`)
  }

  return {
    presets: presets || [],
    savePreset,
    loadPreset,
    deletePreset
  }
}
