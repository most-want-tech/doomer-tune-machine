export const VIDEO_ORIENTATIONS = {
  landscape: { width: 640, height: 360 },
  portrait: { width: 360, height: 640 },
} as const

export type VideoOrientation = keyof typeof VIDEO_ORIENTATIONS

export const getVideoDimensions = (orientation: VideoOrientation) => VIDEO_ORIENTATIONS[orientation]

export interface ContainRect {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export const calculateContainRect = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): ContainRect => {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      x: 0,
      y: 0,
      width: targetWidth,
      height: targetHeight,
      scale: 1,
    }
  }

  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight

  let drawWidth = targetWidth
  let drawHeight = targetHeight

  if (sourceRatio > targetRatio) {
    drawHeight = targetWidth / sourceRatio
  } else {
    drawWidth = targetHeight * sourceRatio
  }

  const offsetX = (targetWidth - drawWidth) / 2
  const offsetY = (targetHeight - drawHeight) / 2

  return {
    x: offsetX,
    y: offsetY,
    width: drawWidth,
    height: drawHeight,
    scale: drawWidth / sourceWidth,
  }
}
