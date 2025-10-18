const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif'] as const

export type SupportedImageMimeType = (typeof SUPPORTED_TYPES)[number]

export const isSupportedImageType = (file: File): boolean => {
  const { type, name } = file
  if (type && SUPPORTED_TYPES.includes(type as SupportedImageMimeType)) {
    return true
  }

  const extension = name.split('.').pop()?.toLowerCase()
  if (!extension) {
    return false
  }
  return ['jpg', 'jpeg', 'png', 'gif'].includes(extension)
}

export const validateImageFile = (file: File): void => {
  if (!isSupportedImageType(file)) {
    throw new Error('Unsupported image format. Please upload a JPG, PNG, or GIF image.')
  }
}

export type LoadedImage = ImageBitmap | HTMLImageElement

const createHtmlImage = (blobUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image preview'))
    image.src = blobUrl
  })
}

export const loadImageFromFile = async (file: File): Promise<LoadedImage> => {
  validateImageFile(file)

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch (_error) {
      // Fallback to HTMLImageElement if createImageBitmap fails (e.g., Safari GIF handling)
    }
  }

  const blobUrl = URL.createObjectURL(file)
  try {
    const imageElement = await createHtmlImage(blobUrl)
    return imageElement
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export const releaseImage = (image: LoadedImage) => {
  if ('close' in image && typeof image.close === 'function') {
    image.close()
  }
}

export const getImageDimensions = (image: LoadedImage) => {
  if (image instanceof HTMLImageElement) {
    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    }
  }

  return { width: image.width, height: image.height }
}
