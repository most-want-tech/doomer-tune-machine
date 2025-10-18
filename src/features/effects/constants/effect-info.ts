import type { EffectInfoMap } from '../types'

export const EFFECT_INFO: EffectInfoMap = {
  delayTime: {
    name: 'Delay Time',
    description: 'Controls how long it takes for the delayed signal to repeat. Longer times create more spaced-out echoes.',
    min: 0,
    max: 2,
    step: 0.01,
    unit: 's',
    format: (value) => `${value.toFixed(2)}s`,
    type: 'slider'
  },
  delayFeedback: {
    name: 'Delay Feedback',
    description: 'Determines how many times the delay repeats. Higher values create more echoes that fade gradually.',
    min: 0,
    max: 0.9,
    step: 0.01,
    unit: '%',
    format: (value) => `${(value * 100).toFixed(0)}%`,
    type: 'slider'
  },
  reverbMix: {
    name: 'Reverb Mix',
    description: 'Blends the reverb effect with the dry signal. Higher values create a more spacious, ambient sound.',
    min: 0,
    max: 1,
    step: 0.01,
    unit: '%',
    format: (value) => `${(value * 100).toFixed(0)}%`,
    type: 'slider'
  },
  reverbDecay: {
    name: 'Reverb Decay',
    description: 'Controls how long the reverb tail lasts. Longer decay simulates larger spaces like halls or cathedrals.',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 's',
    format: (value) => `${value.toFixed(1)}s`,
    type: 'slider'
  },
  noiseLevel: {
    name: 'Noise Level',
    description: 'Adds analog-style background noise for a vintage tape or cassette feel. Subtle amounts add warmth.',
    min: 0,
    max: 0.1,
    step: 0.001,
    unit: '%',
    format: (value) => `${(value * 100).toFixed(1)}%`,
    type: 'slider'
  },
  vinylCrackle: {
    name: 'Vinyl Crackle',
    description: 'Simulates the pops and crackles of vinyl records for an authentic retro sound aesthetic.',
    type: 'switch'
  },
  lowPassFreq: {
    name: 'Low Pass Filter',
    description: 'Cuts high frequencies above the set value. Lower settings create a muffled, distant, or underwater sound.',
    min: 20,
    max: 20000,
    step: 10,
    unit: 'Hz',
    format: (value) => `${value.toFixed(0)}Hz`,
    type: 'slider'
  },
  highPassFreq: {
    name: 'High Pass Filter',
    description: 'Cuts low frequencies below the set value. Higher settings thin out the sound and remove bass rumble.',
    min: 0,
    max: 1000,
    step: 10,
    unit: 'Hz',
    format: (value) => `${value.toFixed(0)}Hz`,
    type: 'slider'
  },
  pitchShift: {
    name: 'Pitch Shift',
    description: 'Changes the pitch without affecting playback speed. Negative values create darker tones, positive values brighten. Independent of speed control.',
    min: -12,
    max: 12,
    step: 1,
    unit: 'semi',
    format: (value) => `${value > 0 ? '+' : ''}${value.toFixed(0)} semi`,
    type: 'slider'
  },
  playbackRate: {
    name: 'Playback Speed',
    description: 'Changes playback speed without affecting pitch. Lower values create a slowed-down, dreamy effect while maintaining original pitch. Independent of pitch control.',
    min: 0.25,
    max: 2,
    step: 0.01,
    unit: 'x',
    format: (value) => `${value.toFixed(2)}x`,
    type: 'slider'
  }
}
