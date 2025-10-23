# 🚀 Quick Setup - YouTube Feature

## Step 1: Create Token
→ https://github.com/settings/tokens/new?scopes=public_repo

- Name: `Doomer Tune Machine - YouTube Conversion`
- Scope: ✅ `public_repo`
- Click: "Generate token"
- **Copy token immediately!**

## Step 2: Create .env.local
```bash
cp .env.example .env.local
```

## Step 3: Add Token
Edit `.env.local`:
```env
VITE_GITHUB_TOKEN=ghp_your_token_here
```

## Step 4: Restart Server
```bash
npm run dev
```

## ✅ Test
1. Paste YouTube URL
2. Click "Convert"
3. Should work without 401 errors!

---

**Full Guide**: `docs/YOUTUBE_SETUP_GUIDE.md`  
**Troubleshooting**: `YOUTUBE_FIX_SUMMARY.md`
