import { useEffect, useRef } from 'react'

interface WaveformDisplayProps {
  audioBuffer: AudioBuffer | null
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export function WaveformDisplay({ audioBuffer, currentTime, duration, onSeek }: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !audioBuffer) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const data = audioBuffer.getChannelData(0)
    const step = Math.ceil(data.length / width)
    const amp = height / 2

    ctx.fillStyle = 'oklch(0.3 0.01 265)'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'oklch(0.65 0.15 220)'
    ctx.lineWidth = 1

    ctx.beginPath()
    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0
      
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      
      const x = i
      const y1 = (1 + min) * amp
      const y2 = (1 + max) * amp
      
      if (i === 0) {
        ctx.moveTo(x, y1)
      }
      
      ctx.lineTo(x, y1)
      ctx.lineTo(x, y2)
    }
    ctx.stroke()

    const progressX = (currentTime / duration) * width
    ctx.fillStyle = 'oklch(0.65 0.15 220 / 0.3)'
    ctx.fillRect(0, 0, progressX, height)

    ctx.strokeStyle = 'oklch(0.65 0.15 220)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(progressX, 0)
    ctx.lineTo(progressX, height)
    ctx.stroke()

  }, [audioBuffer, currentTime, duration])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !duration) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickProgress = x / rect.width
    const newTime = clickProgress * duration

    onSeek(newTime)
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full h-32 rounded-md cursor-pointer"
      style={{ width: '100%', height: '128px' }}
    />
  )
}
