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
    const rect = calculateContainRect(1920, 1080, 640, 360)
    expect(rect.x).toBeCloseTo(0)
    expect(rect.y).toBeCloseTo(0)
    expect(rect.width).toBeCloseTo(640)
    expect(rect.height).toBeCloseTo(360)
  })

  it('adds vertical padding when the image is taller', () => {
    const rect = calculateContainRect(1080, 1920, 640, 360)
    expect(rect.width).toBeCloseTo(202.5)
    expect(rect.height).toBeCloseTo(360)
    expect(rect.x).toBeCloseTo((640 - rect.width) / 2)
    expect(rect.y).toBeCloseTo(0)
  })

  it('returns full target size when source dimensions are invalid', () => {
    const rect = calculateContainRect(0, 0, 640, 360)
    expect(rect).toEqual({ x: 0, y: 0, width: 640, height: 360, scale: 1 })
  })
})
