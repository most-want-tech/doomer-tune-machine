const DEFAULT_NOISE_SECONDS = 2

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const distortionCurveCache = new WeakMap<BaseAudioContext, Map<number, Float32Array>>()

const generateDistortionCurve = (sampleRate: number, drive: number) => {
  const sampleCount = Math.max(2048, Math.floor(sampleRate))
  const curve = new Float32Array(sampleCount)
  const intensity = 1 + drive * 24 // Higher drive increases saturation

  for (let i = 0; i < sampleCount; i++) {
    const x = (i * 2) / sampleCount - 1
    const saturated = Math.tanh(intensity * x)
    curve[i] = (1 - drive) * x + drive * saturated
  }

  return curve
}

export const getDistortionCurve = (context: BaseAudioContext, amount: number) => {
  const normalizedAmount = clamp(Math.round(amount), 0, 100)
  let cache = distortionCurveCache.get(context)
  if (!cache) {
    cache = new Map()
    distortionCurveCache.set(context, cache)
  }

  const existing = cache.get(normalizedAmount)
  if (existing) {
    return existing
  }

  const drive = normalizedAmount / 100
  const curve = generateDistortionCurve(context.sampleRate, drive)
  cache.set(normalizedAmount, curve)
  return curve
}

export const createReverbImpulse = (
  context: BaseAudioContext,
  duration: number,
  decay: number,
): AudioBuffer => {
  const sampleRate = context.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * Math.max(duration, 0.01)))
  const impulse = context.createBuffer(2, length, sampleRate)
  const impulseL = impulse.getChannelData(0)
  const impulseR = impulse.getChannelData(1)

  for (let i = 0; i < length; i++) {
    const n = i / length
    const envelope = Math.pow(1 - n, Math.max(decay, 0.01))
    impulseL[i] = (Math.random() * 2 - 1) * envelope
    impulseR[i] = (Math.random() * 2 - 1) * envelope
  }

  return impulse
}

export const createNoiseBuffer = (
  context: BaseAudioContext,
  seconds = DEFAULT_NOISE_SECONDS,
): AudioBuffer => {
  const sampleRate = context.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * seconds))
  const buffer = context.createBuffer(1, length, sampleRate)
  const channel = buffer.getChannelData(0)

  for (let i = 0; i < length; i++) {
    channel[i] = Math.random() * 2 - 1
  }

  return buffer
}

export const createVinylNoiseBuffer = (
  context: BaseAudioContext,
  seconds = DEFAULT_NOISE_SECONDS,
): AudioBuffer => {
  const sampleRate = context.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * seconds))
  const buffer = context.createBuffer(1, length, sampleRate)
  const channel = buffer.getChannelData(0)

  for (let i = 0; i < length; i++) {
    const crackle = Math.random() > 0.995 ? (Math.random() - 0.5) * 0.5 : 0
    const hiss = (Math.random() - 0.5) * 0.02
    channel[i] = crackle + hiss
  }

  return buffer
}
