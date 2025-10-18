# App.tsx Refactoring Plan

## 📊 Current State Analysis

**File:** `src/App.tsx`  
**Lines of Code:** 894 lines  
**Status:** Monolithic component with multiple concerns

### Problems Identified:
1. **Single Responsibility Violation**: Main component handles file upload, audio playback, effects management, preset management, video export, and audio export
2. **Poor Maintainability**: 894 lines in one file makes navigation and updates difficult
3. **Low Reusability**: UI patterns repeated but not extracted into reusable components
4. **Testing Challenges**: Large component is harder to test in isolation
5. **State Management**: Multiple related state variables scattered throughout component

---

## 🎯 Refactoring Objectives

Following industry best practices from **Bulletproof React** and **React Design Patterns**:

1. **Feature-Based Architecture**: Organize by feature domains (audio, video, presets, effects)
2. **Component Extraction**: Create smaller, focused, reusable components
3. **Custom Hooks**: Extract business logic into dedicated hooks
4. **Separation of Concerns**: Separate UI, state management, and side effects
5. **Improved Testability**: Each module independently testable

---

## 📁 Proposed Architecture

### New Folder Structure
```
src/
├── features/
│   ├── audio-player/
│   │   ├── components/
│   │   │   ├── audio-upload.tsx        # File upload UI + drag/drop
│   │   │   ├── playback-controls.tsx   # Play/Pause/Stop/Seek controls
│   │   │   └── volume-control.tsx      # Volume slider
│   │   ├── hooks/
│   │   │   └── use-audio-player.ts     # Playback state management
│   │   └── types.ts
│   │
│   ├── effects/
│   │   ├── components/
│   │   │   ├── effect-control.tsx      # Single effect slider/switch
│   │   │   ├── effect-panel.tsx        # Effects grid container
│   │   │   └── effect-info-tooltip.tsx # Info tooltip component
│   │   ├── constants/
│   │   │   └── effect-info.ts          # EFFECT_INFO metadata
│   │   └── types.ts
│   │
│   ├── presets/
│   │   ├── components/
│   │   │   ├── preset-selector.tsx     # Load preset dropdown
│   │   │   ├── preset-save-dialog.tsx  # Save preset modal
│   │   │   └── preset-list-item.tsx    # Individual preset display
│   │   ├── hooks/
│   │   │   └── use-presets.ts          # Preset CRUD operations
│   │   └── types.ts
│   │
│   ├── export/
│   │   ├── components/
│   │   │   ├── audio-export.tsx        # Audio export UI
│   │   │   ├── video-export.tsx        # Video export UI
│   │   │   ├── image-uploader.tsx      # Image upload for video
│   │   │   └── export-progress.tsx     # Shared progress component
│   │   ├── hooks/
│   │   │   ├── use-audio-export.ts     # Audio export logic
│   │   │   └── use-video-export.ts     # Video export logic
│   │   └── types.ts
│   │
│   └── waveform/
│       ├── components/
│       │   └── waveform-player.tsx     # Waveform + time display
│       └── types.ts
│
├── components/
│   └── layout/
│       ├── app-header.tsx              # App title and description
│       └── app-footer.tsx              # Footer component
│
└── App.tsx                              # Main orchestrator (< 150 lines)
```

---

## 🔨 Implementation Phases

### **Phase 1: Extract Layout Components** ✅
**Estimated Effort:** 1 hour  
**Priority:** Low complexity, immediate organization win

**Tasks:**
- [ ] Create `components/layout/app-header.tsx`
- [ ] Create `components/layout/app-footer.tsx`
- [ ] Update `App.tsx` to use new components

**Files Created:** 2  
**Lines Reduced:** ~30

---

### **Phase 2: Extract Audio Player Feature** 🎵
**Estimated Effort:** 2-3 hours  
**Priority:** High - Core functionality

**Tasks:**
- [ ] Create `features/audio-player/` structure
- [ ] Extract `AudioUpload` component (file input + drag/drop)
- [ ] Extract `PlaybackControls` component (play/pause/stop)
- [ ] Extract `VolumeControl` component
- [ ] Create `useAudioPlayer` hook for playback state
- [ ] Update imports in `App.tsx`

**Files Created:** 6  
**Lines Reduced:** ~150

---

### **Phase 3: Extract Effects Feature** 🎛️
**Estimated Effort:** 3-4 hours  
**Priority:** High - Complex UI with many controls

**Tasks:**
- [ ] Create `features/effects/` structure
- [ ] Extract `EFFECT_INFO` constant to `constants/effect-info.ts`
- [ ] Create `EffectControl` generic component (slider/switch + label + tooltip)
- [ ] Create `EffectPanel` container component
- [ ] Create `EffectInfoTooltip` component
- [ ] Update `App.tsx` to use new components

**Files Created:** 5  
**Lines Reduced:** ~300

**Benefits:**
- Single reusable `EffectControl` component reduces duplication
- Easy to add new effects by adding to metadata

---

### **Phase 4: Extract Presets Feature** 💾
**Estimated Effort:** 2 hours  
**Priority:** Medium

**Tasks:**
- [ ] Create `features/presets/` structure
- [ ] Create `usePresets` hook (encapsulate KV storage logic)
- [ ] Extract `PresetSaveDialog` component
- [ ] Extract `PresetSelector` component
- [ ] Extract `PresetListItem` component
- [ ] Update `App.tsx`

**Files Created:** 5  
**Lines Reduced:** ~100

---

### **Phase 5: Extract Export Features** 📦
**Estimated Effort:** 3 hours  
**Priority:** Medium-High

**Tasks:**
- [ ] Create `features/export/` structure
- [ ] Create `useAudioExport` hook
- [ ] Create `useVideoExport` hook
- [ ] Extract `AudioExport` component
- [ ] Extract `VideoExport` component
- [ ] Extract `ImageUploader` component
- [ ] Extract `ExportProgress` shared component
- [ ] Update `App.tsx`

**Files Created:** 7  
**Lines Reduced:** ~250

---

### **Phase 6: Extract Waveform Feature** 📊
**Estimated Effort:** 1 hour  
**Priority:** Low - Already somewhat modular

**Tasks:**
- [ ] Create `features/waveform/` structure
- [ ] Create `WaveformPlayer` component (waveform + time display)
- [ ] Integrate existing `WaveformDisplay` component
- [ ] Update `App.tsx`

**Files Created:** 2  
**Lines Reduced:** ~40

---

### **Phase 7: Final App.tsx Cleanup** 🧹
**Estimated Effort:** 1-2 hours  
**Priority:** High - Final integration

**Tasks:**
- [ ] Remove all extracted code from `App.tsx`
- [ ] Keep only high-level orchestration logic
- [ ] Ensure clean imports from feature modules
- [ ] Add proper PropTypes/TypeScript interfaces
- [ ] Update documentation

**Target:** `App.tsx` reduced to ~100-150 lines  
**Current:** 894 lines  
**Reduction:** ~84% 🎉

---

## 📏 Success Metrics

| Metric | Before | Target | Benefit |
|--------|--------|--------|---------|
| `App.tsx` LOC | 894 | ~120 | ✅ 86% reduction |
| Number of useState | 13 | ~3 | ✅ State encapsulation |
| Reusable Components | 3 | 20+ | ✅ Better composition |
| Testable Units | 1 | 15+ | ✅ Improved testing |
| Feature Folders | 0 | 5 | ✅ Clear organization |

---

## 🎓 Best Practices Applied

### 1. **Feature-Based Architecture** (Bulletproof React)
- Each feature folder is self-contained
- Features can import from shared modules but not from each other
- Clear boundaries prevent coupling

### 2. **Component Composition** (React Design Patterns)
- Extract rendering functions into components
- Use `children` prop for composition
- Prefer small, focused components

### 3. **Custom Hooks Pattern**
- Extract stateful logic into hooks
- Promote reusability and testing
- Separate concerns (UI vs. logic)

### 4. **Separation of Concerns**
- UI components in `components/`
- Business logic in `hooks/`
- Constants in `constants/`
- Types in `types.ts`

### 5. **DRY Principle**
- Generic `EffectControl` component eliminates ~200 lines of duplication
- Shared `ExportProgress` for audio and video exports

---

## 🚀 Migration Strategy

### Approach: **Incremental, Backward-Compatible Refactoring**

1. **No Breaking Changes**: App continues to work after each phase
2. **Feature Flags**: Can run old and new code side-by-side temporarily
3. **Test Coverage**: Add tests for extracted components before removing from `App.tsx`
4. **Git Strategy**: 
   - One PR per phase (6 PRs total)
   - Easy to review and revert if needed
   - Clear commit messages

### Development Workflow:
```bash
# Phase 1
git checkout -b refactor/phase-1-layout-components
# ... implement Phase 1
git commit -m "refactor: extract layout components (Phase 1)"
git push origin refactor/phase-1-layout-components
# ... create PR, review, merge

# Phase 2
git checkout -b refactor/phase-2-audio-player
# ... implement Phase 2
# ... repeat
```

---

## 📝 Additional Improvements

### Optional Enhancements (Future):
1. **State Management Library**: Consider Zustand or Jotai if state becomes complex
2. **Form Validation**: Add Zod schema validation for effect parameters
3. **Error Boundaries**: Wrap each feature with error boundary
4. **Storybook**: Document components in Storybook
5. **Unit Tests**: Add Vitest tests for hooks and utilities
6. **E2E Tests**: Add Playwright tests for critical user flows

---

## 🏁 Completion Criteria

- [ ] All 7 phases implemented
- [ ] `App.tsx` under 150 lines
- [ ] No linting errors
- [ ] All existing functionality works
- [ ] No performance regressions
- [ ] Documentation updated
- [ ] Team review and approval

---

## 📚 References

- [Bulletproof React - Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [React Design Patterns - Component Architecture](https://github.com/michelebertoli/react-design-patterns-and-best-practices)
- [Kent C. Dodds - Application State Management](https://kentcdodds.com/blog/application-state-management-with-react)
- [Copilot Instructions](.github/copilot-instructions.md)

---

**Total Estimated Effort:** 13-16 hours  
**Recommended Timeline:** 2-3 weeks (spread across sprints)  
**Risk Level:** Low (incremental approach minimizes risk)
