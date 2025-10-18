import { describe, expect, it } from 'vitest'

import { calculateContainRect, getVideoDimensions, VIDEO_ORIENTATIONS } from '../video-layout'

describe('getVideoDimensions', () => {
  it('returns the configured dimensions for each orientation', () => {
    expect(getVideoDimensions('landscape')).toEqual(VIDEO_ORIENTATIONS.landscape)
    expect(getVideoDimensions('portrait')).toEqual(VIDEO_ORIENTATIONS.portrait)
  })
})

describe('calculateContainRect', () => {
  it('centers a wider image with horizontal padding', () => {
    const rect = calculateContainRect(1920, 1080, 320, 180)
    expect(rect.x).toBeCloseTo(0)
    expect(rect.y).toBeCloseTo(0)
    expect(rect.width).toBeCloseTo(320)
    expect(rect.height).toBeCloseTo(180)
  })

  it('adds vertical padding when the image is taller', () => {
    const rect = calculateContainRect(1080, 1920, 320, 180)
    expect(rect.width).toBeCloseTo(101.25)
    expect(rect.height).toBeCloseTo(180)
    expect(rect.x).toBeCloseTo((320 - rect.width) / 2)
    expect(rect.y).toBeCloseTo(0)
  })

  it('returns full target size when source dimensions are invalid', () => {
    const rect = calculateContainRect(0, 0, 320, 180)
    expect(rect).toEqual({ x: 0, y: 0, width: 320, height: 180, scale: 1 })
  })
})
