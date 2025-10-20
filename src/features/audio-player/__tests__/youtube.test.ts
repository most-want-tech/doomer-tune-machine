import { describe, it, expect } from 'vitest'
import { extractVideoId, isValidYouTubeUrl } from '../utils/youtube'

describe('YouTube URL utilities', () => {
  describe('extractVideoId', () => {
    it('should extract ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from youtu.be short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ'
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from /v/ URL', () => {
      const url = 'https://www.youtube.com/v/dQw4w9WgXcQ'
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
    })

    it('should handle URL with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s'
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
    })

    it('should accept just the video ID', () => {
      const url = 'dQw4w9WgXcQ'
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
    })

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/not-a-youtube-video'
      expect(extractVideoId(url)).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(extractVideoId('')).toBeNull()
    })

    it('should return null for invalid video ID format', () => {
      expect(extractVideoId('short')).toBeNull()
      expect(extractVideoId('way-too-long-id')).toBeNull()
    })
  })

  describe('isValidYouTubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
      expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
      expect(isValidYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true)
      expect(isValidYouTubeUrl('dQw4w9WgXcQ')).toBe(true)
    })

    it('should return false for invalid URLs', () => {
      expect(isValidYouTubeUrl('')).toBe(false)
      expect(isValidYouTubeUrl('https://example.com')).toBe(false)
      expect(isValidYouTubeUrl('not-a-url')).toBe(false)
      expect(isValidYouTubeUrl('short')).toBe(false)
    })
  })
})
