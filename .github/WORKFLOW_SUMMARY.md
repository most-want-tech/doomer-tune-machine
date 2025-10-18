# Feature Development Workflow - Quick Reference

This is a simplified version of the complete workflow in `REFACTORING_WORKFLOW.md`

## 🎯 The Standard Flow

Every piece of work follows this pattern:

```
Plan → Issue → Branch → Code → Test → Push → PR → Review → Merge → Cleanup
```

---

## 📋 Step-by-Step

### 1. Create GitHub Issue

**URL:** https://github.com/most-want-tech/doomer-tune-machine/issues/new

**Title Examples:**
- `[FEATURE] Add vinyl crackle effect`
- `[BUG] Waveform not updating on seek`
- `[REFACTOR] Extract audio player components`

**What to include:**
- Clear description of what needs to be done
- Why it's needed
- Acceptance criteria (how you'll know it's done)

---

### 2. Create Branch

```bash
# Get latest code
git checkout dev
git pull origin dev

# Create your branch
git checkout -b <type>/<description>
```

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes  
- `refactor/` - Code improvements
- `docs/` - Documentation

**Examples:**
```bash
git checkout -b feature/vinyl-crackle-effect
git checkout -b fix/waveform-seek-bug
git checkout -b refactor/extract-audio-player
```

---

### 3. Do the Work

```bash
# Make your changes
# ... edit files ...

# Commit often
git add .
git commit -m "feat(audio): add vinyl crackle processor"

# Push to GitHub
git push -u origin feature/vinyl-crackle-effect
```

**Commit message format:**
```
<type>(scope): brief description

Types: feat, fix, refactor, docs, test, perf, chore
```

---

### 4. Create Pull Request

After pushing, GitHub will show a link to create a PR. Click it!

**PR Title:**
```
[FEATURE] Add vinyl crackle effect (#42)
```

**PR Description:**
- What changed
- Why you made the change
- How to test it
- Screenshots (if UI changed)

---

### 5. Get it Reviewed & Merged

- Request review from team
- Address any feedback
- Once approved, merge it
- GitHub will prompt you to delete the branch - do it!

---

### 6. Cleanup

```bash
# Switch back to dev and update
git checkout dev
git pull origin dev

# Delete your local branch (optional)
git branch -d feature/vinyl-crackle-effect
```

**Done! 🎉**

---

## 🔄 Quick Command Reference

```bash
# Start new work
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# Save your work
git add .
git commit -m "feat: add something"
git push

# Update from dev
git checkout dev
git pull origin dev
git checkout feature/my-feature
git merge dev

# Finish
# (create PR on GitHub, get approved, merge)
git checkout dev
git pull origin dev
git branch -d feature/my-feature
```

---

## 💡 Pro Tips

1. **Commit often** - Don't wait until everything is perfect
2. **Push regularly** - Backup your work to GitHub
3. **Test before PR** - Run `npm test` and `npm run dev`
4. **Small PRs** - Easier to review = faster to merge
5. **Link to issue** - Reference `#42` in commits and PR

---

## 📚 Need More Details?

See the complete workflow: `.github/REFACTORING_WORKFLOW.md`

---

**Version:** 1.0.0  
**Updated:** October 18, 2025
