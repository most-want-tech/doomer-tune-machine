# YouTube-to-MP3 via GitHub Actions

## Overview
Process YouTube videos server-side using GitHub Actions as a stateless conversion API. Users paste a YouTube URL, the webapp triggers a workflow dispatch, Python downloads & converts to MP3, and the result is delivered back via GitHub Releases or artifact download.

**Note:** This replaces the previous Invidious-based approach which was removed due to reliability issues with third-party API instances.

**Implementation Issue:** [`.github/ISSUE_YOUTUBE_ACTIONS.md`](../.github/ISSUE_YOUTUBE_ACTIONS.md) - Professional-grade implementation plan with phases, acceptance criteria, and success metrics.

## Architecture: GitHub-Native Processing Pipeline

### Flow Diagram
```
User Input (YouTube URL) 
  ↓
Webapp triggers workflow_dispatch
  ↓
GitHub Action runner
  ├─ Python: yt-dlp downloads video
  ├─ ffmpeg converts to MP3
  └─ Uploads as Release asset OR artifact
  ↓
Webapp polls/fetches MP3
  ↓
Load into Web Audio API
```

## Solution Design

### Option A: Workflow Dispatch + Release Assets (Recommended)
**Pros:** Permanent storage, CDN delivery, version tracking, simple polling
**Cons:** Public artifacts (if public repo), 2GB release limit

**Implementation:**
1. **Trigger:** POST to GitHub API `/repos/{owner}/{repo}/actions/workflows/youtube-convert.yml/dispatches`
2. **Processing:** Action downloads YouTube → converts → creates Release
3. **Delivery:** Webapp polls Releases API, downloads MP3 from release asset URL

### Option B: Workflow Dispatch + Artifacts
**Pros:** Private storage, better for sensitive content
**Cons:** 90-day retention, requires GitHub token for download, slower

### Option C: Repository Dispatch + Issue Comments
**Pros:** Asynchronous feedback via comments, good for debugging
**Cons:** Clutters issues, less elegant UX

## Recommended Implementation (Option A)

### 1. GitHub Action Workflow
**File:** `.github/workflows/youtube-to-mp3.yml`

```yaml
name: YouTube to MP3 Converter

on:
  workflow_dispatch:
    inputs:
      youtube_url:
        description: 'YouTube video URL'
        required: true
        type: string
      request_id:
        description: 'Unique request identifier'
        required: true
        type: string

jobs:
  convert:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          pip install yt-dlp
          sudo apt-get update
          sudo apt-get install -y ffmpeg
          
      - name: Download & Convert
        id: convert
        run: |
          # Download as MP3 directly (yt-dlp handles conversion)
          yt-dlp \
            --extract-audio \
            --audio-format mp3 \
            --audio-quality 192K \
            --output "audio_${{ inputs.request_id }}.%(ext)s" \
            --no-playlist \
            --max-filesize 50M \
            "${{ inputs.youtube_url }}"
          
          # Get actual filename
          FILE=$(ls audio_${{ inputs.request_id }}.mp3)
          echo "filename=$FILE" >> $GITHUB_OUTPUT
          
      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: audio-${{ inputs.request_id }}
          name: Audio ${{ inputs.request_id }}
          body: |
            Converted from: ${{ inputs.youtube_url }}
            Request ID: ${{ inputs.request_id }}
            Timestamp: ${{ github.run_id }}
          files: ${{ steps.convert.outputs.filename }}
          prerelease: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Python Script (Alternative: Embedded in Action)
If you prefer a separate script for better control:

**File:** `.github/scripts/youtube_converter.py`

```python
#!/usr/bin/env python3
import sys
import os
from yt_dlp import YoutubeDL

def download_and_convert(url: str, output_id: str) -> str:
    """Download YouTube video and convert to MP3."""
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': f'audio_{output_id}.%(ext)s',
        'max_filesize': 50 * 1024 * 1024,  # 50MB limit
        'no_warnings': False,
        'quiet': False,
    }
    
    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'Unknown')
            return f"audio_{output_id}.mp3", title
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: youtube_converter.py <url> <request_id>")
        sys.exit(1)
    
    url = sys.argv[1]
    request_id = sys.argv[2]
    filename, title = download_and_convert(url, request_id)
    
    # Output for GitHub Actions
    print(f"::set-output name=filename::{filename}")
    print(f"::set-output name=title::{title}")
```

### 3. Webapp Integration

**New Feature Module:** `src/features/youtube-action/`

#### API Client
**File:** `src/features/youtube-action/api/github-converter.ts`

```typescript
const GITHUB_API = 'https://api.github.com';
const OWNER = 'most-want-tech';
const REPO = 'doomer-tune-machine';

interface ConversionRequest {
  youtubeUrl: string;
  requestId: string;
}

interface ConversionResult {
  mp3Url: string;
  title: string;
  size: number;
}

export async function triggerConversion(
  youtubeUrl: string,
  githubToken?: string
): Promise<string> {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const response = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/actions/workflows/youtube-to-mp3.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': githubToken ? `Bearer ${githubToken}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          youtube_url: youtubeUrl,
          request_id: requestId,
        },
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to trigger conversion: ${response.statusText}`);
  }
  
  return requestId;
}

export async function pollForResult(
  requestId: string,
  maxAttempts = 30,
  interval = 2000
): Promise<ConversionResult> {
  const tagName = `audio-${requestId}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/releases/tags/${tagName}`
      );
      
      if (response.ok) {
        const release = await response.json();
        const asset = release.assets[0];
        
        if (asset) {
          return {
            mp3Url: asset.browser_download_url,
            title: release.name,
            size: asset.size,
          };
        }
      }
    } catch (err) {
      // Continue polling
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Conversion timeout - please try again');
}

export async function downloadMp3(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download MP3');
  }
  return response.arrayBuffer();
}
```

#### React Hook
**File:** `src/features/youtube-action/hooks/use-youtube-action.ts`

```typescript
import { useState } from 'react';
import { triggerConversion, pollForResult, downloadMp3 } from '../api/github-converter';

interface UseYouTubeActionResult {
  isLoading: boolean;
  progress: number;
  error: string | null;
  loadFromYouTube: (url: string, githubToken?: string) => Promise<ArrayBuffer>;
}

export function useYouTubeAction(): UseYouTubeActionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const loadFromYouTube = async (
    url: string,
    githubToken?: string
  ): Promise<ArrayBuffer> => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Step 1: Trigger workflow (10%)
      setProgress(10);
      const requestId = await triggerConversion(url, githubToken);
      
      // Step 2: Poll for result (10-80%)
      setProgress(30);
      const result = await pollForResult(requestId);
      
      // Step 3: Download MP3 (80-100%)
      setProgress(80);
      const audioBuffer = await downloadMp3(result.mp3Url);
      
      setProgress(100);
      return audioBuffer;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { isLoading, progress, error, loadFromYouTube };
}
```

#### UI Component
**File:** `src/features/youtube-action/components/youtube-action-input.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useYouTubeAction } from '../hooks/use-youtube-action';

interface YouTubeActionInputProps {
  onAudioLoaded: (buffer: ArrayBuffer, filename: string) => void;
  disabled?: boolean;
}

export function YouTubeActionInput({ onAudioLoaded, disabled }: YouTubeActionInputProps) {
  const [url, setUrl] = useState('');
  const { isLoading, progress, error, loadFromYouTube } = useYouTubeAction();
  
  const handleSubmit = async () => {
    if (!url.trim()) return;
    
    try {
      const buffer = await loadFromYouTube(url);
      onAudioLoaded(buffer, 'youtube-audio.mp3');
      setUrl('');
    } catch (err) {
      // Error handled by hook
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Paste YouTube URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled || isLoading}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || isLoading || !url.trim()}
        >
          {isLoading ? 'Converting...' : 'Load'}
        </Button>
      </div>
      
      {isLoading && (
        <Progress value={progress} className="w-full" />
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
```

## Security & Rate Limiting

### Authentication Options

**Option 1: Public Workflow (No Token Required)**
- Allow anonymous conversions
- Add rate limiting via workflow concurrency
- Risk: Potential abuse

**Option 2: GitHub Token (Recommended)**
- Users provide personal access token (PAT)
- Stored in localStorage or session
- Better control & accountability

```yaml
# In workflow file - add rate limiting
concurrency:
  group: youtube-convert-${{ github.actor }}
  cancel-in-progress: false
```

### Cleanup Strategy

**Auto-cleanup old releases:**

```yaml
# .github/workflows/cleanup-audio-releases.yml
name: Cleanup Audio Releases

on:
  schedule:
    - cron: '0 0 * * *'  # Daily
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const releases = await github.rest.repos.listReleases({
              owner: context.repo.owner,
              repo: context.repo.repo,
            });
            
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000;
            
            for (const release of releases.data) {
              if (release.tag_name.startsWith('audio-')) {
                const created = new Date(release.created_at).getTime();
                if (now - created > ONE_DAY) {
                  await github.rest.repos.deleteRelease({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    release_id: release.id,
                  });
                }
              }
            }
```

## Implementation Checklist

### Phase 1: GitHub Action Setup
- [ ] Create `.github/workflows/youtube-to-mp3.yml`
- [ ] Test workflow with manual trigger
- [ ] Add error handling & size limits
- [ ] Setup cleanup workflow

### Phase 2: Webapp Integration
- [ ] Create `src/features/youtube-action/` module
- [ ] Implement API client with polling
- [ ] Build React hook for state management
- [ ] Add UI component with progress indicator

### Phase 3: Integration & Polish
- [ ] Integrate with existing audio-player feature
- [ ] Add token input for authenticated requests
- [ ] Implement error states & retry logic
- [ ] Add analytics/monitoring

### Phase 4: Testing & Documentation
- [ ] Test end-to-end flow
- [ ] Document token setup process
- [ ] Add usage examples
- [ ] Security audit

## Trade-offs & Limitations

| Aspect | Limitation | Mitigation |
|--------|-----------|------------|
| **Speed** | 30-90s latency | Show progress, set expectations |
| **Concurrency** | 1 workflow/user | Queue system or token-based priority |
| **Storage** | 2GB release limit | Auto-cleanup after 24h |
| **Privacy** | Public releases (public repo) | Use private repo OR artifacts |
| **Cost** | GitHub Actions minutes | Optimize runtime, add limits |

## Why Not Client-Side?

Previous attempts with Invidious API failed due to:
- Unreliable instance availability
- CORS issues
- Rate limiting on public instances
- API changes and deprecations

GitHub Actions provides a stable, controlled environment for conversion.

## Estimated Development Time

- **Phase 1 (Action):** 3-4 hours
- **Phase 2 (Webapp):** 4-5 hours  
- **Phase 3 (Integration):** 2-3 hours
- **Phase 4 (Testing):** 2-3 hours

**Total:** 11-15 hours

## Next Steps

1. **Decide on security model:** Public vs token-required
2. **Test GitHub Action locally** using `act` CLI
3. **Build MVP** with basic conversion
4. **Iterate** based on performance metrics

---

**Note:** This GitHub Actions approach trades speed for reliability. The 30-90s latency is acceptable since it provides a stable, infrastructure-free solution without third-party API dependencies.
