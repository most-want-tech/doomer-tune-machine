import { describe, it, expect } from 'vitest'
import {
  validateAudioFile,
  getSupportedMimeTypes,
  getSupportedExtensions,
  getSupportedFormatsDescription,
  getAcceptAttribute,
  MAX_FILE_SIZE,
  SUPPORTED_AUDIO_FORMATS,
} from '../utils'

describe('Audio File Validation Utils', () => {
  describe('getSupportedMimeTypes', () => {
    it('should return all supported MIME types', () => {
      const mimeTypes = getSupportedMimeTypes()
      expect(mimeTypes).toContain('audio/mpeg')
      expect(mimeTypes).toContain('audio/wav')
      expect(mimeTypes).toContain('audio/ogg')
      expect(mimeTypes).toContain('audio/mp4')
      expect(mimeTypes).toContain('audio/flac')
      expect(mimeTypes).toContain('audio/webm')
    })

    it('should not contain duplicates', () => {
      const mimeTypes = getSupportedMimeTypes()
      const uniqueMimeTypes = [...new Set(mimeTypes)]
      expect(mimeTypes).toHaveLength(uniqueMimeTypes.length)
    })
  })

  describe('getSupportedExtensions', () => {
    it('should return all supported file extensions', () => {
      const extensions = getSupportedExtensions()
      expect(extensions).toContain('.mp3')
      expect(extensions).toContain('.wav')
      expect(extensions).toContain('.ogg')
      expect(extensions).toContain('.m4a')
      expect(extensions).toContain('.flac')
      expect(extensions).toContain('.webm')
    })

    it('should include dot prefix for all extensions', () => {
      const extensions = getSupportedExtensions()
      extensions.forEach(ext => {
        expect(ext.startsWith('.')).toBe(true)
      })
    })
  })

  describe('getSupportedFormatsDescription', () => {
    it('should return a comma-separated list of format descriptions', () => {
      const description = getSupportedFormatsDescription()
      expect(description).toContain('MP3')
      expect(description).toContain('WAV')
      expect(description).toContain('OGG')
      expect(description).toContain(',')
    })
  })

  describe('getAcceptAttribute', () => {
    it('should return a string suitable for file input accept attribute', () => {
      const acceptAttr = getAcceptAttribute()
      expect(acceptAttr).toContain('audio/mpeg')
      expect(acceptAttr).toContain('.mp3')
      expect(acceptAttr).toContain(',')
    })

    it('should include both MIME types and extensions', () => {
      const acceptAttr = getAcceptAttribute()
      const parts = acceptAttr.split(',')
      const hasMimeTypes = parts.some(p => p.startsWith('audio/'))
      const hasExtensions = parts.some(p => p.startsWith('.'))
      expect(hasMimeTypes).toBe(true)
      expect(hasExtensions).toBe(true)
    })
  })

  describe('validateAudioFile', () => {
    describe('valid files', () => {
      it('should accept MP3 files with correct MIME type', () => {
        const file = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should accept WAV files with correct MIME type', () => {
        const file = new File(['content'], 'test.wav', { type: 'audio/wav' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
      })

      it('should accept OGG files with correct MIME type', () => {
        const file = new File(['content'], 'test.ogg', { type: 'audio/ogg' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
      })

      it('should accept M4A files with correct MIME type', () => {
        const file = new File(['content'], 'test.m4a', { type: 'audio/mp4' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
      })

      it('should accept FLAC files with correct MIME type', () => {
        const file = new File(['content'], 'test.flac', { type: 'audio/flac' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
      })
    })

    describe('MIME type fallback scenarios', () => {
      it('should accept file with valid extension but no MIME type', () => {
        // Simulates OS that doesn't set MIME types (common on some Linux systems)
        const file = new File(['content'], 'test.mp3', { type: '' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
        expect(result.warning).toBeDefined()
        expect(result.warning).toContain('extension')
      })

      it('should accept file with valid extension but unknown MIME type', () => {
        // Simulates OS that sets unusual MIME type
        const file = new File(['content'], 'test.mp3', { type: 'application/octet-stream' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
        expect(result.warning).toBeDefined()
        expect(result.warning).toContain('Unknown MIME type')
      })

      it('should accept various MIME type variations for MP3', () => {
        const mimeTypes = ['audio/mpeg', 'audio/mp3']
        mimeTypes.forEach(mimeType => {
          const file = new File(['content'], 'test.mp3', { type: mimeType })
          const result = validateAudioFile(file)
          expect(result.isValid).toBe(true)
        })
      })

      it('should accept various MIME type variations for WAV', () => {
        const mimeTypes = ['audio/wav', 'audio/wave', 'audio/x-wav']
        mimeTypes.forEach(mimeType => {
          const file = new File(['content'], 'test.wav', { type: mimeType })
          const result = validateAudioFile(file)
          expect(result.isValid).toBe(true)
        })
      })
    })

    describe('invalid files', () => {
      it('should reject empty files', () => {
        const file = new File([], 'test.mp3', { type: 'audio/mpeg' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('empty')
      })

      it('should reject files larger than MAX_FILE_SIZE', () => {
        // Create a file with size property set to exceed MAX_FILE_SIZE
        // without actually allocating the memory
        const largeFile = new File(['small content'], 'large.mp3', { type: 'audio/mpeg' })
        // Override the size property for testing
        Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1000 })
        const result = validateAudioFile(largeFile)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('too large')
      })

      it('should reject non-audio file types', () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })

      it('should reject unsupported audio formats', () => {
        const file = new File(['content'], 'test.mid', { type: 'audio/midi' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Supported formats')
      })

      it('should reject files with no extension and no MIME type', () => {
        const file = new File(['content'], 'test', { type: '' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(false)
      })

      it('should reject image files', () => {
        const file = new File(['content'], 'test.png', { type: 'image/png' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(false)
      })

      it('should reject video files', () => {
        // Use .avi since .mp4 is also used for M4A audio files
        const file = new File(['content'], 'test.avi', { type: 'video/x-msvideo' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle uppercase extensions', () => {
        const file = new File(['content'], 'TEST.MP3', { type: '' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
      })

      it('should handle mixed case extensions', () => {
        const file = new File(['content'], 'test.Mp3', { type: '' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
      })

      it('should handle filenames with multiple dots', () => {
        const file = new File(['content'], 'my.song.name.mp3', { type: 'audio/mpeg' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
      })

      it('should handle alternative OGG extensions', () => {
        const file = new File(['content'], 'test.oga', { type: 'audio/ogg' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
      })
    })

    describe('real-world scenarios', () => {
      it('should handle Linux system without MIME type', () => {
        // Common scenario on Linux where file.type is empty
        const file = new File(['valid audio content'], 'song.mp3', { type: '' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
        expect(result.warning).toBeDefined()
      })

      it('should handle Windows generic MIME type', () => {
        // Windows sometimes uses generic MIME type
        const file = new File(['content'], 'song.mp3', { type: 'application/octet-stream' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(true)
        expect(result.warning).toBeDefined()
      })

      it('should provide helpful error messages', () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' })
        const result = validateAudioFile(file)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('MP3')
        expect(result.error).toContain('WAV')
        expect(result.error).toContain('OGG')
      })
    })
  })

  describe('SUPPORTED_AUDIO_FORMATS structure', () => {
    it('should have consistent structure for all formats', () => {
      Object.entries(SUPPORTED_AUDIO_FORMATS).forEach(([key, format]) => {
        expect(format).toHaveProperty('mimeTypes')
        expect(format).toHaveProperty('extensions')
        expect(format).toHaveProperty('description')
        expect(Array.isArray(format.mimeTypes)).toBe(true)
        expect(Array.isArray(format.extensions)).toBe(true)
        expect(typeof format.description).toBe('string')
      })
    })

    it('should have at least one MIME type per format', () => {
      Object.values(SUPPORTED_AUDIO_FORMATS).forEach(format => {
        expect(format.mimeTypes.length).toBeGreaterThan(0)
      })
    })

    it('should have at least one extension per format', () => {
      Object.values(SUPPORTED_AUDIO_FORMATS).forEach(format => {
        expect(format.extensions.length).toBeGreaterThan(0)
      })
    })
  })
})
