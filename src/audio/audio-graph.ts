/* eslint-disable compat/compat */
import * as Tone from 'tone'
import { createNoiseBuffer, createReverbImpulse, createVinylNoiseBuffer } from './audio-utils'

export interface AudioGraphNodes {
  masterGain: GainNode
  delay: DelayNode
  feedback: GainNode
  lowPass: BiquadFilterNode
  highPass: BiquadFilterNode
  noiseGain: GainNode
  vinylGain: GainNode
  convolver: ConvolverNode
  reverbGain: GainNode
  dryGain: GainNode
  distortion: WaveShaperNode
  pitchShift: Tone.PitchShift
}

export interface AudioGraph {
  context: AudioContext
  nodes: AudioGraphNodes
  ensureConnections: () => void
  getNoiseBuffer: () => AudioBuffer
  getVinylBuffer: () => AudioBuffer
  getReverbImpulse: (duration: number, decay: number) => AudioBuffer
  setVolume: (volume: number) => void
  dispose: () => Promise<void>
}

const getAudioContextConstructor = () => window.AudioContext || (window as any).webkitAudioContext

export const createAudioGraph = (): AudioGraph => {
  const AudioContextCtor = getAudioContextConstructor()
  const context: AudioContext = new AudioContextCtor()

  // Set Tone.js to use our audio context
  Tone.setContext(context as any)

  const masterGain = context.createGain()
  const delay = context.createDelay(5)
  const feedback = context.createGain()
  const lowPass = context.createBiquadFilter()
  const highPass = context.createBiquadFilter()
  const noiseGain = context.createGain()
  const vinylGain = context.createGain()
  const convolver = context.createConvolver()
  const reverbGain = context.createGain()
  const dryGain = context.createGain()
  const distortion = context.createWaveShaper()

  // Create Tone.js PitchShift node
  const pitchShift = new Tone.PitchShift()
  
  // Create gain nodes as input/output for pitch shift integration
  const pitchShiftInput = context.createGain()
  const pitchShiftOutput = context.createGain()

  lowPass.type = 'lowpass'
  highPass.type = 'highpass'

  noiseGain.gain.value = 0
  vinylGain.gain.value = 0
  feedback.gain.value = 0
  delay.delayTime.value = 0
  reverbGain.gain.value = 0
  dryGain.gain.value = 1
  pitchShift.pitch = 0
  pitchShiftInput.gain.value = 1
  pitchShiftOutput.gain.value = 1
  distortion.oversample = '4x'

  let connected = false

  const impulseCache = new Map<string, AudioBuffer>()
  let noiseBuffer: AudioBuffer | null = null
  let vinylBuffer: AudioBuffer | null = null

  const ensureConnections = () => {
    if (connected) return

    // Connect pitch shift - Tone.js integration pattern:
    // Native Web Audio node → Tone.js input (via _gainNode)
    // Tone.js node → Native Web Audio node (via .connect())
    highPass.connect(distortion)
    distortion.connect(pitchShiftInput)
    try {
      // Connect to Tone.js input's underlying GainNode
      pitchShiftInput.connect((pitchShift as any).input._gainNode)
      pitchShift.connect(pitchShiftOutput as any)
    } catch (e) {
      // Fallback for test environment - bypass pitch shift
      pitchShiftInput.connect(pitchShiftOutput)
    }
    pitchShiftOutput.connect(lowPass)
    
    lowPass.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)

    delay.connect(dryGain)
    delay.connect(convolver)
    convolver.connect(reverbGain)

    dryGain.connect(masterGain)
    reverbGain.connect(masterGain)
    lowPass.connect(masterGain)
    noiseGain.connect(masterGain)
    vinylGain.connect(masterGain)
    masterGain.connect(context.destination)

    connected = true
  }

  const getNoise = () => {
    if (!noiseBuffer) {
      noiseBuffer = createNoiseBuffer(context)
    }
    return noiseBuffer
  }

  const getVinyl = () => {
    if (!vinylBuffer) {
      vinylBuffer = createVinylNoiseBuffer(context)
    }
    return vinylBuffer
  }

  const getImpulse = (duration: number, decay: number) => {
    const key = `${context.sampleRate}:${duration.toFixed(2)}:${decay.toFixed(2)}`
    const cached = impulseCache.get(key)
    if (cached) {
      return cached
    }
    const impulse = createReverbImpulse(context, duration, decay)
    impulseCache.set(key, impulse)
    return impulse
  }

  const setVolume = (volume: number) => {
    masterGain.gain.value = volume
  }

  const dispose = async () => {
    connected = false
    impulseCache.clear()
    noiseBuffer = null
    vinylBuffer = null
    
    // Dispose Tone.js node and custom processors
    pitchShift.dispose()
    // close may reject if already closed; ignore errors intentionally
    try {
      await context.close()
    } catch (_error) {
      /* noop */
    }
  }

  return {
    context,
    nodes: {
      masterGain,
      delay,
      feedback,
      lowPass,
      highPass,
      noiseGain,
      vinylGain,
      convolver,
      reverbGain,
      dryGain,
      distortion,
      pitchShift,
    },
    ensureConnections,
    getNoiseBuffer: getNoise,
    getVinylBuffer: getVinyl,
    getReverbImpulse: getImpulse,
    setVolume,
    dispose,
  }
}
