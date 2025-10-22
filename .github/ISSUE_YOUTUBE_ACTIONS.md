# Feature: YouTube to MP3 Conversion via GitHub Actions

**GitHub Issue:** [#37](https://github.com/most-want-tech/doomer-tune-machine/issues/37)

## 📋 Overview

Implement a server-side YouTube to MP3 conversion system using GitHub Actions as a stateless processing backend. This feature allows users to paste YouTube URLs directly into the app, triggering an automated workflow that downloads, converts, and delivers MP3 files back to the webapp for audio processing.

**Related Documentation:** [`docs/YOUTUBE_ACTION_FEATURE.md`](../docs/YOUTUBE_ACTION_FEATURE.md)

---

## 🎯 Problem Statement

**Current State:**
- Users can only upload local audio files
- No ability to process YouTube content
- Previous Invidious-based client-side approach was removed due to reliability issues (unreliable instances, CORS errors, API instability)

**Desired State:**
- Users can paste any YouTube URL to extract audio
- Reliable, infrastructure-free conversion process
- Seamless integration with existing audio processing pipeline

**User Value:**
- Access vast YouTube music library without manual downloading
- Streamlined workflow from discovery to processing
- No need for third-party conversion tools

---

## 🏗️ Technical Architecture

### System Design

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

### Implementation Strategy

**Option A: Release Assets (Recommended)**
- ✅ Permanent CDN-backed storage
- ✅ Simple polling via public API
- ✅ No authentication required for downloads
- ⚠️ Public artifacts (acceptable for public repo)
- ⚠️ 2GB release size limit

**Option B: Artifacts**
- ✅ Private storage
- ⚠️ 90-day retention
- ⚠️ Requires GitHub token for downloads
- ⚠️ More complex authentication flow

**Decision:** Use Option A with automatic cleanup after 24 hours.

---

## 📝 Requirements

### Functional Requirements

#### FR-1: YouTube URL Input
- **Description:** User interface to accept YouTube video URLs
- **Acceptance Criteria:**
  - Input field accepts all standard YouTube URL formats
  - Real-time URL validation with visual feedback
  - Clear error messages for invalid URLs
  - Loading state with progress indication
  - Support for paste action via keyboard (Ctrl/Cmd+V)

#### FR-2: Workflow Trigger
- **Description:** Webapp initiates GitHub Actions workflow
- **Acceptance Criteria:**
  - POST request to GitHub API workflows endpoint
  - Unique request ID generation (timestamp + random hash)
  - Error handling for API failures (rate limits, network errors)
  - Retry logic with exponential backoff
  - Request ID returned to UI for tracking

#### FR-3: Server-Side Conversion
- **Description:** GitHub Action downloads and converts video to MP3
- **Acceptance Criteria:**
  - Uses `yt-dlp` for reliable video downloading
  - Converts to MP3 at 192kbps quality using `ffmpeg`
  - Enforces 50MB max file size limit
  - Handles age-restricted and region-locked videos gracefully
  - Completes within 10-minute timeout
  - Extracts video title and metadata

#### FR-4: Result Delivery
- **Description:** Converted MP3 delivered via GitHub Release
- **Acceptance Criteria:**
  - Creates pre-release with tag `audio-{requestId}`
  - Uploads MP3 as release asset
  - Release body contains source URL and timestamp
  - MP3 accessible via public CDN URL
  - No manual approval required

#### FR-5: Result Retrieval
- **Description:** Webapp polls and downloads converted MP3
- **Acceptance Criteria:**
  - Polls Releases API every 2 seconds (max 30 attempts = 60s timeout)
  - Progressive loading indicator (0% → 30% → 80% → 100%)
  - Downloads MP3 from release asset URL
  - Decodes audio buffer using Web Audio API
  - Loads into existing audio processor seamlessly
  - Clears input field on success

#### FR-6: Automatic Cleanup
- **Description:** Remove old audio releases to prevent storage bloat
- **Acceptance Criteria:**
  - Scheduled workflow runs daily at midnight UTC
  - Deletes releases older than 24 hours
  - Only targets releases with `audio-*` tag pattern
  - Logs deletion count for monitoring
  - Never deletes actual version releases

### Non-Functional Requirements

#### NFR-1: Performance
- End-to-end latency: 30-90 seconds (acceptable given reliability)
- Polling overhead: <100ms per request
- MP3 download speed: Limited by GitHub CDN (typically fast)

#### NFR-2: Reliability
- Handles network failures with retry logic (3 attempts)
- Graceful degradation for unsupported videos
- Timeout protection (10 minutes max)
- Clear error messages for all failure scenarios

#### NFR-3: Security
- No API keys or secrets exposed to client
- Rate limiting via workflow concurrency (1 per user)
- File size limits to prevent abuse (50MB max)
- No storage of user data or conversion history

#### NFR-4: Scalability
- Concurrent conversion limit: Based on GitHub Actions minutes quota
- Queue system not required (users retry manually)
- Stateless design (no session management)

#### NFR-5: Maintainability
- Well-documented workflow YAML
- TypeScript interfaces for all API interactions
- Comprehensive error logging
- Feature flag for easy disable

---

## 🎨 User Experience

### Happy Path Flow

```
1. User navigates to Doomer Tune Machine
2. Finds YouTube video with music they want to process
3. Copies YouTube URL (e.g., https://youtu.be/dQw4w9WgXcQ)
4. Pastes URL into "Load from YouTube" input field
   ↳ Input validates URL format in real-time ✓
5. User clicks "Load" button
   ↳ Button shows "Converting..." state
   ↳ Progress bar appears: "Triggering conversion..." (10%)
6. Webapp triggers GitHub Action
   ↳ Progress updates: "Downloading video..." (30%)
7. User waits ~45 seconds (watches progress bar)
   ↳ Progress updates: "Converting to MP3..." (80%)
8. MP3 ready, webapp downloads automatically
   ↳ Progress completes: "Loading audio..." (100%)
9. Audio loads into player, waveform displays
10. User begins applying doomer effects ✨
```

### Error Scenarios

| Error | User Sees | System Behavior |
|-------|-----------|-----------------|
| Invalid URL | "Invalid YouTube URL" toast | No workflow triggered |
| Video unavailable | "Video not found or private" toast | Workflow exits early |
| Conversion timeout | "Conversion took too long, try again" | Workflow cancelled after 10min |
| File too large | "Video too long (>50MB limit)" | Workflow exits with error |
| Network failure | "Connection error, retrying..." | Auto-retry 3 times |
| Rate limit hit | "Too many requests, wait 1 minute" | Display countdown timer |

---

## 🛠️ Implementation Plan

### Phase 1: GitHub Actions Workflow (Priority: P0)
**Estimated Time:** 4 hours

**Deliverables:**
- `.github/workflows/youtube-to-mp3.yml`
- Workflow inputs: `youtube_url`, `request_id`
- Python/Shell script for yt-dlp + ffmpeg conversion
- Release creation with MP3 asset upload
- Error handling and timeout protection

**Acceptance Tests:**
- [ ] Manual workflow trigger succeeds with test URL
- [ ] MP3 file appears in Releases with correct tag
- [ ] Conversion completes within 90 seconds for 3-minute video
- [ ] File size limit enforced (rejects >50MB)
- [ ] Timeout protection triggers after 10 minutes

**Files to Create:**
```
.github/workflows/youtube-to-mp3.yml
.github/scripts/youtube_converter.py (optional)
```

---

### Phase 2: Webapp API Client (Priority: P0)
**Estimated Time:** 3 hours

**Deliverables:**
- `src/features/youtube-action/api/github-converter.ts`
- Functions: `triggerConversion()`, `pollForResult()`, `downloadMp3()`
- Type definitions for API responses
- Error handling with typed exceptions
- Request ID generation utility

**Acceptance Tests:**
- [ ] `triggerConversion()` successfully triggers workflow
- [ ] `pollForResult()` retrieves release when ready
- [ ] Polling respects timeout (max 60 seconds)
- [ ] `downloadMp3()` returns valid ArrayBuffer
- [ ] All errors properly typed and caught

**Files to Create:**
```
src/features/youtube-action/api/github-converter.ts
src/features/youtube-action/types.ts
```

---

### Phase 3: React Hook & UI (Priority: P0)
**Estimated Time:** 4 hours

**Deliverables:**
- `src/features/youtube-action/hooks/use-youtube-action.ts`
- `src/features/youtube-action/components/youtube-action-input.tsx`
- Progress tracking (0% → 10% → 30% → 80% → 100%)
- Loading states and error display
- URL validation with regex

**Acceptance Tests:**
- [ ] Input validates YouTube URLs correctly
- [ ] Progress bar updates during conversion
- [ ] Loading state prevents duplicate submissions
- [ ] Error messages display in toast notifications
- [ ] Success clears input and loads audio

**Files to Create:**
```
src/features/youtube-action/hooks/use-youtube-action.ts
src/features/youtube-action/components/youtube-action-input.tsx
src/features/youtube-action/utils/validation.ts
src/features/youtube-action/index.ts
```

---

### Phase 4: Cleanup Automation (Priority: P1)
**Estimated Time:** 2 hours

**Deliverables:**
- `.github/workflows/cleanup-audio-releases.yml`
- Scheduled daily execution (cron: `0 0 * * *`)
- Deletes releases older than 24 hours
- Only targets `audio-*` tagged releases

**Acceptance Tests:**
- [ ] Scheduled workflow runs daily
- [ ] Deletes only audio releases (preserves version releases)
- [ ] Respects 24-hour retention period
- [ ] Logs deletion summary

**Files to Create:**
```
.github/workflows/cleanup-audio-releases.yml
```

---

### Phase 5: Integration & Testing (Priority: P0)
**Estimated Time:** 3 hours

**Deliverables:**
- Integration with `App.tsx` and audio processor
- End-to-end manual testing
- Error scenario testing
- Performance benchmarking
- Documentation updates

**Acceptance Tests:**
- [ ] Full flow works from URL input to audio playback
- [ ] All error scenarios handled gracefully
- [ ] No memory leaks during conversion
- [ ] Audio quality matches expectations (192kbps)
- [ ] README updated with feature description

---

### Phase 6: Polish & Documentation (Priority: P2)
**Estimated Time:** 2 hours

**Deliverables:**
- User-facing documentation in README
- Code comments and JSDoc
- Optional: Token-based authentication for private repos
- Optional: Conversion history in localStorage

**Acceptance Tests:**
- [ ] Feature documented in README with screenshots
- [ ] All functions have JSDoc comments
- [ ] TypeScript types exported correctly

---

## 📊 Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Conversion Success Rate** | >95% | Successful conversions / Total attempts |
| **Average Latency** | <60 seconds | Time from submit to audio loaded |
| **Error Rate** | <5% | Failed conversions / Total attempts |
| **User Retry Rate** | <10% | Users who retry after first failure |

### Monitoring & Logging

**What to Track:**
- Workflow execution times
- Conversion failures by error type
- MP3 file sizes (ensure under limit)
- Releases created per day
- Cleanup deletions per day

**Where to Track:**
- GitHub Actions logs (automatic)
- Browser console errors (development)
- Optional: Analytics integration for production

---

## 🚨 Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **GitHub Actions quota exhaustion** | High | Medium | Implement per-user rate limiting; display quota warnings |
| **yt-dlp breaks with YouTube changes** | High | Low | Pin yt-dlp version; monitor updates; fallback error messages |
| **CORS issues with release downloads** | Medium | Low | Use `browser_download_url` (CORS-enabled) |
| **Storage bloat from forgotten releases** | Medium | Medium | Automatic cleanup workflow (Phase 4) |
| **Abuse / spam conversions** | Medium | Medium | Concurrency limits; optional token auth |

### User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Perceived slowness (30-90s wait)** | High | High | Clear progress indicators; set expectations upfront |
| **Confusion about feature** | Medium | Medium | Prominent UI placement; helpful placeholder text |
| **Frustration with errors** | Medium | Medium | Actionable error messages; suggest alternatives |

---

## 🔄 Future Enhancements

**Post-MVP Features:**
- [ ] Batch conversion (multiple URLs at once)
- [ ] Playlist support (extract all videos from playlist)
- [ ] Video length preview before conversion
- [ ] Estimated wait time based on video length
- [ ] Conversion history with resume capability
- [ ] Optional GitHub token for private repo auth
- [ ] WebSocket updates instead of polling (requires backend)
- [ ] SoundCloud / Spotify support (if APIs available)

---

## 📚 References

### Technical Documentation
- [GitHub Actions - `workflow_dispatch` event](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp#readme)
- [FFmpeg Audio Conversion Guide](https://ffmpeg.org/ffmpeg-formats.html#Muxers)
- [GitHub Releases API](https://docs.github.com/en/rest/releases/releases)
- [Web Audio API - decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)

### Related Issues & PRs
- N/A (initial implementation)

### Design Files
- [`docs/YOUTUBE_ACTION_FEATURE.md`](../docs/YOUTUBE_ACTION_FEATURE.md) - Complete technical specification

---

## ✅ Definition of Done

This feature is considered complete when:

- [ ] All Phase 1-3 deliverables implemented and tested
- [ ] All acceptance tests passing
- [ ] Code reviewed by at least one other developer
- [ ] No critical bugs or security vulnerabilities
- [ ] Documentation updated (README + inline comments)
- [ ] Feature works in production deployment
- [ ] User feedback collected and addressed (if in beta)
- [ ] Cleanup workflow (Phase 4) deployed and verified
- [ ] Performance meets target metrics (<60s average latency)

---

## 👥 Stakeholders

**Assignee:** _To be assigned_  
**Reviewers:** _To be assigned_  
**QA:** _To be assigned_  

**Labels:** `enhancement`, `feature`, `audio-processing`, `github-actions`, `P0`

**Estimated Total Time:** 18 hours (2-3 days)  
**Target Milestone:** v0.3.0
