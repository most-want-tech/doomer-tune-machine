import { describe, expect, it, vi } from 'vitest'

import { getImageDimensions, isSupportedImageType, validateImageFile } from '../image-utils'

describe('isSupportedImageType', () => {
  it('accepts known mime types', () => {
    const file = new File(['data'], 'cover.jpg', { type: 'image/jpeg' })
    expect(isSupportedImageType(file)).toBe(true)
  })

  it('falls back to extension when mime type is missing', () => {
    const file = new File(['data'], 'cover.PNG', { type: '' })
    expect(isSupportedImageType(file)).toBe(true)
  })

  it('rejects unsupported files', () => {
    const file = new File(['data'], 'cover.txt', { type: 'text/plain' })
    expect(isSupportedImageType(file)).toBe(false)
  })
})

describe('validateImageFile', () => {
  it('throws when the file is not supported', () => {
    const file = new File(['data'], 'cover.bmp', { type: 'image/bmp' })
    expect(() => validateImageFile(file)).toThrowError('Unsupported image format')
  })
})

describe('getImageDimensions', () => {
  it('returns natural dimensions for HTMLImageElement', () => {
    const image = document.createElement('img')
    Object.defineProperty(image, 'naturalWidth', { value: 500 })
    Object.defineProperty(image, 'naturalHeight', { value: 250 })
    Object.defineProperty(image, 'width', { value: 400, writable: true })
    Object.defineProperty(image, 'height', { value: 200, writable: true })

    expect(getImageDimensions(image)).toEqual({ width: 500, height: 250 })
  })

  it('returns explicit dimensions for ImageBitmap-like objects', () => {
    const image = { width: 800, height: 600 } as ImageBitmap
    expect(getImageDimensions(image)).toEqual({ width: 800, height: 600 })
  })
})
