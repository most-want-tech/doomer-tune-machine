/**
 * YouTube link processing utilities using Invidious API
 * Invidious is an open-source YouTube frontend with a free API
 */

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.fdn.fr',
  'https://iv.ggtyler.dev',
  'https://invidious.privacyredirect.com',
]

interface InvidiousVideoInfo {
  title: string
  adaptiveFormats: Array<{
    url: string
    type: string
    bitrate: number
    audioQuality?: string
  }>
}

export interface YouTubeVideoInfo {
  title: string
  audioUrl: string
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  // If it's just the video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }

  return null
}

/**
 * Validate YouTube URL format
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null
}

/**
 * Fetch video info from Invidious instance
 */
async function fetchFromInstance(
  instanceUrl: string,
  videoId: string,
): Promise<InvidiousVideoInfo> {
  const response = await fetch(`${instanceUrl}/api/v1/videos/${videoId}`)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get video info from YouTube via Invidious API
 * Tries multiple instances for reliability
 */
export async function getYouTubeVideoInfo(
  videoId: string,
): Promise<YouTubeVideoInfo> {
  let lastError: Error | null = null

  // Try each instance until one works
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const data = await fetchFromInstance(instance, videoId)

      // Find best audio format (prefer medium quality audio)
      const audioFormat = data.adaptiveFormats
        .filter(f => f.type.includes('audio'))
        .sort((a, b) => {
          // Prefer formats with audioQuality set
          if (a.audioQuality && !b.audioQuality) return -1
          if (!a.audioQuality && b.audioQuality) return 1
          // Otherwise prefer higher bitrate
          return (b.bitrate || 0) - (a.bitrate || 0)
        })[0]

      if (!audioFormat) {
        throw new Error('No audio format found')
      }

      return {
        title: data.title,
        audioUrl: audioFormat.url,
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${instance}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }

  // All instances failed
  throw new Error(
    `Failed to fetch video info from all Invidious instances. Last error: ${lastError?.message || 'Unknown error'}`,
  )
}

/**
 * Download audio from YouTube and convert to AudioBuffer
 */
export async function downloadYouTubeAudio(
  url: string,
  onProgress?: (progress: number) => void,
): Promise<{ buffer: ArrayBuffer; title: string }> {
  const videoId = extractVideoId(url)
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  // Get video info
  const videoInfo = await getYouTubeVideoInfo(videoId)

  // Download audio
  const response = await fetch(videoInfo.audioUrl)
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`)
  }

  // Handle progress if callback provided
  if (onProgress && response.body) {
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let receivedLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      receivedLength += value.length

      if (total > 0) {
        onProgress((receivedLength / total) * 100)
      }
    }

    // Concatenate chunks
    const allChunks = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }

    return {
      buffer: allChunks.buffer,
      title: videoInfo.title,
    }
  }

  // No progress tracking
  const buffer = await response.arrayBuffer()
  return {
    buffer,
    title: videoInfo.title,
  }
}
