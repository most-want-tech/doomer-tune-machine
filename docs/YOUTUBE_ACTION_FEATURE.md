# YouTube to MP3 Conversion Feature

## Overview

The YouTube to MP3 conversion feature allows users to paste YouTube URLs directly into the app and have them automatically converted to MP3 files for audio processing. The feature uses GitHub Actions as a stateless processing backend, eliminating the need for dedicated server infrastructure.

## Architecture

### System Flow

```
┌─────────────────┐
│   Web App UI    │
│  YouTube Input  │
└────────┬────────┘
         │ 1. POST workflow_dispatch
         ▼
┌─────────────────────────────┐
│   GitHub Actions Runner     │
│  ┌─────────────────────┐   │
│  │  yt-dlp download    │   │
│  └──────────┬──────────┘   │
│  ┌──────────▼──────────┐   │
│  │  ffmpeg convert     │   │
│  └──────────┬──────────┘   │
│  ┌──────────▼──────────┐   │
│  │  Create Release     │   │
│  │  Upload MP3 asset   │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
         │ 2. Poll for completion
         ▼
┌─────────────────┐
│   Web App UI    │
│  Download MP3   │
│  Load into WAP  │
└─────────────────┘
```

### Components

#### 1. GitHub Actions Workflows

**`youtube-to-mp3.yml`**
- Triggered via `workflow_dispatch` event with inputs:
  - `youtube_url`: The YouTube video URL to convert
  - `request_id`: Unique identifier (timestamp-hash format)
- Downloads video using `yt-dlp`
- Converts to MP3 at 192kbps using `ffmpeg`
- Enforces 50MB file size limit
- Creates pre-release with tag `audio-{requestId}`
- Uploads MP3 as release asset
- 10-minute timeout protection

**`cleanup-audio-releases.yml`**
- Runs daily at midnight UTC via cron schedule
- Can also be triggered manually
- Finds all releases with `audio-*` tag pattern
- Deletes releases older than 24 hours
- Also deletes associated Git tags

#### 2. API Client (`src/features/youtube-action/api/github-converter.ts`)

**Functions:**

- `generateRequestId()`: Creates unique request ID (timestamp-hash)
- `validateYouTubeUrl(url)`: Validates YouTube URL format
- `triggerConversion(request)`: Triggers GitHub Actions workflow via Octokit
- `pollForResult(requestId)`: Polls GitHub Releases API for completion
- `downloadMp3(downloadUrl)`: Downloads MP3 from release asset
- `convertYouTubeToMp3(url, onProgress)`: Complete conversion flow with progress callbacks

**Configuration:**
- Repository: `most-want-tech/doomer-tune-machine`
- Workflow file: `youtube-to-mp3.yml`
- Poll interval: 2 seconds
- Max poll attempts: 30 (60 seconds total timeout)
- No authentication required (public repo)

#### 3. React Hook (`src/features/youtube-action/hooks/use-youtube-action.ts`)

**Exported Interface:**
```typescript
interface UseYouTubeActionResult {
  status: ConversionStatus // 'idle' | 'triggering' | 'processing' | 'downloading' | 'complete' | 'error'
  progress: number // 0-100
  error: string | null
  isLoading: boolean
  convertAndLoad: (url: string) => Promise<{ buffer: ArrayBuffer; filename: string } | null>
  reset: () => void
}
```

**Responsibilities:**
- Manages conversion state (status, progress, error)
- Calls API client with progress callbacks
- Maps progress values to status states
- Handles error translation to user-friendly messages

#### 4. UI Component (`src/features/youtube-action/components/youtube-action-input.tsx`)

**Features:**
- Text input with YouTube URL validation
- Visual validation feedback (red border for invalid URLs)
- Convert button with loading state
- Progress bar showing 0-100%
- Status messages for each stage
- Error display
- YouTube logo icon

**Props:**
```typescript
interface YouTubeActionInputProps {
  onConvert: (url: string) => Promise<void>
  status: ConversionStatus
  progress: number
  error: string | null
  isLoading: boolean
}
```

## Integration

### App.tsx Integration

The feature is integrated into `App.tsx` with the following handler:

```typescript
const handleYouTubeConvert = async (url: string) => {
  try {
    const result = await youtubeAction.convertAndLoad(url)
    
    if (result) {
      // Convert ArrayBuffer to File for audio processor
      const file = new File([result.buffer], result.filename, { type: 'audio/mpeg' })
      const buffer = await loadAudioFile(file)
      setAudioBuffer(buffer)
      setFileName(result.filename)
      toast.success('Audio loaded from YouTube successfully!')
    }
  } catch (error) {
    console.error('Failed to load YouTube audio:', error)
    toast.error('Failed to load audio from YouTube')
  }
}
```

## Usage

### User Flow

1. **Paste URL**: User pastes a YouTube URL into the input field
2. **Validation**: URL is validated in real-time (visual feedback)
3. **Convert**: User clicks "Convert" button
4. **Progress**: Progress bar shows conversion stages:
   - 0-10%: Triggering conversion
   - 10-80%: Processing video
   - 80-100%: Downloading audio
5. **Complete**: Audio automatically loads into the processor
6. **Success**: Toast notification confirms success, input clears

### Error Handling

The feature handles various error scenarios:

- **Invalid URL**: "Invalid YouTube URL format"
- **Trigger Failed**: "Failed to start conversion. Please check your internet connection."
- **Timeout**: "Conversion timed out. The video might be too long or unavailable."
- **Not Found**: "Video not found. It might be private or deleted."
- **Download Failed**: "Failed to download the converted audio."

## Technical Details

### URL Validation

Supports all YouTube URL formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

### Request ID Format

Format: `{timestamp}-{randomHash}`
Example: `1703123456789-a1b2c3`

- Timestamp: `Date.now()`
- Random hash: 6-character base36 string
- Used in release tag: `audio-1703123456789-a1b2c3`

### Progress Calculation

Progress is calculated based on conversion stage:

| Stage | Progress | Status |
|-------|----------|--------|
| Trigger workflow | 0-10% | `triggering` |
| Process video | 10-80% | `processing` |
| Download MP3 | 80-100% | `downloading` |
| Complete | 100% | `complete` |

During the processing stage (10-80%), progress increases linearly based on poll attempts.

### Polling Strategy

- **Interval**: 2 seconds between polls
- **Max attempts**: 30 (60 seconds total)
- **Initial delay**: 5 seconds before first poll (gives workflow time to create release)
- **Endpoint**: `GET /repos/:owner/:repo/releases/tags/:tag`
- **Success condition**: Release exists with at least one asset

### File Size Limit

Server-side enforcement in workflow:
```bash
FILE_SIZE=$(stat -c%s "$MP3_FILE")
MAX_SIZE=52428800  # 50MB

if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
  echo "Error: File size exceeds 50MB limit"
  exit 1
fi
```

### Cleanup Strategy

Daily cleanup workflow:
1. List all releases in repository
2. Filter for releases with `audio-*` tag pattern
3. Check age: `now - created_at > 24 hours`
4. Delete release and associated tag
5. Log deletion count

## Security Considerations

### No Authentication Required

The feature uses public GitHub APIs that don't require authentication:
- `workflow_dispatch`: Requires write access to repository (handled by GitHub Actions)
- Release API: Public releases are readable without authentication
- Asset downloads: Served via GitHub's CDN, no authentication needed

### Rate Limiting

GitHub API rate limits:
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour

The workflow uses authenticated requests (via `GITHUB_TOKEN`), providing higher limits.

### Abuse Prevention

Built-in protections:
- Workflow concurrency limit: 1 concurrent conversion
- File size limit: 50MB
- Timeout: 10 minutes
- Automatic cleanup: 24-hour retention

## Future Enhancements

Potential improvements:
- [ ] Batch conversion (multiple URLs)
- [ ] Playlist support
- [ ] Video length preview before conversion
- [ ] Estimated wait time based on video length
- [ ] Conversion history with resume capability
- [ ] Support for other platforms (SoundCloud, Spotify)
- [ ] Optional authentication for private repos
- [ ] Webhook-based notification (eliminate polling)

## Troubleshooting

### Conversion Fails

**Check:**
1. Is the YouTube URL valid and accessible?
2. Is the video region-locked or age-restricted?
3. Is the video longer than ~1 hour (may exceed timeout)?
4. Check GitHub Actions workflow logs for details

### Polling Timeout

**Reasons:**
- Video is too long to process in 60 seconds
- Workflow is queued (high GitHub Actions usage)
- Network issues between GitHub and YouTube

**Solutions:**
- Try again later
- Use a shorter video
- Check GitHub Actions status page

### File Size Error

**Reason:** Video audio exceeds 50MB limit

**Solutions:**
- Use a shorter video
- Increase `MAX_SIZE` in workflow (not recommended)
- Download and upload manually as local file

## References

- [GitHub Actions - workflow_dispatch](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp#readme)
- [FFmpeg Audio Conversion](https://ffmpeg.org/ffmpeg-formats.html#Muxers)
- [GitHub Releases API](https://docs.github.com/en/rest/releases/releases)
- [Octokit.js](https://github.com/octokit/octokit.js)
