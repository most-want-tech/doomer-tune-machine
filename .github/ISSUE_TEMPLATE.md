# GitHub Issue Template

**Copy and paste this into GitHub Issue:**

---

## 📊 Problem Statement

The main `App.tsx` component has grown to **894 lines** and has become a monolithic component that violates the Single Responsibility Principle. It currently handles:

- File upload UI and drag/drop functionality
- Audio playback controls
- Real-time audio effects management (10+ different effects)
- Preset saving/loading with KV storage
- Audio export to WAV
- Video export with image overlay
- Waveform visualization

This creates several issues:
- **Maintainability**: Difficult to navigate and understand 894 lines in a single file
- **Testability**: Hard to test components in isolation
- **Reusability**: UI patterns are duplicated but not extracted
- **Collaboration**: Merge conflicts more likely with everyone working in one file
- **Performance**: Harder to optimize when concerns are mixed

## 🎯 Goals

Following industry best practices from **Bulletproof React** and **React Design Patterns**:

1. ✅ Reduce `App.tsx` from **894 lines to ~120 lines** (86% reduction)
2. ✅ Implement **feature-based architecture** with 5 main feature modules
3. ✅ Extract **20+ reusable components** from duplicated UI patterns
4. ✅ Create **custom hooks** for business logic separation
5. ✅ Improve **testability** with 15+ independently testable units
6. ✅ Reduce **state complexity** from 13 useState hooks to ~3 in main component
7. ✅ Establish **clear separation of concerns** (UI, logic, state, side effects)

## 📁 Proposed Solution

### High-Level Architecture

Transform from monolithic component to **feature-based architecture**:

```
src/
├── features/
│   ├── audio-player/      # File upload, playback controls, volume
│   ├── effects/           # Effects panel with 10+ effect controls
│   ├── presets/           # Save/load preset functionality
│   ├── export/            # Audio & video export features
│   └── waveform/          # Waveform visualization
├── components/
│   └── layout/            # App header and footer
└── App.tsx                # Main orchestrator (~120 lines)
```

Each feature is self-contained with:
- `components/` - UI components
- `hooks/` - Custom hooks for state/logic
- `types.ts` - TypeScript interfaces
- `constants/` - Static data/configuration

### Key Improvements

**1. Component Extraction**
- Generic `EffectControl` component eliminates ~200 lines of duplication
- Reusable `ExportProgress` for both audio and video exports
- Dedicated components for each major UI section

**2. Custom Hooks**
- `useAudioPlayer` - Encapsulate playback state
- `usePresets` - Abstract KV storage operations
- `useAudioExport` - Audio export logic
- `useVideoExport` - Video export logic

**3. Better Organization**
- Features can't import from each other (enforced by ESLint)
- Shared components in `components/`
- Clear import paths using `@/features/*`

## 📝 Implementation Phases

### ✅ Phase 1: Extract Layout Components
**Effort:** 1 hour | **Priority:** Low complexity

- [ ] Create `components/layout/app-header.tsx`
- [ ] Create `components/layout/app-footer.tsx`
- [ ] Update `App.tsx` to use new components

**Impact:** 2 files created, ~30 lines reduced

---

### 🎵 Phase 2: Extract Audio Player Feature
**Effort:** 2-3 hours | **Priority:** High - Core functionality

- [ ] Create `features/audio-player/` structure
- [ ] Extract `AudioUpload` component (file input + drag/drop)
- [ ] Extract `PlaybackControls` component
- [ ] Extract `VolumeControl` component
- [ ] Create `useAudioPlayer` hook
- [ ] Update imports in `App.tsx`

**Impact:** 6 files created, ~150 lines reduced

---

### 🎛️ Phase 3: Extract Effects Feature
**Effort:** 3-4 hours | **Priority:** High - Complex UI

- [ ] Create `features/effects/` structure
- [ ] Move `EFFECT_INFO` to `constants/effect-info.ts`
- [ ] Create generic `EffectControl` component
- [ ] Create `EffectPanel` container
- [ ] Create `EffectInfoTooltip` component
- [ ] Update `App.tsx`

**Impact:** 5 files created, ~300 lines reduced
**Benefit:** Single reusable component reduces massive duplication

---

### 💾 Phase 4: Extract Presets Feature
**Effort:** 2 hours | **Priority:** Medium

- [ ] Create `features/presets/` structure
- [ ] Create `usePresets` hook (KV storage)
- [ ] Extract `PresetSaveDialog` component
- [ ] Extract `PresetSelector` component
- [ ] Extract `PresetListItem` component
- [ ] Update `App.tsx`

**Impact:** 5 files created, ~100 lines reduced

---

### 📦 Phase 5: Extract Export Features
**Effort:** 3 hours | **Priority:** Medium-High

- [ ] Create `features/export/` structure
- [ ] Create `useAudioExport` hook
- [ ] Create `useVideoExport` hook
- [ ] Extract `AudioExport` component
- [ ] Extract `VideoExport` component
- [ ] Extract `ImageUploader` component
- [ ] Extract shared `ExportProgress` component
- [ ] Update `App.tsx`

**Impact:** 7 files created, ~250 lines reduced

---

### 📊 Phase 6: Extract Waveform Feature
**Effort:** 1 hour | **Priority:** Low - Already modular

- [ ] Create `features/waveform/` structure
- [ ] Create `WaveformPlayer` component
- [ ] Integrate existing `WaveformDisplay`
- [ ] Update `App.tsx`

**Impact:** 2 files created, ~40 lines reduced

---

### 🧹 Phase 7: Final App.tsx Cleanup
**Effort:** 1-2 hours | **Priority:** High - Final integration

- [ ] Remove all extracted code from `App.tsx`
- [ ] Keep only orchestration logic
- [ ] Clean up imports
- [ ] Add proper TypeScript interfaces
- [ ] Update documentation

**Impact:** Target achieved - ~120 lines final size

---

## 📏 Success Metrics

| Metric | Before | Target | Benefit |
|--------|--------|--------|---------|
| `App.tsx` LOC | 894 | ~120 | ✅ 86% reduction |
| Number of useState | 13 | ~3 | ✅ State encapsulation |
| Reusable Components | 3 | 20+ | ✅ Better composition |
| Testable Units | 1 | 15+ | ✅ Improved testing |
| Feature Folders | 0 | 5 | ✅ Clear organization |

## 📚 References

- **Detailed Plan:** [REFACTOR_PLAN.md](../blob/refactor/app-component-architecture/REFACTOR_PLAN.md)
- **Workflow Guide:** [.github/REFACTORING_WORKFLOW.md](../blob/refactor/app-component-architecture/.github/REFACTORING_WORKFLOW.md)
- [Bulletproof React - Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [React Design Patterns](https://github.com/michelebertoli/react-design-patterns-and-best-practices)
- [Project Copilot Instructions](.github/copilot-instructions.md)

## 🚀 Migration Strategy

**Approach:** Incremental, backward-compatible refactoring

- ✅ No breaking changes - app works after each phase
- ✅ One PR per phase (6 PRs total) for easy review
- ✅ Tests added for extracted components
- ✅ Clear commit messages following conventional commits

**Branch:** `refactor/app-component-architecture`

## ✅ Acceptance Criteria

- [ ] All 7 phases implemented
- [ ] `App.tsx` under 150 lines
- [ ] No linting errors
- [ ] All existing functionality works
- [ ] No performance regressions
- [ ] Documentation updated
- [ ] Team review and approval

---

**Total Estimated Effort:** 13-16 hours  
**Recommended Timeline:** 2-3 weeks  
**Risk Level:** Low (incremental approach)

---

## 🏷️ Labels to Add
- `refactor`
- `enhancement`
- `documentation`
- `priority: high`
- `good first issue` (for Phase 1)

## 👤 Assign To
@hstrejoluna (or your GitHub username)

## 📋 Project
Link to: `doomermixerplus` (if project board exists)
