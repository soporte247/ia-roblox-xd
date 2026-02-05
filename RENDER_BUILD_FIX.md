# Render Deployment - Manual Configuration Required

**Status:** Build failed because Render Build Command needs manual update in dashboard

## Problem
```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'mini-lemonade/ai-beta/requirements.txt'
```

## Root Cause
The Build Command in Render Dashboard hasn't been updated since the beta model was integrated. The requirements.txt file EXISTS in the repository (commit ff29b6e), but Render needs the explicit build command to find it.

## Solution - Update Render Dashboard NOW

1. **Go to:** https://dashboard.render.com
2. **Select Service:** datashark-ia2
3. **Click:** Settings → Build & Deploy
4. **Update Build Command field:**
   ```
   pip install -r mini-lemonade/ai-beta/requirements.txt && npm install --prefix mini-lemonade/backend
   ```
5. **Verify Start Command is:**
   ```
   node start-combined.js
   ```
6. **Verify Environment Variables exist:**
   - `BETA_MODEL_BASE_URL=http://localhost:8000`
   - `BETA_MODEL_API_KEY=` (empty or your API key)
   - `BETA_MODEL_NAME=datashark-beta`

7. **Click:** Manual Deploy (or wait for auto-deploy on next push)

## Important Notes

- ⚠️ The **Build Command must be in the Render Dashboard UI**, NOT in Procfile
- ✅ Procfile now correctly contains only: `web: node ./start-combined.js`
- ✅ Repository has been pushed (commit ff29b6e)
- ✅ requirements.txt is tracked in git
- 🤖 The model server will automatically start on port 8000
- 🌐 The backend will automatically start on port 3000

## Current Repository Status

**Latest Commit:** ff29b6e  
**Files Changed:** build.sh (new)  
**Changes:** Added build.sh script for debugging, updated requirements.txt tracking  

**Commit History:**
```
ff29b6e Fix Render build: Add build.sh script and ensure requirements.txt is tracked
678f7f8 Add Lua dataset (20+ Roblox systems) and vocab updater - 4-5/10 expertise
9e5a979 Fix Procfile: Build Command must be set in Render dashboard, not in Procfile
```

## Next Steps

1. ✅ **Complete:** Repository updated (commit ff29b6e)
2. ⏳ **Required:** Update Render Dashboard with Build Command
3. ⏳ **Required:** Click Manual Deploy button
4. ⏳ **Verify:** Check health endpoint after deploy
   ```
   curl https://datashark-ia2.onrender.com/api/health
   ```

---

**Need Help?** The build.sh script is included for manual testing on Render if needed.
