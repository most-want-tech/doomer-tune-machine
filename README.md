# 🎵 Doomer Tune Machine

A real-time audio processing web application that transforms uploaded songs into "doomer" aesthetics through customizable effects. Built with React + TypeScript + Web Audio API for client-side audio manipulation.

> **🎧 Inspired by [Doomer Waving Society](https://www.youtube.com/@doomerwavingsociety)**  
> This tool was created to streamline the production of doomer mixes featured on the channel. Check out the channel for atmospheric, melancholic mixes that capture the essence of late-night introspection.

## ✨ Features

- **Real-time Audio Processing**: Apply multiple effects (reverb, distortion, lowpass filter, noise overlays, etc.) in real-time
- **Waveform Visualization**: Interactive canvas-based waveform display with playback progress
- **Preset Management**: Save and load effect configurations with persistent storage
- **Audio Export**: Export processed audio as WAV files
- **Video Export**: Generate lo-fi aesthetic videos with background images (12fps, VHS-quality)
- **Feature-Based Architecture**: Clean, modular codebase following Bulletproof React patterns

## 🏗️ Architecture

This project follows a feature-based architecture where related functionality is organized into self-contained modules:

```
src/
├── features/          # Feature modules (audio-player, effects, export, presets, playback)
├── components/        # Shared UI components (layout, waveform-display)
├── hooks/            # Shared custom hooks (use-audio-processor)
├── audio/            # Audio utilities (effects, graph, rendering, encoding)
├── video/            # Video export utilities
└── App.tsx           # Main orchestrator (111 lines)
```

Each feature module contains:
- `components/` - Feature-specific React components
- `hooks/` - Feature-specific custom hooks
- `types.ts` - TypeScript type definitions
- `constants/` - Configuration and metadata
- `index.ts` - Public API exports

## 🚀 Getting Started

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run test suite
```

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

## 🧪 Testing

```bash
npm run test          # Run test suite once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage reports
```

Tests are automatically run via GitHub Actions on pull requests and pushes to `dev`/`main` branches.

## 📚 Documentation

- **[PRD.md](PRD.md)** - Product Requirements Document
- **[REFACTOR_PLAN.md](REFACTOR_PLAN.md)** - Architecture refactoring documentation (completed)
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Development guidelines and patterns
- **[SECURITY.md](SECURITY.md)** - Security policy

## 🎨 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui (Radix primitives)
- **Styling**: Tailwind CSS
- **Audio Processing**: Web Audio API + Tone.js (for advanced pitch shifting)
- **Video Export**: WebCodecs API
- **State Management**: React hooks with localStorage-backed presets
- **Testing**: Vitest
- **Icons**: Phosphor Icons

## 🎛️ Available Effects

### Implemented ✅
- **Reverb**: Simulated room ambience with decay time and mix controls
- **Delay**: Echo effect with time and feedback controls
- **Lowpass Filter**: Frequency cutoff for muffled, lo-fi sound
- **Highpass Filter**: Remove low frequencies and bass rumble
- **Vinyl Crackle**: Simulated vinyl noise and pops
- **Noise Level**: Analog-style background noise for vintage tape feel
- **Distortion**: Waveshaping saturation with drive control for added grit
- **Pitch Shift**: Independent pitch control (-12 to +12 semitones) *powered by Tone.js*
- **Playback Speed**: Independent tempo control (0.25x to 2x) without affecting pitch

## 🎬 Video Export

The video export feature uses WebCodecs API with automatic codec detection:

**Audio Codecs** (priority order):
1. AAC-LC (`mp4a.40.2`) - Best quality, may not be available on Linux
2. Opus - Open-source, excellent quality
3. Vorbis - Open-source fallback

**Video Codecs** (priority order):
1. H.264 Baseline (`avc1.42E01E`) - Best compatibility
2. VP9 - Open-source, good quality
3. VP8 - Open-source fallback

**Intentional Lo-Fi Output**:
- 12fps for choppy, analog-feeling motion
- 320×180 (landscape) or 180×320 (portrait) resolution
- Low bitrate (320 kbps video, 64 kbps audio @ 22.05 kHz)

**Known Limitations**:
- Chrome on Linux cannot encode AAC (falls back to Opus)
- Safari may have limited codec support
- Firefox WebCodecs support is experimental

## 🧹 Development Patterns

### Adding New Effects

1. Add parameter to `AudioEffects` interface with default in `DEFAULT_EFFECTS`
2. Create/configure audio nodes in audio graph initialization
3. Add parameter handling in effects update logic
4. Connect nodes in the audio processing chain
5. Add UI controls to effects panel with metadata

### Creating New Features

Follow the feature-based architecture:

1. Create feature folder: `src/features/<feature-name>/`
2. Organize by type: `components/`, `hooks/`, `types.ts`, `constants/`
3. Use barrel exports: Create `index.ts` for public API
4. Keep features isolated: No cross-feature imports

See `.github/copilot-instructions.md` for complete development guidelines.

## 📊 Project Metrics

**Refactoring Success** (completed December 2024):
- `App.tsx` reduced from 894 → 111 lines (87.6% reduction)
- 5 feature modules created
- 20+ reusable components extracted
- 15+ testable units
- Zero breaking changes during migration

## 🧑‍💻 Contributing

Please follow the feature-based architecture guidelines documented in `.github/copilot-instructions.md` when proposing changes. Keep features isolated, write tests for new behavior, and document noteworthy updates in the PR description.

## 🎬 About

This project was born from the need to create consistent, high-quality doomer mixes for the **[Doomer Waving Society](https://www.youtube.com/@doomerwavingsociety)** YouTube channel. What started as manual audio editing evolved into this streamlined web tool that captures the melancholic, lo-fi aesthetic central to the doomer genre.

If you enjoy the vibe this tool creates, check out the channel for curated mixes featuring:
- Atmospheric ambient soundscapes
- Slowed + reverb classics
- Late-night study/reflection music
- VHS-aesthetic visualizations

**Subscribe:** [@doomerwavingsociety](https://www.youtube.com/@doomerwavingsociety)

## 📄 License

This project is licensed under the terms of the MIT license. See [`LICENSE`](LICENSE) for details.
