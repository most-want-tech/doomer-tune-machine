import type { AudioEffects } from '@/hooks/use-audio-processor'

export interface Preset {
  name: string
  effects: AudioEffects
}
