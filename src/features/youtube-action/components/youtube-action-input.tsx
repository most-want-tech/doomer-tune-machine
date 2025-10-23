/**
 * YouTube URL input component with conversion progress
 */

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { YoutubeLogo, CircleNotch } from '@phosphor-icons/react'
import { validateYouTubeUrl } from '../api/github-converter'
import type { ConversionStatus } from '../types'

interface YouTubeActionInputProps {
  onConvert: (url: string) => Promise<void>
  status: ConversionStatus
  progress: number
  error: string | null
  isLoading: boolean
}

export function YouTubeActionInput({
  onConvert,
  status,
  progress,
  error,
  isLoading,
}: YouTubeActionInputProps) {
  const [url, setUrl] = useState('')
  const [isValid, setIsValid] = useState(true)

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    
    // Validate URL on change (if not empty)
    if (newUrl.trim()) {
      setIsValid(validateYouTubeUrl(newUrl))
    } else {
      setIsValid(true)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!url.trim() || !isValid || isLoading) {
      return
    }

    await onConvert(url)
    
    // Clear input on success
    if (status === 'complete') {
      setUrl('')
      setIsValid(true)
    }
  }

  const getStatusMessage = (): string => {
    switch (status) {
      case 'triggering':
        return 'Starting conversion...'
      case 'processing':
        return 'Converting video to MP3...'
      case 'downloading':
        return 'Downloading audio...'
      case 'complete':
        return 'Conversion complete!'
      case 'error':
        return error || 'Conversion failed'
      default:
        return 'Paste a YouTube URL to get started'
    }
  }

  const getProgressColor = (): string => {
    if (status === 'error') return 'bg-destructive'
    if (status === 'complete') return 'bg-green-500'
    return 'bg-primary'
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <YoutubeLogo size={24} weight="fill" className="text-primary" />
          <h3 className="text-lg font-semibold">YouTube to MP3</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={handleUrlChange}
              disabled={isLoading}
              className={!isValid && url ? 'border-destructive' : ''}
              aria-label="YouTube URL"
            />
            <Button
              type="submit"
              disabled={!url.trim() || !isValid || isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <>
                  <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                  Converting
                </>
              ) : (
                'Convert'
              )}
            </Button>
          </div>

          {!isValid && url && (
            <p className="text-sm text-destructive">
              Please enter a valid YouTube URL
            </p>
          )}
        </form>

        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{getStatusMessage()}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className={getProgressColor()} />
          </div>
        )}

        {status === 'complete' && (
          <div className="text-sm text-green-600 dark:text-green-400">
            ✓ {getStatusMessage()}
          </div>
        )}

        {status === 'error' && error && (
          <div className="text-sm text-destructive">
            ✗ {error}
          </div>
        )}

        {status === 'idle' && (
          <p className="text-sm text-muted-foreground">
            {getStatusMessage()}
          </p>
        )}
      </div>
    </Card>
  )
}
