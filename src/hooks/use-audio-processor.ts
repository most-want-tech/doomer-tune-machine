import { type MutableRefObject, useEffect, useRef, useState } from 'react'

import { DEFAULT_EFFECTS, getCompensatedPitch } from '@/audio/audio-effects'
import type { AudioEffects } from '@/audio/audio-effects'
import { getDistortionCurve } from '@/audio/audio-utils'
import { type AudioGraph, createAudioGraph } from '@/audio/audio-graph'
import { renderOfflineAudio } from '@/audio/offline-renderer'

const VINYL_GAIN = 0.15

const MIN_PLAYBACK_RATE = 0.01

const calculatePlaybackRate = (effects: AudioEffects) => {
  // Playback rate now ONLY controls speed, not pitch
  return Math.max(MIN_PLAYBACK_RATE, effects.playbackRate)
}

const stopLoopSource = (ref: MutableRefObject<AudioBufferSourceNode | null>) => {
  if (!ref.current) return
  try {
    ref.current.onended = null
    ref.current.stop()
  } catch (_error) {
    /* noop */
  }
  try {
    ref.current.disconnect()
  } catch (_error) {
    /* noop */
  }
  ref.current = null
}

export function useAudioProcessor() {
  const graphRef = useRef<AudioGraph | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const vinylSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const effectsRef = useRef<AudioEffects>(DEFAULT_EFFECTS)

  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const pauseTimeRef = useRef(0)
  const startContextTimeRef = useRef(0)
  const playbackRateRef = useRef(1)
  const animationFrameRef = useRef<number | null>(null)

  const ensureGraph = (): AudioGraph => {
    if (!graphRef.current) {
      const graph = createAudioGraph()
      graph.ensureConnections()
      graph.nodes.convolver.buffer = graph.getReverbImpulse(
        DEFAULT_EFFECTS.reverbDecay,
        DEFAULT_EFFECTS.reverbDecay,
      )
      graphRef.current = graph
      playbackRateRef.current = calculatePlaybackRate(effectsRef.current)
      applyEffects(graph, effectsRef.current)
    }
    return graphRef.current!
  }

  const applyEffects = (graph: AudioGraph, effects: AudioEffects) => {
    const { context, nodes } = graph
    const now = context.currentTime

    nodes.delay.delayTime.setValueAtTime(effects.delayTime, now)
    nodes.feedback.gain.setValueAtTime(effects.delayFeedback, now)
    nodes.noiseGain.gain.setValueAtTime(effects.noiseLevel, now)
    nodes.lowPass.frequency.setValueAtTime(effects.lowPassFreq, now)
    nodes.highPass.frequency.setValueAtTime(effects.highPassFreq, now)
    nodes.vinylGain.gain.setValueAtTime(effects.vinylCrackle ? VINYL_GAIN : 0, now)
    nodes.reverbGain.gain.setValueAtTime(effects.reverbMix, now)
    nodes.dryGain.gain.setValueAtTime(1 - effects.reverbMix, now)

    const distortionCurve = getDistortionCurve(context, effects.distortionAmount)
    if (nodes.distortion.curve !== distortionCurve) {
      nodes.distortion.curve = distortionCurve as Float32Array<ArrayBuffer>
    }

    // Apply pitch shift
    // To keep pitch independent of playback rate, we need to compensate:
    // When playback rate changes, pitch changes by 12 * log2(rate) semitones
    // So we apply the inverse: userPitch - (12 * log2(playbackRate))
    const nextPlaybackRate = calculatePlaybackRate(effects)
    nodes.pitchShift.pitch = getCompensatedPitch({ ...effects, playbackRate: nextPlaybackRate })

    const impulse = graph.getReverbImpulse(effects.reverbDecay, effects.reverbDecay)
    if (nodes.convolver.buffer !== impulse) {
      nodes.convolver.buffer = impulse
    }

    if (sourceNodeRef.current) {
      const progress = getPlaybackPosition()
      playbackRateRef.current = nextPlaybackRate
      pauseTimeRef.current = progress
      startContextTimeRef.current = context.currentTime
      sourceNodeRef.current.playbackRate.setValueAtTime(nextPlaybackRate, now)
      setCurrentTime(progress)
    } else {
      playbackRateRef.current = nextPlaybackRate
    }

    manageNoiseSource(graph, effects, isPlayingRef.current)
    manageVinylSource(graph, effects, isPlayingRef.current)
  }

  const manageNoiseSource = (
    graph: AudioGraph,
    effects: AudioEffects,
    shouldPlay: boolean,
  ) => {
    if (effects.noiseLevel > 0 && shouldPlay) {
      if (!noiseSourceRef.current) {
        const buffer = graph.getNoiseBuffer()
        const source = graph.context.createBufferSource()
        source.buffer = buffer
        source.loop = true
        source.connect(graph.nodes.noiseGain)
        source.start(0)
        noiseSourceRef.current = source
      }
    } else if (noiseSourceRef.current) {
      stopLoopSource(noiseSourceRef)
    }
  }

  const manageVinylSource = (
    graph: AudioGraph,
    effects: AudioEffects,
    shouldPlay: boolean,
  ) => {
    if (effects.vinylCrackle && shouldPlay) {
      if (!vinylSourceRef.current) {
        const buffer = graph.getVinylBuffer()
        const source = graph.context.createBufferSource()
        source.buffer = buffer
        source.loop = true
        source.connect(graph.nodes.vinylGain)
        source.start(0)
        vinylSourceRef.current = source
      }
    } else if (vinylSourceRef.current) {
      stopLoopSource(vinylSourceRef)
    }
  }

  const loadAudioFile = async (file: File) => {
    const graph = ensureGraph()

    stop()

    const arrayBuffer = await file.arrayBuffer()
    const decodedBuffer = await graph.context.decodeAudioData(arrayBuffer.slice(0))

    audioBufferRef.current = decodedBuffer
    setDuration(decodedBuffer.duration)
    pauseTimeRef.current = 0
    setCurrentTime(0)

    return decodedBuffer
  }

  const loadAudioBuffer = async (arrayBuffer: ArrayBuffer) => {
    const graph = ensureGraph()

    stop()

    const decodedBuffer = await graph.context.decodeAudioData(arrayBuffer.slice(0))

    audioBufferRef.current = decodedBuffer
    setDuration(decodedBuffer.duration)
    pauseTimeRef.current = 0
    setCurrentTime(0)

    return decodedBuffer
  }

  const getPlaybackPosition = () => {
    const graph = graphRef.current
    if (!graph || !isPlayingRef.current) {
      return pauseTimeRef.current
    }

    const elapsed = (graph.context.currentTime - startContextTimeRef.current) * playbackRateRef.current
    return Math.min(duration, pauseTimeRef.current + Math.max(0, elapsed))
  }

  const updateClock = () => {
    if (!isPlayingRef.current) return

    const position = getPlaybackPosition()
    if (position >= duration) {
      finalizePlayback(true)
      return
    }

    setCurrentTime(position)
    animationFrameRef.current = requestAnimationFrame(updateClock)
  }

  const finalizePlayback = (resetPosition: boolean) => {
    const position = getPlaybackPosition()
    isPlayingRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setIsPlaying(false)

    if (resetPosition) {
      pauseTimeRef.current = 0
      setCurrentTime(0)
    } else {
      pauseTimeRef.current = position
      setCurrentTime(position)
    }
  }

  const play = async () => {
    const graph = ensureGraph()
    if (!audioBufferRef.current) return

    if (graph.context.state === 'suspended') {
      await graph.context.resume()
    }

    stop(false)

    const source = graph.context.createBufferSource()
    source.buffer = audioBufferRef.current
    source.playbackRate.value = playbackRateRef.current
    source.onended = () => finalizePlayback(true)

    sourceNodeRef.current = source

    graph.ensureConnections()
    source.connect(graph.nodes.highPass)

    startContextTimeRef.current = graph.context.currentTime
    isPlayingRef.current = true
    setIsPlaying(true)

    source.start(0, pauseTimeRef.current)
    animationFrameRef.current = requestAnimationFrame(updateClock)

    manageNoiseSource(graph, effectsRef.current, true)
    manageVinylSource(graph, effectsRef.current, true)
  }

  const pause = () => {
    if (!isPlayingRef.current || !sourceNodeRef.current) return

    const position = getPlaybackPosition()
    stop(false)
    pauseTimeRef.current = position
    setCurrentTime(position)
  }

  const stop = (resetPosition = true) => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null
        sourceNodeRef.current.stop()
      } catch (_error) {
        /* noop */
      }
      try {
        sourceNodeRef.current.disconnect()
      } catch (_error) {
        /* noop */
      }
      sourceNodeRef.current = null
    }

    stopLoopSource(noiseSourceRef)
    stopLoopSource(vinylSourceRef)

    finalizePlayback(resetPosition)
  }

  const seek = (time: number) => {
    const clamped = Math.max(0, Math.min(duration, time))
    const wasPlaying = isPlayingRef.current

    if (wasPlaying) {
      pause()
    }

    pauseTimeRef.current = clamped
    setCurrentTime(clamped)

    if (wasPlaying) {
      void play()
    }
  }

  const setVolume = (volume: number) => {
    const graph = graphRef.current
    if (!graph) return
    graph.setVolume(volume)
  }

  const updateEffects = (effects: AudioEffects) => {
    effectsRef.current = effects
    const graph = graphRef.current
    if (!graph) {
      return
    }
    applyEffects(graph, effects)
  }

  const exportAudio = async (effects: AudioEffects) => {
    if (!audioBufferRef.current) {
      throw new Error('No audio loaded')
    }
    return renderOfflineAudio(audioBufferRef.current, effects)
  }

  useEffect(() => {
    return () => {
      stop()
      if (graphRef.current) {
        graphRef.current.dispose().catch(() => {
          /* noop */
        })
        graphRef.current = null
      }
    }
  }, [])

  return {
    loadAudioFile,
    loadAudioBuffer,
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

export { DEFAULT_EFFECTS }
export type { AudioEffects }
