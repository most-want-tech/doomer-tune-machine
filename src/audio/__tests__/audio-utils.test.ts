import { describe, expect, it } from 'vitest'

import { createNoiseBuffer, createReverbImpulse, createVinylNoiseBuffer } from '../audio-utils'

const SAMPLE_RATE = 48_000

const makeContext = (seconds = 2, channels = 2) =>
  new OfflineAudioContext(channels, SAMPLE_RATE * seconds, SAMPLE_RATE)

describe('audio-utils', () => {
  it('creates a white noise buffer with expected bounds', () => {
    const context = makeContext()

    const buffer = createNoiseBuffer(context, 1)
    const samples = Array.from(buffer.getChannelData(0))

    expect(buffer.length).toBe(SAMPLE_RATE)
    expect(samples.every((value) => value >= -1 && value <= 1)).toBe(true)
    expect(samples.some((value) => value !== 0)).toBe(true)
  })

  it('creates a vinyl noise buffer with hiss and crackle', () => {
    const context = makeContext()

    const buffer = createVinylNoiseBuffer(context, 1)
    const samples = Array.from(buffer.getChannelData(0))

    expect(buffer.length).toBe(SAMPLE_RATE)
    expect(samples.some((value) => Math.abs(value) > 0)).toBe(true)
    expect(samples.every((value) => value >= -1 && value <= 1)).toBe(true)
  })

  it('creates a stereo reverb impulse that decays to silence', () => {
    const context = makeContext(3)

    const buffer = createReverbImpulse(context, 1.5, 2)

    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.length).toBe(Math.floor(SAMPLE_RATE * 1.5))

    for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex++) {
      const channel = buffer.getChannelData(channelIndex)
      expect(channel[0]).not.toBe(0)
      expect(Math.abs(channel[channel.length - 1])).toBeLessThanOrEqual(1e-6)
    }
  })
})
