import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AudioGraph } from '@/audio/audio-graph'
import { DEFAULT_EFFECTS, useAudioProcessor } from '@/hooks/use-audio-processor'

type BufferSourceMock = {
  connect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  playbackRate: {
    value: number
    setValueAtTime: ReturnType<typeof vi.fn>
  }
  loop: boolean
  buffer: AudioBuffer | null
  onended: ((this: AudioBufferSourceNode, ev: Event) => unknown) | null
}

type GraphMock = AudioGraph & {
  bufferSources: BufferSourceMock[]
  decodedBuffer: AudioBuffer
  noiseBuffer: AudioBuffer
  vinylBuffer: AudioBuffer
  impulseBuffer: AudioBuffer
  distortionCurve: Float32Array | null
}

let graphMock: GraphMock

const { createAudioGraphMock, renderOfflineAudioMock } = vi.hoisted(() => {
  return {
    createAudioGraphMock: vi.fn(() => graphMock as GraphMock),
    renderOfflineAudioMock: vi.fn(async () => new Blob(['audio'])),
  }
})

vi.mock('@/audio/audio-graph', () => ({
  createAudioGraph: createAudioGraphMock,
}))

vi.mock('@/audio/offline-renderer', () => ({
  renderOfflineAudio: renderOfflineAudioMock,
}))

const createAudioParam = (initial = 0): AudioParam => {
  const param = {
    value: initial,
    setValueAtTime: vi.fn((value: number) => {
      param.value = value
      return param as unknown as AudioParam
    }),
  }
  return param as unknown as AudioParam
}

const createBufferSourceStub = (): BufferSourceMock => {
  const playbackRateParam = {
    value: 1,
    setValueAtTime: vi.fn((value: number) => {
      playbackRateParam.value = value
      return playbackRateParam as unknown as AudioParam
    }),
  }

  return {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    playbackRate: playbackRateParam,
    loop: false,
    buffer: null,
    onended: null,
  }
}

const createGainNodeStub = () => ({
  connect: vi.fn(),
  gain: createAudioParam(1),
})

const createFilterNodeStub = () => ({
  connect: vi.fn(),
  type: 'lowpass',
  frequency: createAudioParam(),
})

const createDelayNodeStub = () => ({
  connect: vi.fn(),
  delayTime: createAudioParam(),
})

const createConvolverNodeStub = () => ({
  connect: vi.fn(),
  buffer: null as AudioBuffer | null,
})

const createAudioBufferStub = (): AudioBuffer => {
  const data = new Float32Array(48_000)

  return {
    duration: 1,
    length: 48_000,
    numberOfChannels: 1,
    sampleRate: 48_000,
    getChannelData: vi.fn(() => data),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer
}

const createGraphMock = (): GraphMock => {
  const bufferSources: BufferSourceMock[] = []
  const decodedBuffer = createAudioBufferStub()
  const noiseBuffer = createAudioBufferStub()
  const vinylBuffer = createAudioBufferStub()
  const impulseBuffer = createAudioBufferStub()

  const context = {
    currentTime: 0,
    state: 'suspended' as AudioContextState,
    resume: vi.fn(async () => {
      context.state = 'running'
    }),
    createBufferSource: vi.fn(() => {
      const source = createBufferSourceStub()
      bufferSources.push(source)
      return source as unknown as AudioBufferSourceNode
    }),
    decodeAudioData: vi.fn(async () => decodedBuffer),
    close: vi.fn(),
  }

  let distortionCurve: Float32Array | null = null

  const nodes = {
    masterGain: createGainNodeStub(),
    delay: createDelayNodeStub(),
    feedback: createGainNodeStub(),
    lowPass: createFilterNodeStub(),
    highPass: createFilterNodeStub(),
    noiseGain: createGainNodeStub(),
    vinylGain: createGainNodeStub(),
    convolver: createConvolverNodeStub(),
    reverbGain: createGainNodeStub(),
    dryGain: createGainNodeStub(),
    distortion: {
      connect: vi.fn(),
      oversample: '4x' as WaveShaperNode['oversample'],
      get curve() {
        return distortionCurve
      },
      set curve(value: Float32Array | null) {
        distortionCurve = value
      },
    },
    pitchShift: {
      pitch: 0,
      connect: vi.fn(),
      input: { connect: vi.fn() },
      dispose: vi.fn(),
    },
  }

  return {
    context: context as unknown as AudioContext,
    nodes: nodes as unknown as GraphMock['nodes'],
    ensureConnections: vi.fn(),
    getNoiseBuffer: vi.fn(() => noiseBuffer),
    getVinylBuffer: vi.fn(() => vinylBuffer),
    getReverbImpulse: vi.fn(() => impulseBuffer),
    setVolume: vi.fn((volume: number) => {
      ;(nodes.masterGain.gain as unknown as { value: number }).value = volume
    }),
    dispose: vi.fn(async () => undefined),
    bufferSources,
    decodedBuffer,
    noiseBuffer,
    vinylBuffer,
    impulseBuffer,
    get distortionCurve() {
      return distortionCurve
    },
  } as unknown as GraphMock
}

const createFakeFile = () => ({
  arrayBuffer: async () => new ArrayBuffer(16),
}) as unknown as File

const loadTestAudio = async () => {
  const hook = renderHook(() => useAudioProcessor())
  const file = createFakeFile()

  await act(async () => {
    await hook.result.current.loadAudioFile(file)
  })

  return hook
}

describe('useAudioProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    graphMock = createGraphMock()
    createAudioGraphMock.mockReturnValue(graphMock)
    renderOfflineAudioMock.mockResolvedValue(new Blob(['audio']))
  })

  it('loads audio data and updates duration', async () => {
    const { result } = await loadTestAudio()

    expect(graphMock.context.decodeAudioData).toHaveBeenCalled()
    expect(result.current.duration).toBeCloseTo(graphMock.decodedBuffer.duration)
    expect(result.current.currentTime).toBe(0)
    expect(result.current.isPlaying).toBe(false)
  })

  it('plays from a suspended context and updates state', async () => {
    const { result } = await loadTestAudio()

    await act(async () => {
      await result.current.play()
    })

    expect(graphMock.context.resume).toHaveBeenCalled()
    expect(graphMock.context.createBufferSource).toHaveBeenCalled()
    expect(graphMock.ensureConnections).toHaveBeenCalled()
    expect(result.current.isPlaying).toBe(true)
  })

  it('pauses playback and preserves current time', async () => {
    const { result } = await loadTestAudio()

    await act(async () => {
      await result.current.play()
    })

    ;(graphMock.context as unknown as { currentTime: number }).currentTime = 0.5

    act(() => {
      result.current.pause()
    })

    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentTime).toBeCloseTo(0.5)
  })

  it('spins noise loop while playing and stops it on pause', async () => {
    const { result } = await loadTestAudio()

    await act(async () => {
      await result.current.play()
    })

    act(() => {
      result.current.updateEffects({ ...DEFAULT_EFFECTS, noiseLevel: 0.2 })
    })

    expect(graphMock.getNoiseBuffer).toHaveBeenCalledTimes(1)
    expect(graphMock.bufferSources.length).toBe(2)

    const noiseSource = graphMock.bufferSources[graphMock.bufferSources.length - 1]
    expect(noiseSource).toBeDefined()
    expect(noiseSource?.loop).toBe(true)

    act(() => {
      result.current.pause()
    })

    expect(noiseSource?.stop).toHaveBeenCalled()
    expect(noiseSource?.disconnect).toHaveBeenCalled()
  })

  it('updates playback rate and adjusts timeline progression', async () => {
    const { result } = await loadTestAudio()

    await act(async () => {
      await result.current.play()
    })

    ;(graphMock.context as unknown as { currentTime: number }).currentTime = 0.5

    act(() => {
      result.current.updateEffects({ ...DEFAULT_EFFECTS, playbackRate: 1.5, pitchShift: 12 })
    })

    const mainSource = graphMock.bufferSources[0]
    expect(mainSource.playbackRate.setValueAtTime).toHaveBeenCalled()
    // Playback rate should now be independent of pitch shift
    expect(mainSource.playbackRate.value).toBeCloseTo(1.5)
    // Pitch shift should be compensated for playback rate
    // compensatedPitch = 12 - (12 * log2(1.5)) = 12 - 7.019... ≈ 4.98
    const expectedPitch = 12 - 12 * Math.log2(1.5)
    expect(graphMock.nodes.pitchShift.pitch).toBeCloseTo(expectedPitch, 2)

    ;(graphMock.context as unknown as { currentTime: number }).currentTime = 0.75

    act(() => {
      result.current.pause()
    })

    // With playback rate 1.5, advancing 0.25s real time = 0.375s audio time
    // Starting from 0.5s + 0.375s = 0.875s
    expect(result.current.currentTime).toBeCloseTo(0.875)
  })

  it('applies distortion curve when effects change', async () => {
    const { result } = await loadTestAudio()

    act(() => {
      result.current.updateEffects({
        ...DEFAULT_EFFECTS,
        distortionAmount: 75,
      })
    })

    expect(graphMock.distortionCurve).toBeInstanceOf(Float32Array)
  })

  it('exports audio through the offline renderer', async () => {
    const { result } = await loadTestAudio()

    let exported: Blob | undefined
    await act(async () => {
      exported = await result.current.exportAudio(DEFAULT_EFFECTS)
    })

    expect(renderOfflineAudioMock).toHaveBeenCalledWith(graphMock.decodedBuffer, DEFAULT_EFFECTS)
    expect(exported).toBeInstanceOf(Blob)
  })
})
