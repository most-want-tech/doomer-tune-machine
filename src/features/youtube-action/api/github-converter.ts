/**
 * GitHub Actions-based YouTube to MP3 converter API client
 */

import { Octokit } from 'octokit'
import type { ConversionRequest, ConversionResult, GitHubRelease } from '../types'
import { ConversionError } from '../types'

// Repository configuration
const REPO_OWNER = 'most-want-tech'
const REPO_NAME = 'doomer-tune-machine'
const WORKFLOW_FILE = 'youtube-to-mp3.yml'

// Polling configuration
const POLL_INTERVAL_MS = 2000 // 2 seconds
const MAX_POLL_ATTEMPTS = 30 // 60 seconds total timeout
const MAX_RELEASE_WAIT_MS = 5000 // Wait up to 5 seconds for release to appear

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now()
  const randomHash = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${randomHash}`
}

/**
 * Validate YouTube URL format
 */
export function validateYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
  ]
  
  return patterns.some(pattern => pattern.test(url))
}

/**
 * Create Octokit instance (no auth needed for public repo)
 */
function createOctokit(): Octokit {
  return new Octokit()
}

/**
 * Trigger the YouTube to MP3 conversion workflow
 */
export async function triggerConversion(request: ConversionRequest): Promise<void> {
  if (!validateYouTubeUrl(request.youtubeUrl)) {
    throw new ConversionError(
      'Invalid YouTube URL format',
      'INVALID_URL'
    )
  }

  const octokit = createOctokit()

  try {
    await octokit.rest.actions.createWorkflowDispatch({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      workflow_id: WORKFLOW_FILE,
      ref: 'main', // or 'dev' depending on branch
      inputs: {
        youtube_url: request.youtubeUrl,
        request_id: request.requestId,
      },
    })
  } catch (error) {
    console.error('Failed to trigger workflow:', error)
    throw new ConversionError(
      'Failed to trigger conversion workflow',
      'TRIGGER_FAILED',
      error
    )
  }
}

/**
 * Poll for conversion result by checking for release with matching tag
 */
export async function pollForResult(requestId: string): Promise<ConversionResult> {
  const octokit = createOctokit()
  const expectedTag = `audio-${requestId}`
  
  // Wait briefly for release to be created
  await new Promise(resolve => setTimeout(resolve, MAX_RELEASE_WAIT_MS))
  
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    try {
      // Check if release exists with the expected tag
      const { data: release } = await octokit.rest.repos.getReleaseByTag({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        tag: expectedTag,
      }) as { data: GitHubRelease }
      
      // Release found! Check if it has assets
      if (release.assets && release.assets.length > 0) {
        const mp3Asset = release.assets[0] // Should only be one MP3 file
        
        return {
          downloadUrl: mp3Asset.browser_download_url,
          filename: mp3Asset.name,
          releaseId: release.id,
          tagName: release.tag_name,
        }
      }
    } catch (error) {
      // Release not found yet, continue polling
      if ((error as any).status !== 404) {
        console.warn('Error checking for release:', error)
      }
    }
    
    // Wait before next attempt
    if (attempt < MAX_POLL_ATTEMPTS - 1) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }
  
  throw new ConversionError(
    'Conversion timed out. The video might be too long or unavailable.',
    'TIMEOUT'
  )
}

/**
 * Download MP3 file from release asset URL
 */
export async function downloadMp3(downloadUrl: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(downloadUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.arrayBuffer()
  } catch (error) {
    console.error('Failed to download MP3:', error)
    throw new ConversionError(
      'Failed to download converted audio file',
      'DOWNLOAD_FAILED',
      error
    )
  }
}

/**
 * Complete conversion flow: trigger, poll, and download
 */
export async function convertYouTubeToMp3(
  youtubeUrl: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const requestId = generateRequestId()
  
  // Step 1: Trigger conversion (0-10%)
  onProgress?.(5, 'Triggering conversion...')
  await triggerConversion({ youtubeUrl, requestId })
  
  // Step 2: Wait for result (10-80%)
  onProgress?.(10, 'Processing video...')
  
  // Update progress during polling
  const pollWithProgress = async (): Promise<ConversionResult> => {
    const startProgress = 10
    const endProgress = 80
    const progressRange = endProgress - startProgress
    
    const octokit = createOctokit()
    const expectedTag = `audio-${requestId}`
    
    // Wait briefly for release to be created
    await new Promise(resolve => setTimeout(resolve, MAX_RELEASE_WAIT_MS))
    
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      // Calculate progress based on attempt number
      const attemptProgress = startProgress + (progressRange * attempt / MAX_POLL_ATTEMPTS)
      onProgress?.(Math.round(attemptProgress), 'Converting audio...')
      
      try {
        const { data: release } = await octokit.rest.repos.getReleaseByTag({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          tag: expectedTag,
        }) as { data: GitHubRelease }
        
        if (release.assets && release.assets.length > 0) {
          const mp3Asset = release.assets[0]
          return {
            downloadUrl: mp3Asset.browser_download_url,
            filename: mp3Asset.name,
            releaseId: release.id,
            tagName: release.tag_name,
          }
        }
      } catch (error) {
        if ((error as any).status !== 404) {
          console.warn('Error checking for release:', error)
        }
      }
      
      if (attempt < MAX_POLL_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
      }
    }
    
    throw new ConversionError(
      'Conversion timed out. The video might be too long or unavailable.',
      'TIMEOUT'
    )
  }
  
  const result = await pollWithProgress()
  
  // Step 3: Download MP3 (80-100%)
  onProgress?.(85, 'Downloading audio...')
  const buffer = await downloadMp3(result.downloadUrl)
  onProgress?.(100, 'Complete!')
  
  return {
    buffer,
    filename: result.filename,
  }
}
