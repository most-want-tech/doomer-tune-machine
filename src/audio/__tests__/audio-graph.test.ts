import { describe, expect, it, vi } from 'vitest'

import { createAudioGraph } from '../audio-graph'

const setupGraph = () => {
  const graph = createAudioGraph()
  const { nodes } = graph

  return { graph, nodes }
}

describe('audio-graph', () => {
  it('connects the graph once and avoids duplicate connections', () => {
    const { graph, nodes } = setupGraph()

    const connectSpies = [
      vi.spyOn(nodes.highPass, 'connect'),
      vi.spyOn(nodes.lowPass, 'connect'),
      vi.spyOn(nodes.delay, 'connect'),
      vi.spyOn(nodes.feedback, 'connect'),
      vi.spyOn(nodes.convolver, 'connect'),
      vi.spyOn(nodes.reverbGain, 'connect'),
      vi.spyOn(nodes.dryGain, 'connect'),
      vi.spyOn(nodes.noiseGain, 'connect'),
      vi.spyOn(nodes.vinylGain, 'connect'),
      vi.spyOn(nodes.masterGain, 'connect'),
    ]

    graph.ensureConnections()
    connectSpies.forEach((spy) => expect(spy).toHaveBeenCalled())

    connectSpies.forEach((spy) => spy.mockClear())
    graph.ensureConnections()
    connectSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled())

    connectSpies.forEach((spy) => spy.mockRestore())
  })

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
