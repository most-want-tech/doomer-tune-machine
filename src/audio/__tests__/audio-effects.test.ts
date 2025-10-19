import { describe, expect, it } from 'vitest'

import { DEFAULT_EFFECTS, getCompensatedPitch } from '../audio-effects'

describe('getCompensatedPitch', () => {
  it('returns the original pitch shift when playback rate is neutral', () => {
    const compensated = getCompensatedPitch(DEFAULT_EFFECTS)
    expect(compensated).toBeCloseTo(DEFAULT_EFFECTS.pitchShift)
  })

  it('subtracts playback-induced pitch when rate increases', () => {
    const compensated = getCompensatedPitch({ ...DEFAULT_EFFECTS, playbackRate: 1.5, pitchShift: 12 })
    const expected = 12 - 12 * Math.log2(1.5)
    expect(compensated).toBeCloseTo(expected)
  })

  it('guards against near-zero playback rates to avoid infinite compensation', () => {
    const compensated = getCompensatedPitch({ ...DEFAULT_EFFECTS, playbackRate: 0, pitchShift: 0 })
    expect(Number.isFinite(compensated)).toBe(true)
  })
})
