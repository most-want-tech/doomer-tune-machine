import { describe, expect, it, vi } from 'vitest'

import { createAudioGraph } from '../audio-graph'

// Mock Tone.js
vi.mock('tone', () => {
  return {
    setContext: vi.fn(),
    PitchShift: vi.fn().mockImplementation(() => {
      // Create a mock GainNode for the input
      const mockGainNode = {
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
        gain: { value: 1 },
        context: {},
        numberOfInputs: 1,
        numberOfOutputs: 1,
      }
      
      const pitchShiftInstance = {
        pitch: 0,
        connect: vi.fn().mockImplementation(() => pitchShiftInstance),
        input: {
          _gainNode: mockGainNode,
          connect: vi.fn().mockReturnThis(),
        },
        toDestination: vi.fn(),
        dispose: vi.fn(),
      }
      
      return pitchShiftInstance
    }),
  }
})

const setupGraph = () => {
  const graph = createAudioGraph()
  const { nodes } = graph

  return { graph, nodes }
}

describe('audio-graph', () => {
  it('caches generated buffers and impulses', async () => {
    const { graph } = setupGraph()

    const noiseA = graph.getNoiseBuffer()
    const noiseB = graph.getNoiseBuffer()
    expect(noiseB).toBe(noiseA)

    const vinylA = graph.getVinylBuffer()
    const vinylB = graph.getVinylBuffer()
    expect(vinylB).toBe(vinylA)

    const impulseA = graph.getReverbImpulse(1.5, 2)
    const impulseB = graph.getReverbImpulse(1.5, 2)
    const impulseC = graph.getReverbImpulse(1.5, 2.5)

    expect(impulseB).toBe(impulseA)
    expect(impulseC).not.toBe(impulseA)

    const closeSpy = vi.spyOn(graph.context, 'close').mockResolvedValue(undefined as unknown as void)

    await graph.dispose()
    expect(closeSpy).toHaveBeenCalledTimes(1)

  const noiseC = graph.getNoiseBuffer()
  expect(noiseC).not.toBe(noiseA)

  const vinylC = graph.getVinylBuffer()
  expect(vinylC).not.toBe(vinylA)

  const impulseD = graph.getReverbImpulse(1.5, 2)
  expect(impulseD).not.toBe(impulseA)

    closeSpy.mockRestore()
  })

  it('updates master gain when changing volume', () => {
    const { graph, nodes } = setupGraph()

    graph.setVolume(0.42)
    expect(nodes.masterGain.gain.value).toBeCloseTo(0.42)

    graph.setVolume(0.05)
    expect(nodes.masterGain.gain.value).toBeCloseTo(0.05)
  })
})
