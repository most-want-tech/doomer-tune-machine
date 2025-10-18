# Refactoring Workflow Guide

## Overview
This document outlines the standard workflow for major refactoring tasks in the Doomer Tune Machine project.

---

## 🎯 When to Use This Workflow

Use this workflow for:
- Large component refactoring (>500 lines)
- Architecture changes
- Feature extraction/reorganization
- Performance optimizations requiring structural changes
- Migration to new patterns or libraries

---

## 📋 Step-by-Step Workflow

### 1. **Create Refactoring Plan Document**

Create a detailed plan document in the root directory:

```bash
# Example: REFACTOR_PLAN.md
touch REFACTOR_PLAN_[FEATURE_NAME].md
```

**Plan should include:**
- Current state analysis (problems identified)
- Refactoring objectives
- Proposed architecture/folder structure
- Implementation phases (broken into reviewable chunks)
- Success metrics (LOC reduction, performance, testability)
- Best practices applied with references
- Migration strategy
- Completion criteria

**Template:** See `REFACTOR_PLAN.md` for reference

---

### 2. **Create GitHub Issue**

Create a comprehensive GitHub issue:

**Title Format:**
```
[REFACTOR] <Component/Feature Name>: <Brief Description>
```

**Example:**
```
[REFACTOR] App.tsx: Break down monolithic component into feature-based architecture
```

**Issue Template:**

```markdown
## 📊 Problem Statement
[Describe the current issues: size, complexity, maintainability concerns]

## 🎯 Goals
[List specific, measurable goals]

## 📁 Proposed Solution
[High-level architecture overview - link to detailed plan]

## 📝 Implementation Phases
- [ ] Phase 1: [Description] - Estimated: X hours
- [ ] Phase 2: [Description] - Estimated: X hours
- [ ] Phase 3: [Description] - Estimated: X hours
[etc.]

## 📚 References
- Link to detailed plan: [REFACTOR_PLAN.md](./REFACTOR_PLAN.md)
- Best practices documentation
- Related issues/PRs

## ✅ Acceptance Criteria
- [ ] All phases completed
- [ ] Tests passing
- [ ] No regressions
- [ ] Documentation updated
- [ ] Code reviewed
```

**Labels to Add:**
- `refactor`
- `enhancement`
- `documentation`
- Priority label (`priority: high`, `priority: medium`, etc.)

**Assign:**
- Assignee: Developer responsible
- Project: Link to project board (if applicable)
- Milestone: Target release (if applicable)

---

### 3. **Create Feature Branch**

Branch naming convention:
```bash
refactor/<scope>-<brief-description>

# Examples:
git checkout -b refactor/app-component-architecture
git checkout -b refactor/phase-1-layout-components
git checkout -b refactor/effects-feature-extraction
```

**For multi-phase refactors:**
```bash
# Create main refactor branch
git checkout -b refactor/app-component-architecture

# Create phase branches
git checkout -b refactor/phase-1-layout-components
git checkout -b refactor/phase-2-audio-player
# etc.
```

---

### 4. **Link Issue to Branch**

In the GitHub issue, reference the branch:
```markdown
Branch: `refactor/app-component-architecture`
```

Or use GitHub's development sidebar to link the branch.

---

### 5. **Implementation - Incremental Approach**

**For each phase:**

1. **Create phase branch** (if multi-phase)
   ```bash
   git checkout -b refactor/phase-X-description
   ```

2. **Implement changes**
   - Follow the plan document
   - Keep commits atomic and descriptive
   - Update tests as you go

3. **Commit with clear messages**
   ```bash
   git commit -m "refactor(phase-1): extract layout components
   
   - Create AppHeader component
   - Create AppFooter component
   - Update App.tsx to use new components
   - Reduces App.tsx by 30 lines
   
   Part of #[ISSUE_NUMBER]"
   ```

4. **Push and create PR**
   ```bash
   git push origin refactor/phase-X-description
   ```

5. **PR Template:**
   ```markdown
   ## Phase X: [Description]
   
   Part of #[ISSUE_NUMBER]
   
   ### Changes
   - [List specific changes]
   
   ### Files Created
   - `path/to/file1.tsx`
   - `path/to/file2.tsx`
   
   ### Files Modified
   - `src/App.tsx` (-XX lines)
   
   ### Testing
   - [ ] Manual testing completed
   - [ ] Unit tests added/updated
   - [ ] No regressions found
   
   ### Checklist
   - [ ] Follows project coding standards
   - [ ] Documentation updated
   - [ ] No console errors/warnings
   - [ ] Linting passes
   - [ ] Builds successfully
   ```

6. **Review and merge**
   - Request review from team
   - Address feedback
   - Merge when approved
   - Delete phase branch

7. **Update main issue**
   - Check off completed phase
   - Update progress comments

---

### 6. **Testing Strategy**

For each phase:

**Manual Testing:**
- [ ] App runs without errors
- [ ] All existing features work
- [ ] No visual regressions
- [ ] Performance is same or better

**Automated Testing:**
- [ ] Add unit tests for extracted components
- [ ] Add unit tests for extracted hooks
- [ ] Update integration tests if needed
- [ ] Run full test suite: `npm test`

**Performance Testing:**
- [ ] Check bundle size: `npm run build`
- [ ] Test in production mode
- [ ] Profile rendering performance (React DevTools)

---

### 7. **Documentation Updates**

Update relevant documentation:

- [ ] README.md (if architecture changes)
- [ ] .github/copilot-instructions.md (if patterns change)
- [ ] Component documentation/Storybook
- [ ] API documentation (if interfaces change)
- [ ] Update CHANGELOG.md

---

### 8. **Final Integration**

After all phases completed:

1. **Final testing**
   ```bash
   npm run build
   npm run test
   npm run lint
   ```

2. **Update metrics in issue**
   - LOC reduction achieved
   - Number of components created
   - Test coverage improved
   - Build size changes

3. **Close issue with summary**
   ```markdown
   ## ✅ Refactor Complete
   
   ### Results
   - App.tsx: 894 → 120 lines (86.5% reduction)
   - Components created: 25
   - Test coverage: 45% → 72%
   - Bundle size: -3KB
   
   ### Phases Completed
   - [x] Phase 1: Layout Components
   - [x] Phase 2: Audio Player
   - [x] Phase 3: Effects
   - [x] Phase 4: Presets
   - [x] Phase 5: Export
   - [x] Phase 6: Waveform
   - [x] Phase 7: Final Cleanup
   
   All acceptance criteria met. Deployed in v2.0.0.
   ```

4. **Tag release** (if appropriate)
   ```bash
   git tag -a v2.0.0 -m "Major refactor: Feature-based architecture"
   git push origin v2.0.0
   ```

---

## 🎨 Commit Message Convention

Follow conventional commits for refactoring:

```
refactor(<scope>): <brief description>

[Optional body with more details]
[Optional breaking changes]

[Footer with issue references]
```

**Examples:**
```bash
refactor(app): extract audio player feature components

- Create AudioUpload, PlaybackControls, VolumeControl
- Extract useAudioPlayer hook
- Reduce App.tsx by 150 lines

Relates to #42

---

refactor(effects): create generic EffectControl component

Replace 10 duplicate effect controls with single reusable component.
Reduces duplication by ~200 lines.

BREAKING CHANGE: EffectControl now requires 'info' prop

Closes #42, Part 3/7
```

---

## 🔍 Code Review Checklist

**For Reviewers:**

- [ ] Follows the refactoring plan
- [ ] No functionality broken
- [ ] Code is more maintainable than before
- [ ] Tests added/updated appropriately
- [ ] No performance regressions
- [ ] Documentation updated
- [ ] Follows project conventions (.github/copilot-instructions.md)
- [ ] TypeScript types properly defined
- [ ] No new console warnings/errors
- [ ] Accessible (ARIA attributes, keyboard nav)

---

## 🚨 Rollback Strategy

If issues arise after merge:

1. **Identify the problematic phase/commit**
2. **Option A: Fix forward** (preferred for small issues)
   ```bash
   git checkout -b hotfix/refactor-regression
   # Make fixes
   git commit -m "fix: resolve regression from refactor"
   ```

3. **Option B: Revert** (for major issues)
   ```bash
   git revert <commit-hash>
   # or
   git revert <phase-pr-merge-commit>
   ```

4. **Update issue with findings**
   - Document what went wrong
   - Plan improvements for next refactor

---

## 📊 Success Metrics Template

Track before/after metrics:

```markdown
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines of Code (main file) | XXX | YYY | -Z% |
| Number of Components | X | Y | +Z |
| Cyclomatic Complexity | X | Y | -Z% |
| Test Coverage | X% | Y% | +Z% |
| Bundle Size | X KB | Y KB | ±Z KB |
| Build Time | X s | Y s | ±Z s |
| ESLint Warnings | X | Y | -Z |
```

---

## 🔗 Resources

- [Bulletproof React - Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [React Design Patterns](https://github.com/michelebertoli/react-design-patterns-and-best-practices)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Atomic Commits](https://www.freshconsulting.com/insights/blog/atomic-commits/)

---

## 📝 Workflow Checklist

Use this checklist for each refactoring project:

- [ ] Create detailed plan document
- [ ] Create GitHub issue with labels and assignee
- [ ] Create feature branch
- [ ] Link issue to branch
- [ ] For each phase:
  - [ ] Create phase branch
  - [ ] Implement changes
  - [ ] Write tests
  - [ ] Create PR
  - [ ] Code review
  - [ ] Merge
  - [ ] Update issue
- [ ] Final testing
- [ ] Update documentation
- [ ] Update metrics
- [ ] Close issue
- [ ] Tag release (if appropriate)

---

## 💡 Tips for Success

1. **Break it down**: Smaller phases are easier to review and safer to merge
2. **Test continuously**: Don't wait until the end to test
3. **Document as you go**: Update docs with each phase
4. **Communicate**: Keep team informed of progress and blockers
5. **Be patient**: Good refactoring takes time; don't rush
6. **Celebrate wins**: Acknowledge progress after each phase

---

**Last Updated:** October 17, 2025  
**Version:** 1.0.0
