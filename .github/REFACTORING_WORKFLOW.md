# Feature Development Workflow

## Overview
This document outlines the standard workflow for all feature development, bug fixes, and improvements in the Doomer Tune Machine project. This workflow applies to both small features and large refactoring tasks.

---

## 🎯 When to Use This Workflow

Use this workflow for:
- **New features** - Adding audio effects, UI components, export formats
- **Bug fixes** - Addressing reported issues or edge cases
- **Refactoring** - Improving code structure (>500 lines)
- **Performance optimizations** - Speed improvements or bundle size reduction
- **Architecture changes** - Pattern migrations or structural updates
- **Documentation** - Significant documentation additions or updates

**Core Principle:** Every change starts with an issue, gets its own branch, and follows a consistent process.

---

## 📋 Step-by-Step Workflow

### 1. **Identify & Plan the Work**

Before creating an issue, understand what needs to be done:

**For Features:**
- What problem does this solve?
- What's the user benefit?
- Are there design mockups or requirements?

**For Refactoring/Large Changes:**
- Create a detailed plan document (optional but recommended):
  ```bash
  # Example: REFACTOR_PLAN.md, FEATURE_PLAN.md
  touch PLAN_[FEATURE_NAME].md
  ```
  
**Plan should include:**
- Current state / problem statement
- Objectives / goals
- Proposed solution / architecture
- Implementation approach (phases if large)
- Success criteria / acceptance criteria
- References / best practices

**Template:** See `REFACTOR_PLAN.md` for a comprehensive example

---

### 2. **Create GitHub Issue**

Go to GitHub and create a new issue describing the work:

**Navigate to:**
```
https://github.com/most-want-tech/doomer-tune-machine/issues/new
```

**Title Format:**
```
[TYPE] Brief descriptive title

Types:
- [FEATURE] - New functionality
- [BUG] - Bug fix
- [REFACTOR] - Code improvements
- [DOCS] - Documentation
- [PERF] - Performance improvements
```

**Examples:**
```
[FEATURE] Add vinyl crackle effect to audio processor
[BUG] Waveform display not updating on seek
[REFACTOR] App.tsx: Break down into feature-based architecture
[PERF] Optimize audio buffer rendering
```

**Issue Template:**

```markdown
## 📊 Description
[Clear description of the feature, bug, or improvement]

## 🎯 Goals / Why
[What problem does this solve? What's the benefit?]

## 📁 Proposed Solution (if applicable)
[High-level approach or implementation idea]

## 📝 Tasks / Checklist
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## 📚 References (if applicable)
- Link to plan document (if created)
- Related issues or PRs
- External documentation

## ✅ Acceptance Criteria
- [ ] Feature works as described
- [ ] Tests added/updated
- [ ] No regressions
- [ ] Documentation updated
```

**Add Labels:**
Choose appropriate labels based on the work:
- Type: `feature`, `bug`, `refactor`, `documentation`, `performance`
- Priority: `priority: high`, `priority: medium`, `priority: low`
- Status: `good first issue`, `help wanted` (if applicable)

**Assign:**
- **Assignee:** Yourself or team member responsible
- **Project:** `doomermixerplus` (if using project boards)
- **Milestone:** Target release version (if applicable)

---

### 3. **Create Feature Branch**

Start from the latest code on your default branch (usually `main` or `dev`):

```bash
# Make sure you're up to date
git checkout dev  # or main
git pull origin dev

# Create your feature branch
git checkout -b <type>/<brief-description>
```

**Branch Naming Convention:**
```
<type>/<scope>-<brief-description>

Types:
- feature/  - New features
- fix/      - Bug fixes
- refactor/ - Code refactoring
- docs/     - Documentation
- perf/     - Performance improvements
- test/     - Adding tests
```

**Examples:**
```bash
git checkout -b feature/vinyl-crackle-effect
git checkout -b fix/waveform-seek-bug
git checkout -b refactor/app-component-architecture
git checkout -b docs/api-documentation
git checkout -b perf/optimize-audio-rendering
```

**For multi-phase work:**
```bash
# Create main branch for the feature
git checkout -b refactor/app-component-architecture

# Create sub-branches for each phase (branch from main branch)
git checkout -b refactor/phase-1-layout-components
git checkout -b refactor/phase-2-audio-player
# etc.
```

---

### 4. **Link Branch to Issue**

There are several ways to link your branch to the GitHub issue:

**Option A: Use GitHub UI** (Easiest)
1. Go to your issue on GitHub
2. Look for "Development" in the right sidebar
3. Click "Create a branch" or "Link a branch"
4. Select your existing branch

**Option B: Reference in Commit Message**
Include the issue number in your commit messages:
```bash
git commit -m "feat: add vinyl crackle effect

Adds configurable vinyl crackle to audio processor.

Closes #42"
```

**Option C: Reference in Issue Comment**
Comment on the issue:
```markdown
Working on this in branch: `feature/vinyl-crackle-effect`
```

**Option D: Use Branch Naming with Issue Number**
```bash
git checkout -b feature/42-vinyl-crackle-effect
# GitHub automatically links branches with issue numbers
```

---

### 5. **Implement the Work**

Now you're ready to code! Follow these best practices:

**Implementation Guidelines:**

1. **Keep commits atomic and descriptive**
   - Each commit should be a logical unit of work
   - One feature/fix per commit when possible
   - Commit frequently to save progress

2. **Write clear commit messages**
   ```bash
   git commit -m "type(scope): brief description
   
   - Detailed change 1
   - Detailed change 2
   - Detailed change 3
   
   References #[ISSUE_NUMBER]"
   ```

3. **Test as you go**
   - Don't wait until the end to test
   - Run tests locally: `npm test`
   - Test in the browser: `npm run dev`
   - Check for console errors

4. **Keep your branch updated**
   ```bash
   # Periodically sync with dev/main to avoid conflicts
   git checkout dev
   git pull origin dev
   git checkout your-feature-branch
   git merge dev
   # Or use rebase: git rebase dev
   ```

5. **Push your changes regularly**
   ```bash
   # First time pushing the branch
   git push -u origin feature/your-branch-name
   
   # Subsequent pushes
   git push
   ```

### 6. **Create Pull Request**

When your work is ready for review, create a Pull Request:

**Navigate to GitHub:**
```
https://github.com/most-want-tech/doomer-tune-machine/pulls
```

Or use the link GitHub provides when you push:
```bash
git push
# Output includes: "Create a pull request for 'your-branch' on GitHub by visiting: [URL]"
```

**PR Title Format:**
```
[TYPE] Brief description (references #ISSUE)

Examples:
[FEATURE] Add vinyl crackle effect (#42)
[FIX] Resolve waveform seek bug (#38)
[REFACTOR] Phase 1: Extract layout components (#55)
```

**PR Description Template:**
```markdown
## Description
Brief summary of what this PR does.

Closes #[ISSUE_NUMBER]

## Changes
- Specific change 1
- Specific change 2
- Specific change 3

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Performance improvement

## Testing
- [ ] Manual testing completed
- [ ] Unit tests added/updated
- [ ] All tests passing (`npm test`)
- [ ] No console errors/warnings
- [ ] Tested in development mode

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed my code
- [ ] Commented complex logic
- [ ] Documentation updated (if needed)
- [ ] No new warnings/errors
- [ ] Builds successfully (`npm run build`)

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

**Request Review:**
- Assign reviewers (team members)
- Add labels matching the issue
- Link to the original issue
- Add to project board (if applicable)

**Address Feedback:**
- Respond to review comments
- Make requested changes
- Push updates to the same branch
- Re-request review when ready

**Merge:**
- Wait for approval from reviewers
- Ensure CI/CD checks pass
- Use "Squash and merge" or "Merge commit" based on project preference
- Delete the branch after merging (GitHub will prompt you)

### 7. **Post-Merge Cleanup**

After your PR is merged:

1. **Update local repository**
   ```bash
   git checkout dev  # or main
   git pull origin dev
   ```

2. **Delete local branch** (optional but recommended)
   ```bash
   git branch -d feature/your-branch-name
   ```

3. **Update the issue**
   - GitHub should auto-close if you used "Closes #XX" in PR
   - If not, manually close the issue
   - Add final comments if needed

4. **Celebrate! 🎉**
   - You've successfully contributed to the project
   - Your changes are now in the main codebase

---

### 8. **Testing Strategy**

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

### 9. **Documentation Updates**

Update relevant documentation:

- [ ] README.md (if architecture changes)
- [ ] .github/copilot-instructions.md (if patterns change)
- [ ] Component documentation/Storybook
- [ ] API documentation (if interfaces change)
- [ ] Update CHANGELOG.md

---

## 🔄 Complete Workflow Summary

**Quick Reference:**

```
1. Plan         → Understand what needs to be done
2. Issue        → Create GitHub issue with details
3. Branch       → Create feature branch from dev/main
4. Code         → Implement changes with atomic commits
5. Test         → Test thoroughly as you develop
6. Push         → Push changes to GitHub
7. PR           → Create Pull Request with description
8. Review       → Address feedback from reviewers
9. Merge        → Merge when approved
10. Cleanup     → Update local repo, close issue
```

**Visual Flow:**
```
┌─────────────┐
│   Plan      │ Think through the solution
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Issue     │ Document on GitHub (#42)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Branch    │ git checkout -b feature/my-feature
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Code      │ Make changes, commit often
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Push      │ git push -u origin feature/my-feature
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   PR        │ Create Pull Request
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Review    │ Team reviews & provides feedback
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Merge     │ Approved → Merged to dev/main
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Complete!  │ Issue closed, feature shipped! 🎉
└─────────────┘
```

---

## 🎓 Additional Workflows

### For Large Features/Refactors

When working on something that takes multiple PRs:

**Real Example: App.tsx Refactoring (✅ Completed December 2024)**

See `REFACTOR_PLAN.md` for the complete case study of successfully refactoring App.tsx from 894 → 111 lines through 7 phases with zero breaking changes.

**Create an Epic/Parent Issue:**
```markdown
## Epic: App.tsx Refactoring

Breaking down the monolithic App.tsx into feature modules.

### Sub-tasks:
- [ ] #43 - Phase 1: Layout components
- [ ] #44 - Phase 2: Audio player feature
- [ ] #45 - Phase 3: Effects feature
- [ ] #46 - Phase 4: Presets feature
- [ ] #47 - Phase 5: Export features
- [ ] #48 - Phase 6: Waveform feature
- [ ] #49 - Phase 7: Final cleanup

### Overall Progress: 0/7 phases complete
```

**Create Individual Issues for Each Phase:**
- Each phase gets its own issue
- Each phase gets its own branch
- Each phase gets its own PR
- Reference the parent issue in each sub-issue

**Branch Strategy:**
```bash
# Main feature branch (long-lived)
git checkout -b refactor/app-component-architecture

# Phase branches (merge back to main feature branch)
git checkout -b refactor/phase-1-layout-components
# Work, commit, push, PR → merge to refactor/app-component-architecture

git checkout refactor/app-component-architecture
git checkout -b refactor/phase-2-audio-player
# Work, commit, push, PR → merge to refactor/app-component-architecture
# ... repeat for all phases

# Finally merge main feature branch to dev
git checkout dev
git merge refactor/app-component-architecture
```

---

## 🚨 Common Scenarios

### Scenario: Found a Bug While Working

**Option A:** Fix it in the same branch (if related)
```bash
# Just commit the fix as part of your work
git commit -m "fix: resolve bug found during feature development"
```

**Option B:** Create a separate hotfix (if unrelated)
```bash
# Stash your current work
git stash

# Create hotfix branch from dev
git checkout dev
git checkout -b fix/critical-bug
# Fix the bug, commit, push, create PR

# Go back to your feature branch
git checkout feature/your-feature
git stash pop
```

### Scenario: Need to Update from Main Branch

```bash
# Your branch is behind dev/main
git checkout dev
git pull origin dev
git checkout feature/your-branch
git merge dev
# Resolve any conflicts
git commit -m "merge: update from dev"
git push
```

### Scenario: Made a Mistake in Last Commit

**Before pushing:**
```bash
# Undo last commit, keep changes
git reset --soft HEAD~1
# Make corrections
git add .
git commit -m "your corrected message"
```

**After pushing:**
```bash
# Make corrections
git add .
git commit -m "fix: correct previous commit"
git push
```

### Scenario: Want to Try Something Without Committing

```bash
# Save your current work
git stash

# Try something experimental
# ... make changes ...

# Discard experimental changes, restore your work
git checkout .
git stash pop
```

---

## 📊 Workflow Checklist

Use this checklist for each feature/task:

- [ ] **Plan**: Understand what needs to be done
- [ ] **Issue**: Create GitHub issue with clear description
- [ ] **Labels**: Add appropriate labels to issue
- [ ] **Assign**: Assign to yourself or team member
- [ ] **Branch**: Create feature branch with descriptive name
- [ ] **Link**: Link branch to issue
- [ ] **Code**: Implement changes with atomic commits
- [ ] **Test**: Test thoroughly (manual + automated)
- [ ] **Push**: Push changes to GitHub regularly
- [ ] **PR**: Create Pull Request with clear description
- [ ] **Review**: Address reviewer feedback
- [ ] **Merge**: Merge when approved
- [ ] **Cleanup**: Delete branch, update local repo
- [ ] **Close**: Ensure issue is closed

---

## 🎨 Commit Message Convention

Follow conventional commits for consistency:

**Format:**
```
<type>(<scope>): <brief description>

[Optional body with more details]
[Optional breaking changes]

[Footer with issue references]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `test` - Adding or updating tests
- `perf` - Performance improvements
- `chore` - Maintenance tasks (dependencies, config, etc.)

**Examples:**
```bash
feat(audio): add vinyl crackle effect

Adds configurable vinyl crackle to the audio processor.
Users can toggle it on/off in the effects panel.

Closes #42

---

fix(waveform): resolve seek position bug

Waveform now correctly updates when user seeks to a new position.
Previously would jump back to previous position.

Fixes #38

---

refactor(app): extract layout components

- Create AppHeader component with title and description
- Create AppFooter component with credits
- Update App.tsx to use new components
- Reduces App.tsx by 30 lines

Part of #55

---

docs(readme): update installation instructions

Add Node.js version requirement and troubleshooting section.

---

perf(audio): optimize buffer rendering

Reduces audio processing time by 40% through batch operations.

Closes #67
```

**Tips:**
- Keep subject line under 72 characters
- Use imperative mood ("add" not "added")
- Reference issues with `Closes #XX`, `Fixes #XX`, or `Part of #XX`
- Add body for non-trivial changes
- Use `BREAKING CHANGE:` footer for breaking changes

---

## 🔍 Code Review Checklist

**For Reviewers:**

### Functionality
- [ ] Code works as described in the PR
- [ ] No functionality broken
- [ ] Edge cases handled
- [ ] Error handling appropriate

### Code Quality
- [ ] Code is readable and maintainable
- [ ] Follows project conventions (see `.github/copilot-instructions.md`)
- [ ] No unnecessary complexity
- [ ] Proper TypeScript types used
- [ ] No commented-out code (unless explained)

### Testing
- [ ] Tests added/updated appropriately
- [ ] All tests passing
- [ ] Manual testing performed
- [ ] No regressions introduced

### Performance
- [ ] No obvious performance issues
- [ ] Bundle size impact acceptable
- [ ] No memory leaks

### Documentation
- [ ] Code comments for complex logic
- [ ] Documentation updated (if needed)
- [ ] README updated (if needed)
- [ ] CHANGELOG updated (if needed)

### Accessibility
- [ ] Keyboard navigation works
- [ ] ARIA attributes used correctly (if UI changes)
- [ ] Color contrast sufficient

### Security
- [ ] No sensitive data exposed
- [ ] Input validation present
- [ ] No security vulnerabilities introduced

---

## 🚨 Troubleshooting

### Merge Conflicts

```bash
# Update your branch with latest dev
git checkout dev
git pull origin dev
git checkout your-feature-branch
git merge dev

# If conflicts occur, Git will mark them in files
# Edit files to resolve conflicts
# Look for <<<<<<< HEAD markers

# After resolving
git add .
git commit -m "merge: resolve conflicts with dev"
git push
```

### Accidentally Committed to Wrong Branch

```bash
# If you haven't pushed yet
git log  # Note the commit hash
git reset --hard HEAD~1  # Undo the commit

# Switch to correct branch
git checkout correct-branch
git cherry-pick <commit-hash>  # Apply that commit here
```

### Need to Undo Pushed Changes

```bash
# Create a revert commit (safe, recommended)
git revert <commit-hash>
git push

# Or force reset (dangerous, only if you're sure)
git reset --hard <commit-hash>
git push --force
```

### Lost Changes

```bash
# Find lost commits
git reflog

# Recover lost commit
git checkout <commit-hash>
git checkout -b recovery-branch
```

---

## � Quick Start Examples

### Example 1: Simple Bug Fix

```bash
# 1. Create issue on GitHub: "Waveform not updating on seek" (#38)

# 2. Create branch
git checkout dev
git pull
git checkout -b fix/waveform-seek-bug

# 3. Fix the bug, test it
# ... make changes ...
git add src/components/waveform-display.tsx
git commit -m "fix(waveform): resolve seek position bug

Waveform now correctly updates when user seeks.

Fixes #38"

# 4. Push and create PR
git push -u origin fix/waveform-seek-bug
# Click the GitHub link to create PR

# 5. After merge
git checkout dev
git pull
git branch -d fix/waveform-seek-bug
```

### Example 2: New Feature

```bash
# 1. Create issue on GitHub: "Add vinyl crackle effect" (#42)

# 2. Create branch
git checkout dev
git pull
git checkout -b feature/vinyl-crackle-effect

# 3. Implement feature with multiple commits
git add src/audio/audio-effects.ts
git commit -m "feat(audio): add vinyl crackle effect processor"

git add src/App.tsx src/hooks/use-audio-processor.ts
git commit -m "feat(ui): add vinyl crackle toggle to effects panel"

git add tests/audio-effects.test.ts
git commit -m "test(audio): add tests for vinyl crackle effect"

# 4. Push and create PR
git push -u origin feature/vinyl-crackle-effect
# Create PR on GitHub

# 5. After approval and merge
git checkout dev
git pull
git branch -d feature/vinyl-crackle-effect
```

---

## 📚 Resources

- [GitHub Flow Documentation](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Atomic Commits](https://www.freshconsulting.com/insights/blog/atomic-commits/)
- [Git Best Practices](https://www.git-scm.com/book/en/v2)
- [Writing Good Pull Requests](https://github.blog/2015-01-21-how-to-write-the-perfect-pull-request/)
- Project Guidelines: `.github/copilot-instructions.md`

---

## 💡 Tips for Success

1. **Start small**: Don't try to do too much in one PR
2. **Commit often**: Save your progress with atomic commits
3. **Test early**: Don't wait until the end to test
4. **Communicate**: Update issue with progress, blockers
5. **Ask questions**: When stuck, ask in PR comments or team chat
6. **Review your own PR**: Check your changes before requesting review
7. **Be responsive**: Address review feedback promptly
8. **Learn from feedback**: Use reviews as learning opportunities
9. **Keep PRs focused**: One feature/fix per PR
10. **Document decisions**: Explain "why" in comments and PRs

---

**Last Updated:** October 18, 2025  
**Version:** 2.0.0 - General Feature Development Workflow
