import * as Tone from 'tone'
import { type AudioEffects, getCompensatedPitch } from './audio-effects'
import { createNoiseBuffer, createReverbImpulse, createVinylNoiseBuffer, getDistortionCurve } from './audio-utils'
import { audioBufferToWav } from './wav-encoder'

const VINYL_GAIN = 0.15
const MIN_PLAYBACK_RATE = 0.01

const getPlaybackRateFactor = (effects: AudioEffects) => {
  // Playback rate now ONLY controls speed, not pitch
  return Math.max(MIN_PLAYBACK_RATE, effects.playbackRate)
}

const fallbackContexts = new Map<string, OfflineAudioContext>()

const createBufferCompatible = (numberOfChannels: number, length: number, sampleRate: number) => {
  if (typeof AudioBuffer === 'function') {
    try {
      return new AudioBuffer({ numberOfChannels, length, sampleRate })
    } catch (_error) {
      // fall through to OfflineAudioContext-based creation
    }
  }

  const key = `${numberOfChannels}:${sampleRate}`
  let context = fallbackContexts.get(key)
  if (!context) {
    context = new OfflineAudioContext(numberOfChannels, 1, sampleRate)
    fallbackContexts.set(key, context)
  }

  return context.createBuffer(numberOfChannels, length, sampleRate)
}

const shouldResample = (rateFactor: number) => Math.abs(rateFactor - 1) > 1e-6

const stretchAudioBuffer = (buffer: AudioBuffer, rateFactor: number): AudioBuffer => {
  if (!Number.isFinite(rateFactor) || rateFactor <= 0 || !shouldResample(rateFactor)) {
    return buffer
  }

  const { numberOfChannels, length, sampleRate } = buffer
  const stretchedLength = Math.max(1, Math.ceil(length / rateFactor))
  const stretched = createBufferCompatible(numberOfChannels, stretchedLength, sampleRate)

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const source = buffer.getChannelData(channel)
    const target = stretched.getChannelData(channel)
    const lastIndex = length - 1

    for (let i = 0; i < stretchedLength; i++) {
      const sourceIndex = i * rateFactor
      const index0 = Math.min(lastIndex, Math.floor(sourceIndex))
      const index1 = Math.min(lastIndex, index0 + 1)
      const fraction = sourceIndex - index0

      if (index0 === index1) {
        target[i] = source[index0]
        continue
      }

      const sample0 = source[index0]
      const sample1 = source[index1]
      target[i] = sample0 + (sample1 - sample0) * fraction
    }
  }

  return stretched
}

const getTailSeconds = (effects: AudioEffects) => {
  const delayTail = effects.delayFeedback > 0 ? effects.delayTime * 4 : 0
  const reverbTail = effects.reverbMix > 0 ? effects.reverbDecay : 0
  return Math.max(delayTail, reverbTail)
}

const configureGraph = (
  offlineContext: OfflineAudioContext,
  source: AudioBufferSourceNode,
  renderDuration: number,
  effects: AudioEffects,
) => {
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
  const distortion = offlineContext.createWaveShaper()

  // Create Tone.js context and PitchShift for offline rendering
  Tone.setContext(offlineContext as any)
  const effectivePlaybackRate = getPlaybackRateFactor(effects)
  const pitchShift = new Tone.PitchShift()
  const pitchShiftInput = offlineContext.createGain()
  const pitchShiftOutput = offlineContext.createGain()

  pitchShiftInput.gain.value = 1
  pitchShiftOutput.gain.value = 1

  lowPass.type = 'lowpass'
  highPass.type = 'highpass'
  distortion.oversample = '4x'

  delay.delayTime.value = effects.delayTime
  feedback.gain.value = effects.delayFeedback
  noiseGain.gain.value = effects.noiseLevel
  lowPass.frequency.value = effects.lowPassFreq
  highPass.frequency.value = effects.highPassFreq
  vinylGain.gain.value = effects.vinylCrackle ? VINYL_GAIN : 0
  reverbGain.gain.value = effects.reverbMix
  dryGain.gain.value = 1 - effects.reverbMix
  distortion.curve = getDistortionCurve(offlineContext, effects.distortionAmount) as Float32Array<ArrayBuffer>
  pitchShift.pitch = getCompensatedPitch({ ...effects, playbackRate: effectivePlaybackRate })

  // Connect audio chain with pitch shift
  source.connect(highPass)
  highPass.connect(distortion)
  distortion.connect(pitchShiftInput)

  // Mirror runtime graph integration to bridge native nodes with Tone.js
  try {
    pitchShiftInput.connect((pitchShift as any).input._gainNode)
    pitchShift.connect(pitchShiftOutput as any)
  } catch (_error) {
    // If Tone internals are unavailable (tests/server), bypass pitch shift
    pitchShiftInput.connect(pitchShiftOutput)
  }

  pitchShiftOutput.connect(lowPass)
  lowPass.connect(delay)
  delay.connect(feedback)
  feedback.connect(delay)

  delay.connect(dryGain)
  delay.connect(convolver)
  convolver.connect(reverbGain)

  dryGain.connect(gain)
  reverbGain.connect(gain)
  noiseGain.connect(gain)
  vinylGain.connect(gain)
  gain.connect(offlineContext.destination)

  const impulse = createReverbImpulse(offlineContext, effects.reverbDecay, effects.reverbDecay)
  convolver.buffer = impulse

  if (effects.noiseLevel > 0) {
    const noiseSource = offlineContext.createBufferSource()
    noiseSource.buffer = createNoiseBuffer(offlineContext, renderDuration)
    noiseSource.connect(noiseGain)
    noiseSource.loop = true
    noiseSource.start(0)
  }

  if (effects.vinylCrackle) {
    const vinylSource = offlineContext.createBufferSource()
    vinylSource.buffer = createVinylNoiseBuffer(offlineContext, renderDuration)
    vinylSource.connect(vinylGain)
    vinylSource.loop = true
    vinylSource.start(0)
  }
}

export interface OfflineRenderOptions {
  sampleRate?: number
}

export const renderOfflineAudioBuffer = async (
  buffer: AudioBuffer,
  effects: AudioEffects,
  options: OfflineRenderOptions = {},
): Promise<AudioBuffer> => {
  const rateFactor = Math.max(0.01, getPlaybackRateFactor(effects))
  const targetSampleRate = options.sampleRate ?? buffer.sampleRate
  const stretchedBuffer = stretchAudioBuffer(buffer, rateFactor)
  const playbackDuration = stretchedBuffer.duration
  const tailSeconds = getTailSeconds(effects)
  const totalDuration = playbackDuration + tailSeconds
  const length = Math.max(1, Math.ceil(totalDuration * targetSampleRate))

  const offlineContext = new OfflineAudioContext(stretchedBuffer.numberOfChannels, length, targetSampleRate)

  const source = offlineContext.createBufferSource()
  source.buffer = stretchedBuffer
  source.playbackRate.value = 1

  configureGraph(offlineContext, source, totalDuration, effects)

  source.start(0)

  return offlineContext.startRendering()
}

export const renderOfflineAudio = async (
  buffer: AudioBuffer,
  effects: AudioEffects,
): Promise<Blob> => {
  const renderedBuffer = await renderOfflineAudioBuffer(buffer, effects)
  const wav = audioBufferToWav(renderedBuffer)
  return new Blob([wav], { type: 'audio/wav' })
}
