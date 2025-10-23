/**
 * Types for YouTube to MP3 conversion feature
 */

export interface ConversionRequest {
  youtubeUrl: string
  requestId: string
}

export interface ConversionResult {
  downloadUrl: string
  filename: string
  releaseId: number
  tagName: string
}

export interface WorkflowRunResponse {
  id: number
  status: string
  conclusion: string | null
}

export interface ReleaseAsset {
  id: number
  name: string
  browser_download_url: string
  size: number
  content_type: string
}

export interface GitHubRelease {
  id: number
  tag_name: string
  name: string
  body: string
  created_at: string
  assets: ReleaseAsset[]
  prerelease: boolean
}

export type ConversionStatus = 'idle' | 'triggering' | 'processing' | 'downloading' | 'complete' | 'error'

export interface ConversionProgress {
  status: ConversionStatus
  progress: number // 0-100
  message?: string
}

export class ConversionError extends Error {
  constructor(
    message: string,
    public readonly code: 'TRIGGER_FAILED' | 'TIMEOUT' | 'NOT_FOUND' | 'DOWNLOAD_FAILED' | 'INVALID_URL',
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'ConversionError'
  }
}
