# Copilot Instructions: Doomer Tune Machine

## Project Overview
Real-time audio processing web application that transforms uploaded songs into "doomer" aesthetics through customizable effects. Built with React + TypeScript + Web Audio API for client-side audio manipulation.

## Architecture Patterns

### Web Audio API Chain
Audio processing follows a specific node chain in `src/hooks/use-audio-processor.ts`:
```
AudioBuffer → Source → Filters → Effects → Gain → Destination
```
- All audio nodes are created once and reused to prevent memory leaks
- Effects are applied via `updateEffects()` which modifies existing nodes rather than recreating them
- Real-time parameter changes use `setValueAtTime()` for smooth transitions

### State Management
- **Audio state**: Managed entirely in `use-audio-processor` hook - never duplicate audio context references
- **UI state**: Local React state in `App.tsx` for effects parameters and playback controls  
- **Persistence**: Presets stored through a custom localStorage-backed hook (safe for SSR)
- **Effects interface**: `AudioEffects` type defines all effect parameters with sensible defaults in `DEFAULT_EFFECTS`

### Component Architecture
- `App.tsx`: Lightweight orchestrator component (111 lines) that coordinates feature modules
  - **Refactored**: Successfully migrated from 894 lines monolith to feature-based architecture
  - Handles only high-level state coordination and feature composition
  - All domain logic extracted into feature modules
- `src/components/layout/`: Shared layout components (AppHeader, AppFooter)
- `src/components/ui/`: Shadcn/ui components using Radix primitives - follow existing patterns
- `WaveformDisplay`: Canvas-based visualization component in shared components

### Feature-Based Architecture (Completed ✅)
Following Bulletproof React patterns, the codebase uses feature modules:

**Structure Pattern**: `src/features/<feature-name>/`
- `components/` - Feature-specific UI components
- `hooks/` - Feature-specific custom hooks
- `types.ts` - Feature-specific TypeScript types
- `constants/` - Feature-specific configuration/data
- `index.ts` - Barrel export for public API

**Existing Features**:
- `audio-player/` - File upload and audio loading
- `playback/` - Playback controls, waveform display, volume control
- `effects/` - Audio effects panel with sliders/switches and metadata
- `presets/` - Save/load/delete preset management
- `export/` - Audio and video export functionality

**Shared Modules**: `src/components/`, `src/hooks/`, `src/lib/`, `src/audio/`, `src/video/`

**Import Rules**: 
- Features can import from shared modules
- Features CANNOT import from other features (keep isolated)
- App.tsx imports from features via barrel exports

## Development Workflows

### Audio Development
```bash
npm run dev          # Start dev server with audio context support
npm run build        # TypeScript build with audio optimizations
npm run kill         # Kill process on port 5000 if needed
```

### Versioning & Releases
- The app surface displays the active version/build via `src/lib/version.ts`, which consumes the `__APP_VERSION__` and `__APP_GIT_SHA__` constants defined in `vite.config.ts`.
- Update package version with `npm version <patch|minor|major>` so the footer and release links stay accurate.
- Pushing an annotated tag that matches `v*` triggers `.github/workflows/release.yml`, which runs tests, builds the production bundle, and publishes a GitHub Release with the bundled artifact.
- During local development (no Git SHA), version links fall back to the releases overview to avoid 404s.

### Audio Context Gotchas
- Audio context requires user interaction to start - handle suspended state
- Always check `audioContextRef.current` before Web Audio API calls
- Use `AudioContext.resume()` after user interaction to enable audio
- Buffer sources are one-time-use - create new source node for each playback

### Effect Implementation Pattern
When adding new audio effects:
1. Add parameter to `AudioEffects` interface in `src/audio/audio-effects.ts` with default value in `DEFAULT_EFFECTS`
2. Create/configure audio nodes in audio graph initialization (`src/audio/audio-graph.ts`)
3. Add parameter handling in effects update logic
4. Connect nodes in the audio processing chain appropriately
5. Add UI controls in effects feature with effect metadata in `src/features/effects/constants/effect-info.ts`
6. Reuse shared helpers where possible (e.g., `getDistortionCurve` for waveshaping curves)

## Key Dependencies & Integration

### UI System  
- Shadcn/ui components in "new-york" style with custom neutral color palette
- Tailwind config loads custom theme from `theme.json` (currently empty)
- CSS variables for theming in `src/styles/theme.css` 
- Use `@/` path alias for src imports

### Audio Libraries
- **Primary**: Native Web Audio API for basic audio processing
- **Tone.js**: Used for advanced effects requiring complex DSP (pitch shifting, time stretching)
  - Provides `PitchShift` node for independent pitch control without affecting playback speed
  - Wrap Tone.js nodes in audio graph, maintain Web Audio API as primary interface
- Canvas-based waveform rendering without external visualization libs
- Export uses `OfflineAudioContext` for non-realtime high-quality rendering
- Audio processing utilities in `src/audio/` (audio-effects, audio-graph, audio-utils, offline-renderer, wav-encoder)
- Video export utilities in `src/video/` (codec-support, image-utils, video-exporter, video-layout)

## File Organization Conventions

### Import Order
```tsx
// 1. React imports
// 2. External libraries (@radix-ui, tone, etc)
// 3. Internal components (@/components/ui, @/hooks)
// 4. Types and utilities
// 5. Styles (if any)
```

### Audio Hook Pattern
- Keep all Web Audio API interactions in `use-audio-processor.ts`
- Expose minimal, semantic interface (play, pause, updateEffects)
- Handle audio context lifecycle and cleanup internally
- Use refs for audio nodes, state for UI-relevant values only

### Component Patterns
- Feature modules encapsulate related UI and logic
- Effect controls follow pattern: Label + Slider/Switch + Info tooltip
- All audio parameters immediately update via `updateEffects(effects)`
- Loading states and error handling use sonner toast notifications
- File uploads handled with hidden input + drag/drop in audio-player feature

## Refactoring Standards

### When Creating New Features
Follow the feature-based architecture pattern:

1. **Create feature folder**: `src/features/<feature-name>/`
2. **Organize by type**:
   - Components in `components/` subdirectory
   - Hooks in `hooks/` subdirectory  
   - Types in `types.ts`
   - Constants in `constants/` subdirectory
3. **Use barrel exports**: Create `index.ts` to export public API
4. **Keep features isolated**: No cross-feature imports

### Major Refactoring Workflow
For large-scale refactors (>500 LOC changes):

1. **Create detailed plan**: Use `REFACTOR_PLAN.md` as template
2. **Follow workflow**: See `.github/REFACTORING_WORKFLOW.md`
3. **Break into phases**: Each phase = separate PR
4. **Use feature branches**: `refactor/<scope>-<description>`
5. **Document everything**: Plan, phases, decisions, metrics

**Previous major refactor**: App.tsx component architecture (✅ Completed December 2024)
- Reduced App.tsx from 894 → 111 lines (87.6% reduction)
- Created 5 feature modules (audio-player, playback, effects, presets, export)
- Extracted 20+ reusable components
- Zero breaking changes during 7-phase migration
- See `REFACTOR_PLAN.md` for detailed documentation

## Tech Stack and Versions

### Core Technologies
- **Node.js**: v18+ recommended (for optimal package compatibility)
- **React**: 19.0.0 with TypeScript strict mode
- **TypeScript**: ~5.7.2 (configured for strict type checking)
- **Vite**: ^6.3.5 (build tool and dev server)
- **Vitest**: ^3.2.4 (testing framework)

### Key Dependencies
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS 4.1.11 with custom theme configuration
- **Audio Processing**: 
  - Native Web Audio API (primary)
  - Tone.js 15.1.22 (for advanced pitch shifting)
- **Video Export**: WebCodecs API (browser-native)
- **State Management**: React hooks + localStorage-backed presets
- **Icons**: Phosphor Icons 2.1.7
- **Notifications**: Sonner 2.0.1 for toast messages

### Browser Requirements
- Modern browsers with Web Audio API support
- WebCodecs API support for video export (Chrome 94+, Edge 94+)
- Canvas API for waveform visualization

## Build, Run, and Test Commands

### Installation
```bash
npm install          # Install all dependencies
```

### Development
```bash
npm run dev          # Start development server (default: http://localhost:5173)
npm run kill         # Kill process on port 5000 (if needed for cleanup)
```

### Building
```bash
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build locally
npm run optimize     # Run Vite dependency pre-bundling optimization
```

### Testing
```bash
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode (for development)
npm run test:coverage # Generate coverage report
```

**Test Coverage**: Currently 79 tests across 10 test files covering:
- Audio processing utilities
- Video export and codec detection
- Feature-specific logic (audio-player, effects)
- Custom hooks (use-audio-processor)

### Linting and Formatting
```bash
npm run lint         # Run ESLint (Note: eslint.config.js needs to be created)
```

**Current Status**: ESLint is configured in package.json but `eslint.config.js` file is missing. The project uses:
- ESLint 9.28.0 with TypeScript support
- eslint-plugin-react-hooks 5.2.0
- eslint-plugin-react-refresh 0.4.19

**Code Style Conventions**:
- TypeScript strict mode enabled
- Prefer functional components with hooks
- Use `@/` path alias for src imports
- Import order: React → External libs → Internal components → Types → Styles
- No unnecessary comments (code should be self-documenting)
- Match existing patterns in the codebase

## Testing Guidelines

### Test Organization
- Test files located alongside source files in `__tests__/` directories
- Test file naming: `<component-name>.test.ts(x)`
- Use Vitest with happy-dom environment for DOM testing
- Mock Web Audio API using `web-audio-test-api` package

### Writing Tests
- Focus on behavior, not implementation details
- Test user interactions and state changes
- Mock external dependencies (audio context, file system)
- Keep tests isolated and independent
- Use descriptive test names that explain expected behavior

### Running Tests
- Tests run automatically on GitHub Actions for PRs and pushes
- All tests must pass before merging
- Aim to maintain or improve test coverage with new features

## Security Practices

### General Guidelines
- Never commit secrets or API keys to source code
- Validate user inputs, especially file uploads
- Handle audio context suspend/resume securely
- Follow responsible disclosure for security issues (see `SECURITY.md`)

### Audio/Video Processing
- Validate file types before processing (audio-player feature handles this)
- Limit file sizes to prevent memory issues
- Use OfflineAudioContext for exports to prevent blocking UI
- Handle codec errors gracefully with fallback options

### Third-Party Dependencies
- Dependabot configured for automatic security updates
- Review dependency updates before merging
- Prefer well-maintained packages with active communities

## Common Pitfalls and Solutions

### Audio Context Issues
**Problem**: Audio doesn't play after loading a file  
**Solution**: Audio context starts in "suspended" state and requires user interaction. Always check `audioContext.state` and call `audioContext.resume()` after user gesture.

**Problem**: "The AudioContext was not allowed to start"  
**Solution**: Browser autoplay policies require user interaction. Ensure audio playback is triggered by a user action (click, tap).

### Buffer Management
**Problem**: "Cannot reuse AudioBufferSourceNode"  
**Solution**: Buffer source nodes are one-time-use. Create a new source node for each playback in the audio graph.

### State Synchronization
**Problem**: Audio playing but UI not updating  
**Solution**: Ensure state updates are connected to audio events. Use refs for audio nodes, state for UI-relevant values.

### Build Issues
**Problem**: Large chunk size warning during build  
**Solution**: Expected behavior due to Tone.js and Web Audio API polyfills. Consider dynamic imports for features used less frequently if bundle size becomes critical.

### Video Export
**Problem**: "Codec not supported" error  
**Solution**: Platform-dependent codec availability (e.g., AAC not available on Linux). The app automatically detects and falls back to Opus or Vorbis. Inform users about codec limitations.

## Contributing Guidelines

### Before Starting Work
1. Check existing issues and PRs to avoid duplicates
2. For large changes, create a refactoring plan (see `REFACTORING_WORKFLOW.md`)
3. Discuss major architectural changes in issues first

### Development Workflow
1. Create a feature branch from `dev` (use format: `feature/<name>` or `fix/<name>`)
2. Make small, focused commits with clear messages
3. Run tests frequently: `npm run test:watch`
4. Ensure build succeeds: `npm run build`
5. Update documentation if adding features or changing APIs

### Pull Request Process
1. Open PR against `dev` branch (not `main`)
2. Include clear description of changes and motivation
3. Reference related issues with `Fixes #<issue-number>`
4. Ensure CI passes (tests, build)
5. Address review feedback promptly
6. Squash commits if requested before merge

### Code Review Guidelines
- Check that changes follow feature-based architecture
- Verify no cross-feature imports (features should be isolated)
- Look for potential audio context lifecycle issues
- Ensure proper error handling and user feedback
- Confirm tests cover new behavior

## Release Process

### Versioning
1. Update version: `npm version <patch|minor|major>`
2. Push branch and tags: `git push && git push --tags`
3. GitHub Action automatically builds and publishes release
4. Release notes generated from git tag annotation

### Version Display
- Version shown in app footer via `src/lib/version.ts`
- Links to specific GitHub release (or releases page for dev builds)
- Build hash (Git SHA) displayed for traceability

## Additional Resources

- **PRD**: See `PRD.md` for product requirements and feature specifications
- **Architecture**: See `REFACTOR_PLAN.md` for completed refactoring documentation
- **Workflows**: See `.github/REFACTORING_WORKFLOW.md` for large-scale refactoring process
- **Security**: See `SECURITY.md` for security policies and reporting
- **Issues**: Check existing issues before creating new ones