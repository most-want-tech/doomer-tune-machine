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