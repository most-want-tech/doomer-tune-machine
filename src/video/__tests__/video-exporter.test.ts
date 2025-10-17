import { beforeEach, describe, expect, it, vi } from 'vitest'

class StubAudioBuffer {
  length: number
  sampleRate: number
  numberOfChannels: number
  private readonly channels: Float32Array[]

  constructor(options: { length: number; sampleRate: number; numberOfChannels: number }) {
    this.length = options.length
    this.sampleRate = options.sampleRate
    this.numberOfChannels = options.numberOfChannels
    this.channels = Array.from({ length: options.numberOfChannels }, () => new Float32Array(options.length))
  }

  getChannelData(channel: number) {
    return this.channels[channel]
  }

  copyToChannel(source: Float32Array, channel: number, offset = 0) {
    this.channels[channel].set(source, offset)
  }
}

const mockAudioBuffer = (length: number, sampleRate: number, channels: number) =>
  new StubAudioBuffer({ length, sampleRate, numberOfChannels: channels }) as unknown as AudioBuffer

const fakeImage = { width: 800, height: 600 }

vi.mock('@/audio/offline-renderer', () => ({
  renderOfflineAudioBuffer: vi.fn().mockResolvedValue(mockAudioBuffer(48_000, 48_000, 2)),
}))

const releaseImageMock = vi.fn()

vi.mock('../image-utils', () => ({
  loadImageFromFile: vi.fn().mockResolvedValue(fakeImage),
  releaseImage: releaseImageMock,
  getImageDimensions: (image: { width: number; height: number }) => ({
    width: image.width,
    height: image.height,
  }),
  isSupportedImageType: vi.fn(),
  validateImageFile: vi.fn(),
}))

vi.mock('../codec-support', () => ({
  getBestSupportedAudioCodec: vi.fn().mockResolvedValue({ codec: 'aac', name: 'AAC-LC' }),
  getBestSupportedVideoCodec: vi.fn().mockResolvedValue({ codec: 'avc', name: 'H.264 Baseline' }),
  isAudioCodecSupported: vi.fn(),
  isVideoCodecSupported: vi.fn(),
}))

vi.mock('mediabunny', () => {
  class FakeBufferTarget {
    buffer: ArrayBuffer | null = null
  }

  class FakeMp4OutputFormat {
    getSupportedTrackCounts() {
      return {
        video: { min: 0, max: 1 },
        audio: { min: 0, max: 1 },
        subtitle: { min: 0, max: 0 },
        total: { min: 1, max: 2 },
      }
    }
    getSupportedVideoCodecs() {
      return ['avc']
    }
    getSupportedAudioCodecs() {
      return ['aac']
    }
    getSupportedSubtitleCodecs() {
      return []
    }
    get supportsVideoRotationMetadata() {
      return false
    }
  }

  class FakeOutput {
    format: FakeMp4OutputFormat
    target: FakeBufferTarget
    constructor({ format, target }: { format: FakeMp4OutputFormat; target: FakeBufferTarget }) {
      this.format = format
      this.target = target
    }
    addAudioTrack() {}
    addVideoTrack() {}
    async start() {}
    async finalize() {
      this.target.buffer = new ArrayBuffer(8)
    }
    async cancel() {}
    async getMimeType() {
      return 'video/mp4'
    }
  }

  class FakeCanvasSource {
    frames: number[] = []
    constructor(_canvas: unknown, _config: unknown) {}
    async add(time: number) {
      this.frames.push(time)
    }
    close() {}
  }

  class FakeAudioBufferSource {
    added: AudioBuffer[] = []
    constructor(_config: unknown) {}
    async add(buffer: AudioBuffer) {
      this.added.push(buffer)
    }
    close() {}
  }

  return {
    BufferTarget: FakeBufferTarget,
    Mp4OutputFormat: FakeMp4OutputFormat,
    Output: FakeOutput,
    CanvasSource: FakeCanvasSource,
    AudioBufferSource: FakeAudioBufferSource,
  }
})

class FakeCanvasContext {
  fillStyle = ''
  imageSmoothingEnabled = false
  save() {}
  restore() {}
  fillRect() {}
  drawImage() {}
}

class FakeOffscreenCanvas {
  width: number
  height: number
  private readonly ctx = new FakeCanvasContext()
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }
  getContext(type: string) {
    if (type === '2d') {
      return this.ctx
    }
    return null
  }
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  vi.stubGlobal('AudioBuffer', StubAudioBuffer as unknown as typeof AudioBuffer)
})

describe('exportVideo', () => {
  it('throws when WebCodecs is not supported', async () => {
    vi.stubGlobal('VideoEncoder', undefined as unknown as typeof VideoEncoder)
    vi.stubGlobal('AudioEncoder', undefined as unknown as typeof AudioEncoder)

    const { exportVideo } = await import('../video-exporter')

    await expect(
      exportVideo({
        audioBuffer: {} as AudioBuffer,
        effects: {} as any,
        imageFile: new File(['data'], 'cover.jpg', { type: 'image/jpeg' }),
        orientation: 'landscape',
      }),
    ).rejects.toThrowError('WebCodecs API is not available')
  })

  it('returns a blob when encoding succeeds', async () => {
    vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas as unknown as typeof OffscreenCanvas)
    class DummyVideoEncoder {}
    class DummyAudioEncoder {}
    vi.stubGlobal('VideoEncoder', DummyVideoEncoder as unknown as typeof VideoEncoder)
    vi.stubGlobal('AudioEncoder', DummyAudioEncoder as unknown as typeof AudioEncoder)

    const { exportVideo } = await import('../video-exporter')

    const progressSpy = vi.fn()

    const result = await exportVideo({
      audioBuffer: {} as AudioBuffer,
      effects: {} as any,
      imageFile: new File(['data'], 'cover.jpg', { type: 'image/jpeg' }),
      orientation: 'portrait',
      onProgress: progressSpy,
    })

    expect(result.blob).toBeInstanceOf(Blob)
  expect(result.width).toBe(180)
  expect(result.height).toBe(320)
    expect(result.frameRate).toBeGreaterThan(0)
    const lastProgress = progressSpy.mock.calls.at(-1)?.[0]
    expect(lastProgress).toMatchObject({ percent: 1, stage: 'finalizing' })
    expect(releaseImageMock).toHaveBeenCalled()
    expect(result.mimeType).toBe('video/mp4')
  })
})
