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
- **Persistence**: Uses `@github/spark/hooks` `useKV()` for preset storage (not localStorage)
- **Effects interface**: `AudioEffects` type defines all effect parameters with sensible defaults in `DEFAULT_EFFECTS`

### Component Architecture
- `App.tsx`: Main component containing all UI and audio coordination logic
- `WaveformDisplay`: Canvas-based visualization that renders audio buffer waveform
- `src/components/ui/`: Shadcn/ui components using Radix primitives - follow existing patterns
- Effect controls use controlled inputs bound to effects state with immediate audio updates

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
1. Add parameter to `AudioEffects` interface with default value
2. Create/configure audio nodes in `initAudioContext()`
3. Add parameter handling in `updateEffects()` switch statement
4. Connect nodes in the audio chain appropriately
5. Add UI controls in `App.tsx` with effect info in `EFFECT_INFO`

## Key Dependencies & Integration

### GitHub Spark
- Uses `@github/spark` framework for enhanced React development
- Spark plugins in `vite.config.ts` handle icon imports and optimizations
- Import icons from `@phosphor-icons/react` (not Lucide despite shadcn config)

### UI System  
- Shadcn/ui components in "new-york" style with custom neutral color palette
- Tailwind config loads custom theme from `theme.json` (currently empty)
- CSS variables for theming in `src/styles/theme.css` 
- Use `@/` path alias for src imports

### Audio Libraries
- **NO external audio libraries** - uses native Web Audio API exclusively
- Canvas-based waveform rendering without external visualization libs
- Export uses `OfflineAudioContext` for non-realtime high-quality rendering

## File Organization Conventions

### Import Order
```tsx
// 1. React imports
// 2. External libraries (@github/spark, @radix-ui, etc)  
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
- Effect controls follow pattern: Label + Slider/Switch + Info tooltip
- All audio parameters immediately update via `updateEffects(effects)`
- Loading states and error handling use sonner toast notifications
- File uploads handled with hidden input + drag/drop on designated areas