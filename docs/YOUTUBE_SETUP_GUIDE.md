# YouTube to MP3 Feature Setup Guide

## Quick Start

To enable the YouTube to MP3 conversion feature, you need to configure a GitHub Personal Access Token.

### Step 1: Create GitHub Personal Access Token

1. **Visit GitHub Token Creation Page:**
   - Go to: https://github.com/settings/tokens/new?scopes=public_repo
   - Or manually: GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

2. **Configure Token:**
   - **Note**: `Doomer Tune Machine - YouTube Conversion`
   - **Expiration**: Choose based on your needs (30 days, 60 days, or No expiration)
   - **Scopes**: 
     - ✅ `public_repo` - Access public repositories (minimum required)
     - OR ✅ `repo` - Full control of private repositories (if repo is private)

3. **Generate and Copy:**
   - Click "Generate token" at the bottom
   - **Important**: Copy the token immediately - you won't be able to see it again!

### Step 2: Configure Environment Variables

1. **Create `.env.local` file** in the project root:
   ```bash
   touch .env.local
   ```

2. **Add your token** to `.env.local`:
   ```env
   VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   
   Replace `ghp_xxx...` with your actual token from Step 1.

3. **Verify file is git-ignored**:
   - `.env.local` is already in `.gitignore`
   - This ensures your token is never committed to version control

### Step 3: Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Start it again
npm run dev
```

## Verification

1. **Check Console**: Open browser DevTools Console
   - ✅ **Good**: No GitHub authentication warnings
   - ❌ **Bad**: Warning about missing `VITE_GITHUB_TOKEN`

2. **Test Conversion**:
   - Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
   - Click "Convert"
   - Should see progress bar and successful conversion

## Troubleshooting

### "No GitHub token configured" Warning

**Problem**: The environment variable is not loaded.

**Solutions**:
1. Ensure `.env.local` exists in project root (same directory as `package.json`)
2. Restart the dev server (`npm run dev`)
3. Check the variable name is exactly `VITE_GITHUB_TOKEN` (case-sensitive)
4. Ensure there are no spaces around the `=` sign

### "Failed to trigger workflow: 401 Unauthorized"

**Problem**: Token is invalid or has insufficient permissions.

**Solutions**:
1. **Verify token scopes**:
   - Visit: https://github.com/settings/tokens
   - Find your token, ensure `public_repo` or `repo` scope is checked
2. **Regenerate token** if expired or revoked
3. **Check token format**: Should start with `ghp_` for personal access tokens

### "Failed to trigger workflow: 404 Not Found"

**Problem**: Workflow file doesn't exist or branch is incorrect.

**Solutions**:
1. Ensure you're on the correct branch (check `github-converter.ts` line 68)
2. Verify workflow file exists: `.github/workflows/youtube-to-mp3.yml`
3. Check repository name matches: `most-want-tech/doomer-tune-machine`

### Token Showing in Browser DevTools

**Problem**: Token appears in Network tab or Console.

**Solutions**:
- This is expected in development - Octokit logs are visible
- In production builds, tokens should be managed server-side
- For client-side usage, ensure `.env.local` is never committed

## Production Deployment

### Option 1: Vercel/Netlify Environment Variables

1. Go to your deployment platform's dashboard
2. Navigate to Environment Variables settings
3. Add: `VITE_GITHUB_TOKEN` = `your_token_here`
4. Redeploy the application

### Option 2: GitHub Actions Secrets

For GitHub Pages deployment:

1. Go to Repository Settings → Secrets and variables → Actions
2. Add new repository secret:
   - Name: `VITE_GITHUB_TOKEN`
   - Value: Your GitHub token
3. Update `.github/workflows/deploy.yml` to pass the secret to build:
   ```yaml
   - name: Build
     run: npm run build
     env:
       VITE_GITHUB_TOKEN: ${{ secrets.VITE_GITHUB_TOKEN }}
   ```

### Option 3: Backend Proxy (Recommended for Production)

For better security, create a backend endpoint that:
1. Stores the token server-side
2. Proxies requests to GitHub API
3. Validates origin and rate-limits requests

Example architecture:
```
Client App → Your Backend API → GitHub API
(no token)   (token stored     (authenticated)
              securely)
```

## Security Best Practices

### ✅ Do's

- ✅ Store tokens in `.env.local` for development
- ✅ Use environment variables for production
- ✅ Use minimal required scopes (`public_repo`)
- ✅ Set token expiration dates
- ✅ Rotate tokens periodically (every 90 days)
- ✅ Revoke tokens when no longer needed

### ❌ Don'ts

- ❌ Never commit `.env.local` to Git
- ❌ Never share tokens in screenshots or bug reports
- ❌ Never use tokens with excessive permissions
- ❌ Never hardcode tokens in source code
- ❌ Never use personal tokens in production (use GitHub Apps instead)

## Alternative: GitHub App Authentication

For production applications, consider creating a GitHub App:

**Benefits:**
- More secure than personal access tokens
- Better rate limits
- Granular permissions
- Auditable access

**Setup:**
1. Create GitHub App: https://github.com/settings/apps/new
2. Install on repository
3. Use app authentication with Octokit

See: https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps

## Support

If you continue to experience issues:

1. Check GitHub API status: https://www.githubstatus.com/
2. Review GitHub Actions logs in repository
3. Open an issue with:
   - Error message (redact token if visible)
   - Browser console logs
   - Steps to reproduce

## Resources

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Octokit Authentication](https://github.com/octokit/octokit.js#authentication)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [GitHub Apps vs OAuth Apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)
