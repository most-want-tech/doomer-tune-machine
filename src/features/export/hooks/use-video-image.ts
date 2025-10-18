import { useState, useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { toast } from 'sonner'
import { validateImageFile } from '@/video/image-utils'
import type { VideoOrientation } from '@/video/video-layout'

export function useVideoImage() {
  const [videoImage, setVideoImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [videoOrientation, setVideoOrientation] = useState<VideoOrientation>('landscape')
  const imageInputRef = useRef<HTMLInputElement>(null)

  const updateImagePreview = (file: File) => {
    setImagePreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return URL.createObjectURL(file)
    })
  }

  const handleImageFile = (file: File) => {
    try {
      validateImageFile(file)
      setVideoImage(file)
      updateImagePreview(file)
      toast.success('Image ready for video export')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unsupported image format'
      toast.error(message)
    }
  }

  const handleImageInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  return {
    videoImage,
    imagePreviewUrl,
    videoOrientation,
    imageInputRef,
    setVideoOrientation,
    handleImageInput,
  }
}
