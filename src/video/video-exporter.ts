import { AudioBufferSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output } from 'mediabunny'

import type { AudioEffects } from '@/audio/audio-effects'
import { renderOfflineAudioBuffer } from '@/audio/offline-renderer'

import type { LoadedImage } from './image-utils'
import { getImageDimensions, loadImageFromFile, releaseImage } from './image-utils'
import { calculateContainRect, getVideoDimensions, type VideoOrientation } from './video-layout'

const DEFAULT_FRAME_RATE = 30
const AUDIO_SAMPLE_RATE = 48_000
const AUDIO_BITRATE = 128_000
const VIDEO_BITRATE = 1_200_000
const AUDIO_CHUNK_SECONDS = 1
const PROGRESS_AUDIO_WEIGHT = 0.45
const PROGRESS_VIDEO_WEIGHT = 0.55

const ensureWebCodecsSupport = () => {
  if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') {
    throw new Error('WebCodecs API is not available in this browser. Video export is unsupported.')
  }
}

const createCanvas = (width: number, height: number): OffscreenCanvas | HTMLCanvasElement => {
  if (typeof OffscreenCanvas === 'function') {
    return new OffscreenCanvas(width, height)
  }

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  throw new Error('Canvas API is unavailable in this environment.')
}

const drawCenteredImage = (
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  image: LoadedImage,
  targetWidth: number,
  targetHeight: number,
) => {
  context.save()
  context.fillStyle = '#000000'
  context.fillRect(0, 0, targetWidth, targetHeight)

  const { width: sourceWidth, height: sourceHeight } = getImageDimensions(image)
  const rect = calculateContainRect(sourceWidth, sourceHeight, targetWidth, targetHeight)
  context.imageSmoothingEnabled = true
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height)
  context.restore()
}

export interface VideoExportOptions {
  audioBuffer: AudioBuffer
  effects: AudioEffects
  imageFile: File
  orientation: VideoOrientation
  frameRate?: number
  onProgress?: (progress: VideoExportProgress) => void
}

export interface VideoExportResult {
  blob: Blob
  duration: number
  width: number
  height: number
  frameRate: number
  mimeType: string
}

export type VideoExportStage =
  | 'initializing'
  | 'processing-audio'
  | 'encoding-audio'
  | 'encoding-video'
  | 'finalizing'

export interface VideoExportProgress {
  percent: number
  stage: VideoExportStage
  detail?: string
  framesEncoded?: number
  totalFrames?: number
}

export const exportVideo = async ({
  audioBuffer,
  effects,
  imageFile,
  orientation,
  frameRate = DEFAULT_FRAME_RATE,
  onProgress,
}: VideoExportOptions): Promise<VideoExportResult> => {
  ensureWebCodecsSupport()

  onProgress?.({
    percent: 0,
    stage: 'processing-audio',
    detail: 'Rendering audio effects',
  })

  const renderedBuffer = await renderOfflineAudioBuffer(audioBuffer, effects, {
    sampleRate: AUDIO_SAMPLE_RATE,
  })

  const durationSeconds = renderedBuffer.length / renderedBuffer.sampleRate
  const frameCount = Math.max(1, Math.ceil(durationSeconds * frameRate))
  const { width, height } = getVideoDimensions(orientation)

  const image = await loadImageFromFile(imageFile)

  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null
  if (!context) {
    releaseImage(image)
    throw new Error('Unable to acquire a 2D canvas context for video export.')
  }

  drawCenteredImage(context, image, width, height)

  let audioProgress = 0
  let videoProgress = 0

  const updateProgress = (stage: VideoExportStage, detail?: string, framesEncoded?: number) => {
    const combined = audioProgress * PROGRESS_AUDIO_WEIGHT + videoProgress * PROGRESS_VIDEO_WEIGHT
    onProgress?.({
      percent: Math.min(1, combined),
      stage,
      detail,
      framesEncoded,
      totalFrames: frameCount,
    })
  }

  const target = new BufferTarget()
  const output = new Output({
    format: new Mp4OutputFormat(),
    target,
  })

  const audioSource = new AudioBufferSource({
    codec: 'aac',
    bitrate: AUDIO_BITRATE,
  })

  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: VIDEO_BITRATE,
  })

  output.addAudioTrack(audioSource)
  output.addVideoTrack(videoSource, { frameRate })

  try {
    await output.start()

    const totalFrames = renderedBuffer.length
    const channels = renderedBuffer.numberOfChannels
    const sampleRate = renderedBuffer.sampleRate
    const framesPerChunk = Math.max(1, Math.floor(sampleRate * AUDIO_CHUNK_SECONDS))

    updateProgress('encoding-audio', 'Encoding audio track')

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += framesPerChunk) {
      const framesThisChunk = Math.min(framesPerChunk, totalFrames - frameIndex)
      const chunk = new AudioBuffer({
        length: framesThisChunk,
        numberOfChannels: channels,
        sampleRate,
      })

      for (let channel = 0; channel < channels; channel++) {
        const sourceData = renderedBuffer.getChannelData(channel).subarray(frameIndex, frameIndex + framesThisChunk)
        chunk.copyToChannel(sourceData, channel, 0)
      }

      await audioSource.add(chunk)
      audioProgress = (frameIndex + framesThisChunk) / totalFrames
      updateProgress('encoding-audio', `Encoding audio ${(audioProgress * 100).toFixed(0)}%`)
    }

    audioProgress = 1
    updateProgress('encoding-audio', 'Audio encoding complete')

    updateProgress('encoding-video', 'Encoding video frames', 0)

    const frameDuration = 1 / frameRate
    for (let index = 0; index < frameCount; index++) {
      await videoSource.add(index * frameDuration, frameDuration)
      const encodedFrames = index + 1
      videoProgress = encodedFrames / frameCount
      updateProgress('encoding-video', `Encoding frame ${encodedFrames} of ${frameCount}`, encodedFrames)
    }

    videoProgress = 1

    updateProgress('finalizing', 'Finalizing video file')

    await output.finalize()

    const mimeType = await output.getMimeType().catch(() => 'video/mp4')
    const buffer = target.buffer
    if (!buffer) {
      throw new Error('Failed to finalize video export')
    }

    const blob = new Blob([buffer], { type: mimeType || 'video/mp4' })

    onProgress?.({
      percent: 1,
      stage: 'finalizing',
      detail: 'Video export complete',
      framesEncoded: frameCount,
      totalFrames: frameCount,
    })

    return {
      blob,
      duration: durationSeconds,
      width,
      height,
      frameRate,
      mimeType: mimeType || 'video/mp4',
    }
  } catch (error) {
    await output.cancel().catch(() => {
      /* noop */
    })
    throw error
  } finally {
    try {
      audioSource.close()
    } catch (_error) {
      /* noop */
    }
    try {
      videoSource.close()
    } catch (_error) {
      /* noop */
    }
    releaseImage(image)
  }
}
