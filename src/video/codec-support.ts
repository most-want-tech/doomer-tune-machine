/**
 * Codec support detection utilities for WebCodecs API
 * Helps determine which audio/video codecs are available in the current browser
 */

export interface AudioCodecConfig {
  codec: string
  sampleRate: number
  numberOfChannels: number
  bitrate: number
}

export interface VideoCodecConfig {
  codec: string
  width: number
  height: number
  bitrate: number
  framerate: number
}

/**
 * Test if a specific audio codec configuration is supported
 */
export const isAudioCodecSupported = async (config: AudioCodecConfig): Promise<boolean> => {
  if (typeof AudioEncoder === 'undefined') {
    return false
  }

  try {
    const result = await AudioEncoder.isConfigSupported({
      codec: config.codec,
      sampleRate: config.sampleRate,
      numberOfChannels: config.numberOfChannels,
      bitrate: config.bitrate,
    })
    return result.supported ?? false
  } catch {
    return false
  }
}

/**
 * Test if a specific video codec configuration is supported
 */
export const isVideoCodecSupported = async (config: VideoCodecConfig): Promise<boolean> => {
  if (typeof VideoEncoder === 'undefined') {
    return false
  }

  try {
    const result = await VideoEncoder.isConfigSupported({
      codec: config.codec,
      width: config.width,
      height: config.height,
      bitrate: config.bitrate,
      framerate: config.framerate,
    })
    return result.supported ?? false
  } catch {
    return false
  }
}

/**
 * Codec identifier mapping for mediabunny library
 */
type MediaBunnyAudioCodec = 'aac' | 'opus' | 'mp3' | 'vorbis' | 'flac'
type MediaBunnyVideoCodec = 'avc' | 'vp8' | 'vp9' | 'hevc' | 'av1'

interface CodecTestConfig {
  fullCodec: string // Full WebCodecs identifier (e.g., 'mp4a.40.2', 'avc1.42E01E')
  shortCodec: string // Mediabunny library identifier (e.g., 'aac', 'avc')
  name: string // Human-readable name
}

/**
 * Get the best supported audio codec from a list of preferences
 * Returns the codec string and a human-readable name
 */
export const getBestSupportedAudioCodec = async (
  sampleRate: number,
  channels: number,
  bitrate: number,
): Promise<{ codec: MediaBunnyAudioCodec; name: string } | null> => {
  // Prioritize codecs: AAC (best quality/compatibility) > Opus (open-source, widely supported) > Vorbis (fallback)
  const codecPreferences: CodecTestConfig[] = [
    { fullCodec: 'mp4a.40.2', shortCodec: 'aac', name: 'AAC-LC' }, // AAC Low Complexity
    { fullCodec: 'opus', shortCodec: 'opus', name: 'Opus' },
    { fullCodec: 'vorbis', shortCodec: 'vorbis', name: 'Vorbis' },
  ]

  for (const { fullCodec, shortCodec, name } of codecPreferences) {
    const supported = await isAudioCodecSupported({
      codec: fullCodec,
      sampleRate,
      numberOfChannels: channels,
      bitrate,
    })

    if (supported) {
      return { codec: shortCodec as MediaBunnyAudioCodec, name }
    }
  }

  return null
}

/**
 * Get the best supported video codec from a list of preferences
 * Returns the codec string and a human-readable name
 */
export const getBestSupportedVideoCodec = async (
  width: number,
  height: number,
  bitrate: number,
  framerate: number,
): Promise<{ codec: MediaBunnyVideoCodec; name: string } | null> => {
  // Prioritize codecs: H.264 (best compatibility) > VP9 (good quality) > VP8 (fallback)
  const codecPreferences: CodecTestConfig[] = [
    { fullCodec: 'avc1.42E01E', shortCodec: 'avc', name: 'H.264 Baseline' }, // H.264 Baseline Profile Level 3.0
    { fullCodec: 'vp09.00.10.08', shortCodec: 'vp9', name: 'VP9' }, // VP9 Profile 0
    { fullCodec: 'vp8', shortCodec: 'vp8', name: 'VP8' },
  ]

  for (const { fullCodec, shortCodec, name } of codecPreferences) {
    const supported = await isVideoCodecSupported({
      codec: fullCodec,
      width,
      height,
      bitrate,
      framerate,
    })

    if (supported) {
      return { codec: shortCodec as MediaBunnyVideoCodec, name }
    }
  }

  return null
}
