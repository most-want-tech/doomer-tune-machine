export interface AudioEffects {
  delayTime: number
  delayFeedback: number
  noiseLevel: number
  lowPassFreq: number
  highPassFreq: number
  vinylCrackle: boolean
  distortionAmount: number
  pitchShift: number
  playbackRate: number
  reverbMix: number
  reverbDecay: number
}

export const DEFAULT_EFFECTS: AudioEffects = {
  delayTime: 0,
  delayFeedback: 0,
  noiseLevel: 0,
  lowPassFreq: 22000,
  highPassFreq: 20,
  vinylCrackle: false,
  distortionAmount: 0,
  pitchShift: 0,
  playbackRate: 1,
  reverbMix: 0,
  reverbDecay: 2,
}
