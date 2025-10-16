import { useEffect, useRef, useState } from 'react'

export interface AudioEffects {
  delayTime: number
  delayFeedback: number
  noiseLevel: number
  lowPassFreq: number
  highPassFreq: number
  vinylCrackle: boolean
  pitchShift: number
  playbackRate: number
}

export const DEFAULT_EFFECTS: AudioEffects = {
  delayTime: 0,
  delayFeedback: 0,
  noiseLevel: 0,
  lowPassFreq: 22000,
  highPassFreq: 20,
  vinylCrackle: false,
  pitchShift: 0,
  playbackRate: 1,
}

export function useAudioProcessor() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const delayNodeRef = useRef<DelayNode | null>(null)
  const feedbackGainRef = useRef<GainNode | null>(null)
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null)
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null)
  const noiseGainRef = useRef<GainNode | null>(null)
  const vinylNoiseGainRef = useRef<GainNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const vinylSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const startTimeRef = useRef(0)
  const pauseTimeRef = useRef(0)
  const animationFrameRef = useRef<number>()

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      gainNodeRef.current = audioContextRef.current.createGain()
      delayNodeRef.current = audioContextRef.current.createDelay(5)
      feedbackGainRef.current = audioContextRef.current.createGain()
      lowPassFilterRef.current = audioContextRef.current.createBiquadFilter()
      highPassFilterRef.current = audioContextRef.current.createBiquadFilter()
      noiseGainRef.current = audioContextRef.current.createGain()
      vinylNoiseGainRef.current = audioContextRef.current.createGain()

      lowPassFilterRef.current.type = 'lowpass'
      highPassFilterRef.current.type = 'highpass'
      
      noiseGainRef.current.gain.value = 0
      vinylNoiseGainRef.current.gain.value = 0
      feedbackGainRef.current.gain.value = 0
      delayNodeRef.current.delayTime.value = 0
    }
  }

  const generateNoise = () => {
    if (!audioContextRef.current) return null
    
    const bufferSize = audioContextRef.current.sampleRate * 2
    const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
    const output = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    return buffer
  }

  const generateVinylNoise = () => {
    if (!audioContextRef.current) return null
    
    const bufferSize = audioContextRef.current.sampleRate * 2
    const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
    const output = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      const crackle = Math.random() > 0.995 ? (Math.random() - 0.5) * 0.5 : 0
      const hiss = (Math.random() - 0.5) * 0.02
      output[i] = crackle + hiss
    }
    
    return buffer
  }

  const connectNodes = () => {
    if (
      !audioContextRef.current ||
      !gainNodeRef.current ||
      !delayNodeRef.current ||
      !feedbackGainRef.current ||
      !lowPassFilterRef.current ||
      !highPassFilterRef.current ||
      !noiseGainRef.current ||
      !vinylNoiseGainRef.current
    ) return

    highPassFilterRef.current.connect(lowPassFilterRef.current)
    lowPassFilterRef.current.connect(delayNodeRef.current)
    delayNodeRef.current.connect(feedbackGainRef.current)
    feedbackGainRef.current.connect(delayNodeRef.current)
    delayNodeRef.current.connect(gainNodeRef.current)
    lowPassFilterRef.current.connect(gainNodeRef.current)
    noiseGainRef.current.connect(gainNodeRef.current)
    vinylNoiseGainRef.current.connect(gainNodeRef.current)
    gainNodeRef.current.connect(audioContextRef.current.destination)
  }

  const loadAudioFile = async (file: File) => {
    initAudioContext()
    
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer)
    
    audioBufferRef.current = audioBuffer
    setDuration(audioBuffer.duration)
    setCurrentTime(0)
    pauseTimeRef.current = 0
    
    return audioBuffer
  }

  const updateTimeDisplay = () => {
    if (isPlaying && audioContextRef.current) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current
      const newTime = pauseTimeRef.current + elapsed
      
      if (newTime >= duration) {
        stop()
        return
      }
      
      setCurrentTime(newTime)
      animationFrameRef.current = requestAnimationFrame(updateTimeDisplay)
    }
  }

  const play = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }

    stop()

    sourceNodeRef.current = audioContextRef.current.createBufferSource()
    sourceNodeRef.current.buffer = audioBufferRef.current
    sourceNodeRef.current.playbackRate.value = 1

    if (noiseSourceRef.current) noiseSourceRef.current.stop()
    if (vinylSourceRef.current) vinylSourceRef.current.stop()

    const noiseBuffer = generateNoise()
    if (noiseBuffer) {
      noiseSourceRef.current = audioContextRef.current.createBufferSource()
      noiseSourceRef.current.buffer = noiseBuffer
      noiseSourceRef.current.loop = true
      noiseSourceRef.current.connect(noiseGainRef.current!)
      noiseSourceRef.current.start()
    }

    const vinylBuffer = generateVinylNoise()
    if (vinylBuffer) {
      vinylSourceRef.current = audioContextRef.current.createBufferSource()
      vinylSourceRef.current.buffer = vinylBuffer
      vinylSourceRef.current.loop = true
      vinylSourceRef.current.connect(vinylNoiseGainRef.current!)
      vinylSourceRef.current.start()
    }

    connectNodes()
    sourceNodeRef.current.connect(highPassFilterRef.current!)
    sourceNodeRef.current.start(0, pauseTimeRef.current)
    
    startTimeRef.current = audioContextRef.current.currentTime
    setIsPlaying(true)
    updateTimeDisplay()
  }

  const pause = () => {
    if (sourceNodeRef.current && isPlaying) {
      sourceNodeRef.current.stop()
      sourceNodeRef.current = null
      
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop()
        noiseSourceRef.current = null
      }
      
      if (vinylSourceRef.current) {
        vinylSourceRef.current.stop()
        vinylSourceRef.current = null
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      setIsPlaying(false)
      pauseTimeRef.current = currentTime
    }
  }

  const stop = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop()
      sourceNodeRef.current = null
    }
    
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop()
      noiseSourceRef.current = null
    }
    
    if (vinylSourceRef.current) {
      vinylSourceRef.current.stop()
      vinylSourceRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    setIsPlaying(false)
    setCurrentTime(0)
    pauseTimeRef.current = 0
  }

  const seek = (time: number) => {
    const wasPlaying = isPlaying
    if (wasPlaying) {
      pause()
    }
    pauseTimeRef.current = time
    setCurrentTime(time)
    if (wasPlaying) {
      play()
    }
  }

  const setVolume = (volume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume
    }
  }

  const updateEffects = (effects: AudioEffects) => {
    if (!audioContextRef.current) return

    if (delayNodeRef.current) {
      delayNodeRef.current.delayTime.value = effects.delayTime
    }
    
    if (feedbackGainRef.current) {
      feedbackGainRef.current.gain.value = effects.delayFeedback
    }
    
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.value = effects.noiseLevel
    }
    
    if (lowPassFilterRef.current) {
      lowPassFilterRef.current.frequency.value = effects.lowPassFreq
    }
    
    if (highPassFilterRef.current) {
      highPassFilterRef.current.frequency.value = effects.highPassFreq
    }
    
    if (vinylNoiseGainRef.current) {
      vinylNoiseGainRef.current.gain.value = effects.vinylCrackle ? 0.15 : 0
    }
    
    if (sourceNodeRef.current) {
      const pitchFactor = Math.pow(2, effects.pitchShift / 12)
      sourceNodeRef.current.playbackRate.value = effects.playbackRate * pitchFactor
    }
  }

  const exportAudio = async (effects: AudioEffects): Promise<Blob> => {
    if (!audioBufferRef.current) {
      throw new Error('No audio loaded')
    }

    const offlineContext = new OfflineAudioContext(
      audioBufferRef.current.numberOfChannels,
      audioBufferRef.current.length,
      audioBufferRef.current.sampleRate
    )

    const source = offlineContext.createBufferSource()
    source.buffer = audioBufferRef.current

    const gain = offlineContext.createGain()
    const delay = offlineContext.createDelay(5)
    const feedbackGain = offlineContext.createGain()
    const lowPass = offlineContext.createBiquadFilter()
    const highPass = offlineContext.createBiquadFilter()
    const noiseGain = offlineContext.createGain()
    const vinylGain = offlineContext.createGain()

    lowPass.type = 'lowpass'
    highPass.type = 'highpass'

    delay.delayTime.value = effects.delayTime
    feedbackGain.gain.value = effects.delayFeedback
    noiseGain.gain.value = effects.noiseLevel
    lowPass.frequency.value = effects.lowPassFreq
    highPass.frequency.value = effects.highPassFreq
    vinylGain.gain.value = effects.vinylCrackle ? 0.15 : 0

    const pitchFactor = Math.pow(2, effects.pitchShift / 12)
    source.playbackRate.value = effects.playbackRate * pitchFactor

    if (effects.noiseLevel > 0) {
      const noiseBuffer = generateNoiseForOffline(offlineContext)
      const noiseSource = offlineContext.createBufferSource()
      noiseSource.buffer = noiseBuffer
      noiseSource.connect(noiseGain)
      noiseSource.start()
    }

    if (effects.vinylCrackle) {
      const vinylBuffer = generateVinylNoiseForOffline(offlineContext)
      const vinylSource = offlineContext.createBufferSource()
      vinylSource.buffer = vinylBuffer
      vinylSource.connect(vinylGain)
      vinylSource.start()
    }

    source.connect(highPass)
    highPass.connect(lowPass)
    lowPass.connect(delay)
    delay.connect(feedbackGain)
    feedbackGain.connect(delay)
    delay.connect(gain)
    lowPass.connect(gain)
    noiseGain.connect(gain)
    vinylGain.connect(gain)
    gain.connect(offlineContext.destination)

    source.start()

    const renderedBuffer = await offlineContext.startRendering()
    const wav = audioBufferToWav(renderedBuffer)
    return new Blob([wav], { type: 'audio/wav' })
  }

  const generateNoiseForOffline = (context: OfflineAudioContext) => {
    const bufferSize = context.length
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const output = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    return buffer
  }

  const generateVinylNoiseForOffline = (context: OfflineAudioContext) => {
    const bufferSize = context.length
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const output = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      const crackle = Math.random() > 0.995 ? (Math.random() - 0.5) * 0.5 : 0
      const hiss = (Math.random() - 0.5) * 0.02
      output[i] = crackle + hiss
    }
    
    return buffer
  }

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2
    const arrayBuffer = new ArrayBuffer(44 + length)
    const view = new DataView(arrayBuffer)

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, buffer.numberOfChannels, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true)
    view.setUint16(32, buffer.numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length, true)

    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
        offset += 2
      }
    }

    return arrayBuffer
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop()
      }
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop()
      }
      if (vinylSourceRef.current) {
        vinylSourceRef.current.stop()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    loadAudioFile,
    play,
    pause,
    stop,
    seek,
    setVolume,
    updateEffects,
    exportAudio,
    isPlaying,
    currentTime,
    duration,
  }
}
