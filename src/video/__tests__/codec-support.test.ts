import { describe, expect, it, vi } from 'vitest'

import {
  getBestSupportedAudioCodec,
  getBestSupportedVideoCodec,
  isAudioCodecSupported,
  isVideoCodecSupported,
} from '../codec-support'

describe('codec-support', () => {
  describe('isAudioCodecSupported', () => {
    it('returns false when AudioEncoder is undefined', async () => {
      vi.stubGlobal('AudioEncoder', undefined)

      const result = await isAudioCodecSupported({
        codec: 'opus',
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 128000,
      })

      expect(result).toBe(false)
    })

    it('returns true when codec is supported', async () => {
      const mockAudioEncoder = {
        isConfigSupported: vi.fn().mockResolvedValue({ supported: true }),
      }
      vi.stubGlobal('AudioEncoder', mockAudioEncoder)

      const result = await isAudioCodecSupported({
        codec: 'opus',
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 128000,
      })

      expect(result).toBe(true)
      expect(mockAudioEncoder.isConfigSupported).toHaveBeenCalledWith({
        codec: 'opus',
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 128000,
      })
    })

    it('returns false when codec is not supported', async () => {
      const mockAudioEncoder = {
        isConfigSupported: vi.fn().mockResolvedValue({ supported: false }),
      }
      vi.stubGlobal('AudioEncoder', mockAudioEncoder)

      const result = await isAudioCodecSupported({
        codec: 'mp4a.40.2',
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 128000,
      })

      expect(result).toBe(false)
    })

    it('returns false when isConfigSupported throws', async () => {
      const mockAudioEncoder = {
        isConfigSupported: vi.fn().mockRejectedValue(new Error('Codec check failed')),
      }
      vi.stubGlobal('AudioEncoder', mockAudioEncoder)

      const result = await isAudioCodecSupported({
        codec: 'invalid-codec',
        sampleRate: 48000,
        numberOfChannels: 2,
        bitrate: 128000,
      })

      expect(result).toBe(false)
    })
  })

  describe('isVideoCodecSupported', () => {
    it('returns false when VideoEncoder is undefined', async () => {
      vi.stubGlobal('VideoEncoder', undefined)

      const result = await isVideoCodecSupported({
        codec: 'vp8',
        width: 1920,
        height: 1080,
        bitrate: 1200000,
        framerate: 30,
      })

      expect(result).toBe(false)
    })

    it('returns true when codec is supported', async () => {
      const mockVideoEncoder = {
        isConfigSupported: vi.fn().mockResolvedValue({ supported: true }),
      }
      vi.stubGlobal('VideoEncoder', mockVideoEncoder)

      const result = await isVideoCodecSupported({
        codec: 'vp8',
        width: 1920,
        height: 1080,
        bitrate: 1200000,
        framerate: 30,
      })

      expect(result).toBe(true)
      expect(mockVideoEncoder.isConfigSupported).toHaveBeenCalledWith({
        codec: 'vp8',
        width: 1920,
        height: 1080,
        bitrate: 1200000,
        framerate: 30,
      })
    })

    it('returns false when codec is not supported', async () => {
      const mockVideoEncoder = {
        isConfigSupported: vi.fn().mockResolvedValue({ supported: false }),
      }
      vi.stubGlobal('VideoEncoder', mockVideoEncoder)

      const result = await isVideoCodecSupported({
        codec: 'avc1.42E01E',
        width: 1920,
        height: 1080,
        bitrate: 1200000,
        framerate: 30,
      })

      expect(result).toBe(false)
    })

    it('returns false when isConfigSupported throws', async () => {
      const mockVideoEncoder = {
        isConfigSupported: vi.fn().mockRejectedValue(new Error('Codec check failed')),
      }
      vi.stubGlobal('VideoEncoder', mockVideoEncoder)

      const result = await isVideoCodecSupported({
        codec: 'invalid-codec',
        width: 1920,
        height: 1080,
        bitrate: 1200000,
        framerate: 30,
      })

      expect(result).toBe(false)
    })
  })

  describe('getBestSupportedAudioCodec', () => {
    it('returns AAC when supported', async () => {
      const mockAudioEncoder = {
        isConfigSupported: vi.fn().mockResolvedValue({ supported: true }),
      }
      vi.stubGlobal('AudioEncoder', mockAudioEncoder)

      const result = await getBestSupportedAudioCodec(48000, 2, 128000)

      expect(result).toEqual({ codec: 'aac', name: 'AAC-LC' })
    })

    it('returns Opus when AAC is not supported but Opus is', async () => {
      const mockAudioEncoder = {
        isConfigSupported: vi
          .fn()
          .mockResolvedValueOnce({ supported: false }) // AAC not supported
          .mockResolvedValueOnce({ supported: true }), // Opus supported
      }
      vi.stubGlobal('AudioEncoder', mockAudioEncoder)

      const result = await getBestSupportedAudioCodec(48000, 2, 128000)

      expect(result).toEqual({ codec: 'opus', name: 'Opus' })
    })

    it('returns Vorbis as fallback', async () => {
      const mockAudioEncoder = {
        isConfigSupported: vi
          .fn()
          .mockResolvedValueOnce({ supported: false }) // AAC not supported
          .mockResolvedValueOnce({ supported: false }) // Opus not supported
          .mockResolvedValueOnce({ supported: true }), // Vorbis supported
      }
      vi.stubGlobal('AudioEncoder', mockAudioEncoder)

      const result = await getBestSupportedAudioCodec(48000, 2, 128000)

      expect(result).toEqual({ codec: 'vorbis', name: 'Vorbis' })
    })

    it('returns null when no codecs are supported', async () => {
      const mockAudioEncoder = {
        isConfigSupported: vi.fn().mockResolvedValue({ supported: false }),
      }
      vi.stubGlobal('AudioEncoder', mockAudioEncoder)

      const result = await getBestSupportedAudioCodec(48000, 2, 128000)

      expect(result).toBeNull()
    })
  })

  describe('getBestSupportedVideoCodec', () => {
    it('returns H.264 when supported', async () => {
      const mockVideoEncoder = {
        isConfigSupported: vi.fn().mockResolvedValue({ supported: true }),
      }
      vi.stubGlobal('VideoEncoder', mockVideoEncoder)

      const result = await getBestSupportedVideoCodec(1920, 1080, 1200000, 30)

      expect(result).toEqual({ codec: 'avc', name: 'H.264 Baseline' })
    })

    it('returns VP9 when H.264 is not supported but VP9 is', async () => {
      const mockVideoEncoder = {
        isConfigSupported: vi
          .fn()
          .mockResolvedValueOnce({ supported: false }) // H.264 not supported
          .mockResolvedValueOnce({ supported: true }), // VP9 supported
      }
      vi.stubGlobal('VideoEncoder', mockVideoEncoder)

      const result = await getBestSupportedVideoCodec(1920, 1080, 1200000, 30)

      expect(result).toEqual({ codec: 'vp9', name: 'VP9' })
    })

    it('returns VP8 as fallback', async () => {
      const mockVideoEncoder = {
        isConfigSupported: vi
          .fn()
          .mockResolvedValueOnce({ supported: false }) // H.264 not supported
          .mockResolvedValueOnce({ supported: false }) // VP9 not supported
          .mockResolvedValueOnce({ supported: true }), // VP8 supported
      }
      vi.stubGlobal('VideoEncoder', mockVideoEncoder)

      const result = await getBestSupportedVideoCodec(1920, 1080, 1200000, 30)

      expect(result).toEqual({ codec: 'vp8', name: 'VP8' })
    })

    it('returns null when no codecs are supported', async () => {
      const mockVideoEncoder = {
        isConfigSupported: vi.fn().mockResolvedValue({ supported: false }),
      }
      vi.stubGlobal('VideoEncoder', mockVideoEncoder)

      const result = await getBestSupportedVideoCodec(1920, 1080, 1200000, 30)

      expect(result).toBeNull()
    })
  })
})
