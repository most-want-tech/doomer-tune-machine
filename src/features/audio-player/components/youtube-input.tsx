import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { YoutubeLogo } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { isValidYouTubeUrl } from '../utils'

interface YouTubeInputProps {
  isLoading: boolean
  progress: number
  onSubmit: (url: string) => Promise<void>
}

export function YouTubeInput({ isLoading, progress, onSubmit }: YouTubeInputProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    if (!isValidYouTubeUrl(url)) {
      toast.error('Invalid YouTube URL. Please enter a valid YouTube video link.')
      return
    }

    try {
      await onSubmit(url)
      setUrl('') // Clear input on success
      toast.success('YouTube audio loaded successfully')
    } catch (error) {
      console.error('Failed to load YouTube audio:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to load YouTube audio: ${errorMessage}`)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <YoutubeLogo className="text-primary" size={24} />
          <h3 className="text-lg font-semibold">Load from YouTube</h3>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !url.trim()}>
            {isLoading ? 'Loading...' : 'Load'}
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Downloading audio... {Math.round(progress)}%
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Supports standard YouTube video URLs and youtu.be short links
        </p>
      </form>
    </Card>
  )
}
