# YouTube Link Input Feature

## Overview

The YouTube link input feature allows users to load audio directly from YouTube videos by pasting a video URL. The app downloads the audio, decodes it, and loads it into the audio processor for real-time effects processing.

## Implementation

### Architecture

The feature uses the **Invidious API** - an open-source, privacy-friendly YouTube frontend that provides a free API for accessing YouTube data and audio streams.

**Key components:**

1. **YouTube Utilities** (`src/features/audio-player/utils/youtube.ts`)
   - URL parsing and video ID extraction
   - Invidious API integration
   - Audio download with progress tracking

2. **YouTubeInput Component** (`src/features/audio-player/components/youtube-input.tsx`)
   - User-facing input field for YouTube URLs
   - Progress bar for download tracking
   - URL validation feedback

3. **App Integration** (`src/App.tsx`)
   - Coordinates YouTube loading with existing audio processor
   - Manages loading state and progress

### Why Invidious?

Invidious was chosen because:
- ✅ **Free and open-source** - No API keys or rate limits
- ✅ **Privacy-focused** - Doesn't track users
- ✅ **CORS-enabled** - Works from browser without backend
- ✅ **Multiple instances** - Built-in redundancy for reliability
- ✅ **Pure client-side** - No backend infrastructure needed

### Supported URL Formats

The feature supports all standard YouTube URL formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`
- Just the video ID: `VIDEO_ID`

## Usage

1. Paste a YouTube video URL into the "Load from YouTube" input field
2. Click the "Load" button
3. Wait for the audio to download (progress bar shows download status)
4. Once loaded, the audio is ready for processing with effects

## Technical Details

### Download Process

1. **Extract Video ID**: Parse the YouTube URL to extract the 11-character video ID
2. **Fetch Video Info**: Query Invidious API for video metadata and audio formats
3. **Select Audio Format**: Choose the best available audio format (prioritizes higher bitrate)
4. **Download Audio**: Fetch audio stream from YouTube CDN with progress tracking
5. **Decode Audio**: Convert downloaded audio to AudioBuffer using Web Audio API
6. **Load into Processor**: Pass decoded audio to the existing audio processing pipeline

### Instance Fallback

The implementation queries multiple Invidious instances for reliability:

1. `https://inv.tux.pizza`
2. `https://invidious.fdn.fr`
3. `https://iv.ggtyler.dev`
4. `https://invidious.privacyredirect.com`

If one instance is down or rate-limited, the code automatically tries the next one.

### Error Handling

The feature handles various error scenarios:

- **Invalid URL**: Shows error toast with helpful message
- **Video not found**: Shows error from Invidious API
- **No audio format available**: Handles videos without audio streams
- **All instances down**: Shows error after trying all instances
- **Network errors**: Catches and displays fetch errors
- **Decode errors**: Handles Web Audio API decode failures

## Limitations

### Known Issues

1. **Instance Availability**: Invidious instances can be temporarily unavailable
   - **Solution**: Multiple instances with automatic fallback
   
2. **Rate Limiting**: Public instances may rate-limit heavy usage
   - **Solution**: Using multiple instances distributes load

3. **Ad Blockers**: Some ad blockers may block Invidious API requests
   - **User Action**: Whitelist Invidious domains if needed

4. **Age-Restricted Content**: Videos requiring login cannot be accessed
   - **Limitation**: Inherent to API-based approach

5. **Large Videos**: Very long videos (>2 hours) may be slow to download
   - **Limitation**: Browser memory constraints

### Browser Compatibility

The feature requires:
- ✅ Web Audio API support (all modern browsers)
- ✅ Fetch API with streaming support
- ✅ ArrayBuffer and TypedArray support

## Future Enhancements

Potential improvements:

1. **Backend Proxy**: Add optional backend service for better reliability
2. **Caching**: Cache downloaded audio to avoid re-downloading
3. **Format Selection**: Let users choose audio quality/format
4. **Playlist Support**: Support loading entire playlists
5. **Live Stream Support**: Handle YouTube live streams

## Testing

### Unit Tests

Tests are located in `src/features/audio-player/__tests__/youtube.test.ts`:

```bash
npm run test
```

The test suite covers:
- ✅ Video ID extraction from various URL formats
- ✅ URL validation
- ✅ Edge cases (empty strings, invalid formats)

### Manual Testing

To test the feature manually:

1. Start the dev server: `npm run dev`
2. Open the app in a browser
3. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
4. Click "Load" and verify:
   - Progress bar appears and updates
   - Success toast shows when complete
   - Audio loads into the player
   - All effects work with the loaded audio

## Alternative Implementations

If the Invidious approach doesn't meet requirements, alternatives include:

### 1. Backend Service with youtube-dl

Create a simple backend endpoint using `youtube-dl` or `yt-dlp`:

```javascript
// Backend (Node.js/Express)
app.post('/api/youtube-audio', async (req, res) => {
  const { url } = req.body
  // Use youtube-dl-exec to download audio
  // Stream audio back to client
})
```

**Pros**: More reliable, more format options
**Cons**: Requires backend infrastructure

### 2. Serverless Function

Deploy a serverless function (Vercel, Netlify, Cloudflare Workers):

```javascript
// Serverless function
export default async function handler(req, res) {
  // Download and proxy audio
}
```

**Pros**: Scales automatically, minimal infrastructure
**Cons**: Cold start delays, limited execution time

### 3. Browser Extension

Create a browser extension that can access YouTube directly:

**Pros**: Best reliability, no API needed
**Cons**: Requires users to install extension

## Contributing

When modifying the YouTube feature:

1. Follow the existing code patterns in `youtube.ts`
2. Add tests for new URL formats or edge cases
3. Update this documentation with any changes
4. Test with multiple Invidious instances to verify fallback behavior
5. Consider error messages from the user's perspective

## Resources

- [Invidious Documentation](https://docs.invidious.io/)
- [Invidious Public Instances](https://docs.invidious.io/instances/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Fetch API Streaming](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
