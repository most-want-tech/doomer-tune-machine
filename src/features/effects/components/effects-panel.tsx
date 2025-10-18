import type { AudioEffects } from '@/hooks/use-audio-processor'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EffectControl } from './effect-control'
import { EFFECT_INFO } from '../constants/effect-info'
import type { EffectKey } from '../types'

interface EffectsPanelProps {
  effects: AudioEffects
  onEffectChange: (key: keyof AudioEffects, value: number | boolean) => void
  presetControls?: React.ReactNode
}

export function EffectsPanel({ effects, onEffectChange, presetControls }: EffectsPanelProps) {
  const renderEffect = (key: EffectKey) => {
    const info = EFFECT_INFO[key]
    return (
      <EffectControl
        key={key}
        label={info.name}
        value={effects[key]}
        info={info}
        onChange={(value) => onEffectChange(key, value)}
      />
    )
  }

  // Group effects by category for better organization
  const delayEffects: EffectKey[] = ['delayTime', 'delayFeedback']
  const reverbEffects: EffectKey[] = ['reverbMix', 'reverbDecay']
  const noiseEffects: EffectKey[] = ['noiseLevel', 'vinylCrackle']
  const filterEffects: EffectKey[] = ['lowPassFreq', 'highPassFreq']
  const pitchEffects: EffectKey[] = ['pitchShift', 'playbackRate']

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Effects</h2>
        {presetControls}
      </div>

      <Separator />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {delayEffects.map(renderEffect)}
          {reverbEffects.map(renderEffect)}
          {noiseEffects.map(renderEffect)}
        </div>

        <div className="space-y-4">
          {filterEffects.map(renderEffect)}
          {pitchEffects.map(renderEffect)}
        </div>
      </div>
    </Card>
  )
}
