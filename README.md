# ✨ Welcome to Your Spark Template!
You've just launched your brand-new Spark Template Codespace — everything’s fired up and ready for you to explore, build, and create with Spark!

This template is your blank canvas. It comes with a minimal setup to help you get started quickly with Spark development.

🚀 What's Inside?
- A clean, minimal Spark environment
- Pre-configured for local development
- Ready to scale with your ideas
  
🧠 What Can You Do?

Right now, this is just a starting point — the perfect place to begin building and testing your Spark applications.

## Browser Compatibility

### Video Export Codec Support

The video export feature uses the WebCodecs API and automatically detects the best available codecs for your browser/platform. The codec selection priority is:

**Audio Codecs** (in order of preference):
1. **AAC-LC** (`mp4a.40.2`) - Best quality and compatibility, but may not be available on Linux due to patent restrictions
2. **Opus** - Open-source, excellent quality, widely supported (recommended fallback)
3. **Vorbis** - Open-source fallback option

**Video Codecs** (in order of preference):
1. **H.264 Baseline** (`avc1.42E01E`) - Best compatibility across platforms
2. **VP9** - Open-source, good quality
3. **VP8** - Open-source fallback

**Known Limitations:**
- Chrome on Linux typically cannot encode AAC due to licensing restrictions - the app will automatically fall back to Opus
- Safari may have limited codec support depending on version
- Firefox support for WebCodecs is still experimental (behind flags as of 2024)

If you encounter codec errors, the application will display a helpful error message indicating which codecs are unavailable.

### Intentional Low-Fidelity Output

To match the lo-fi doomer aesthetic, video exports intentionally target extremely low quality:

- 12fps frame rate for choppy, analog-feeling motion
- 320×180 (landscape) or 180×320 (portrait) frames to emulate VHS-era resolution
- 320 kbps video bitrate with 64 kbps AAC/Opus audio at 22.05 kHz for gritty sonics

These defaults keep files lightweight and give every export the desired degraded vibe without additional configuration.

🧹 Just Exploring?
No problem! If you were just checking things out and don’t need to keep this code:

- Simply delete your Spark.
- Everything will be cleaned up — no traces left behind.

📄 License For Spark Template Resources 

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## Testing

- `npm run test` runs the Vitest suite once in Node.
- `npm run test:watch` keeps the Vitest runner active for rapid feedback while editing tests.
- `npm run test:coverage` generates coverage reports using V8 instrumentation.
- Pull requests and pushes to `dev`/`main` automatically run the Vitest suite via GitHub Actions (`.github/workflows/ci.yml`).
