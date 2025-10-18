import type { AudioEffects } from '@/hooks/use-audio-processor'

export interface EffectInfo {
  name: string
  description: string
  min?: number
  max?: number
  step?: number
  unit?: string
  format?: (value: number) => string
  type?: 'slider' | 'switch'
}

export type EffectKey = keyof AudioEffects

export type EffectInfoMap = Record<EffectKey, EffectInfo>
