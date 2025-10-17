import type { AudioEffects } from './audio-effects'
import { createNoiseBuffer, createReverbImpulse, createVinylNoiseBuffer } from './audio-utils'
import { audioBufferToWav } from './wav-encoder'

export const renderOfflineAudio = async (
  buffer: AudioBuffer,
  effects: AudioEffects,
): Promise<Blob> => {
  const offlineContext = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

  const source = offlineContext.createBufferSource()
  source.buffer = buffer

  const gain = offlineContext.createGain()
  const delay = offlineContext.createDelay(5)
  const feedback = offlineContext.createGain()
  const lowPass = offlineContext.createBiquadFilter()
  const highPass = offlineContext.createBiquadFilter()
  const noiseGain = offlineContext.createGain()
  const vinylGain = offlineContext.createGain()
  const convolver = offlineContext.createConvolver()
  const reverbGain = offlineContext.createGain()
  const dryGain = offlineContext.createGain()

  lowPass.type = 'lowpass'
  highPass.type = 'highpass'

  delay.delayTime.value = effects.delayTime
  feedback.gain.value = effects.delayFeedback
  noiseGain.gain.value = effects.noiseLevel
  lowPass.frequency.value = effects.lowPassFreq
  highPass.frequency.value = effects.highPassFreq
  vinylGain.gain.value = effects.vinylCrackle ? 0.15 : 0
  reverbGain.gain.value = effects.reverbMix
  dryGain.gain.value = 1 - effects.reverbMix

  const pitchFactor = Math.pow(2, effects.pitchShift / 12)
  source.playbackRate.value = effects.playbackRate * pitchFactor

  const impulse = createReverbImpulse(offlineContext, effects.reverbDecay, effects.reverbDecay)
  convolver.buffer = impulse

  if (effects.noiseLevel > 0) {
    const noiseSource = offlineContext.createBufferSource()
    noiseSource.buffer = createNoiseBuffer(offlineContext, buffer.duration)
    noiseSource.connect(noiseGain)
    noiseSource.loop = true
    noiseSource.start(0)
  }

  if (effects.vinylCrackle) {
    const vinylSource = offlineContext.createBufferSource()
    vinylSource.buffer = createVinylNoiseBuffer(offlineContext, buffer.duration)
    vinylSource.connect(vinylGain)
    vinylSource.loop = true
    vinylSource.start(0)
  }

  source.connect(highPass)
  highPass.connect(lowPass)
  lowPass.connect(delay)
  delay.connect(feedback)
  feedback.connect(delay)

  delay.connect(dryGain)
  delay.connect(convolver)
  convolver.connect(reverbGain)

  dryGain.connect(gain)
  reverbGain.connect(gain)
  lowPass.connect(gain)
  noiseGain.connect(gain)
  vinylGain.connect(gain)
  gain.connect(offlineContext.destination)

  source.start(0)

  const renderedBuffer = await offlineContext.startRendering()
  const wav = audioBufferToWav(renderedBuffer)
  return new Blob([wav], { type: 'audio/wav' })
}
