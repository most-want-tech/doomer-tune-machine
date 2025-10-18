import { useCallback, useState } from 'react'
import { DEFAULT_EFFECTS } from '@/hooks/use-audio-processor'
import type { AudioEffects } from '@/hooks/use-audio-processor'
import type { Preset } from '../types'
import { toast } from 'sonner'

interface UsePresetsReturn {
  presets: Preset[]
  savePreset: (name: string, effects: AudioEffects) => void
  loadPreset: (name: string) => AudioEffects | null
  deletePreset: (name: string) => void
}

const STORAGE_KEY = 'doomer-presets'

const readStoredPresets = (): Preset[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter((value): value is Preset => {
      return Boolean(value && typeof value === 'object' && 'name' in value && 'effects' in value)
    })
  } catch (error) {
    console.warn('Failed to read stored presets', error)
    return []
  }
}

export function usePresets(): UsePresetsReturn {
  const [presets, setPresets] = useState<Preset[]>(() => readStoredPresets())

  const setAndPersist = useCallback((updater: Preset[] | ((current: Preset[]) => Preset[])) => {
    setPresets((current) => {
      const next = typeof updater === 'function' ? (updater as (value: Preset[]) => Preset[])(current) : updater

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch (error) {
          console.warn('Failed to persist presets', error)
        }
      }

      return next
    })
  }, [])

  const savePreset = (name: string, effects: AudioEffects) => {
    if (!name.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    const snapshot: AudioEffects = { ...DEFAULT_EFFECTS, ...effects }

    setAndPersist((current) => [
      ...(current || []).filter((preset) => preset.name !== name),
      { name, effects: snapshot }
    ])
    
    toast.success(`Preset "${name}" saved`)
  }

  const loadPreset = (name: string): AudioEffects | null => {
    const preset = presets.find(p => p.name === name)
    if (preset) {
      toast.success(`Loaded preset "${name}"`)
      return { ...DEFAULT_EFFECTS, ...preset.effects }
    }
    return null
  }

  const deletePreset = (name: string) => {
    setAndPersist((current) => current.filter(p => p.name !== name))
    toast.success(`Deleted preset "${name}"`)
  }

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset
  }
}
