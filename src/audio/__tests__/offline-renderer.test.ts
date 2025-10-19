import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_EFFECTS } from '../audio-effects'
import { renderOfflineAudioBuffer } from '../offline-renderer'

const pitchShiftInstances: Array<{ pitch: number }> = []

vi.mock('tone', () => {
  return {
    setContext: vi.fn(),
    PitchShift: vi.fn().mockImplementation(() => {
      const instance = {
        pitch: 0,
        connect: vi.fn().mockReturnThis(),
        dispose: vi.fn(),
        input: {
          _gainNode: {
            connect: vi.fn().mockReturnThis(),
          },
        },
      }
      pitchShiftInstances.push(instance)
      return instance
    }),
  }
})

describe('offline renderer', () => {
  beforeEach(() => {
    pitchShiftInstances.length = 0
  })

  it('matches runtime pitch compensation when playback rate changes', async () => {
    const sampleRate = 44100
    const context = new OfflineAudioContext(1, sampleRate, sampleRate)
    const buffer = context.createBuffer(1, sampleRate, sampleRate)

    await renderOfflineAudioBuffer(buffer, { ...DEFAULT_EFFECTS, playbackRate: 1.5, pitchShift: 12 })

    expect(pitchShiftInstances).toHaveLength(1)
    const compensated = 12 - 12 * Math.log2(1.5)
    expect(pitchShiftInstances[0].pitch).toBeCloseTo(compensated)
  })
})
