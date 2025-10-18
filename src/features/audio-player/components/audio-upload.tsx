import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Card } from '@/components/ui/card'
import { CloudArrowUp } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AudioUploadProps {
  fileName: string
  onFileSelect: (file: File) => Promise<void>
}

export function AudioUpload({ fileName, onFileSelect }: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileValidation(file)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileValidation(file)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileValidation = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file (MP3, WAV, OGG)')
      return
    }

    try {
      await onFileSelect(file)
      toast.success('Audio loaded successfully')
    } catch (error) {
      console.error('Failed to load audio file:', error)
      toast.error('Failed to load audio file')
    }
  }

  return (
    <Card className="p-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          className="hidden"
        />
        <CloudArrowUp className="mx-auto mb-4 text-primary" size={48} />
        <p className="text-lg mb-2">
          {fileName || 'Drop your audio file here or click to browse'}
        </p>
        <p className="text-sm text-muted-foreground">Supports MP3, WAV, OGG</p>
      </div>
    </Card>
  )
}
