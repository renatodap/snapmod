# 🔧 Troubleshooting Guide - SnapMod PWA

## ✅ Recent Fixes Applied

### Build Issues - RESOLVED ✅
- ❌ **Issue:** Invalid `turbo` experimental config
- ✅ **Fixed:** Removed invalid turbo configuration from `next.config.js`
- ✅ **Result:** Clean build with no warnings

### PWA Configuration - COMPLETED ✅
- ✅ Service Worker (`/public/sw.js`) created
- ✅ Service Worker registration component added
- ✅ Manifest.json properly configured
- ✅ PWA meta tags in layout

### Routing - VERIFIED ✅
- ✅ Main route `/` - Homepage (static)
- ✅ API route `/api/nano-banana` - Edge Function (dynamic)
- ✅ 404 page `/_not-found` - Error handling

---

## 🚨 Common 404 Error Causes & Solutions

### 1. Wrong Vercel Root Directory

**Symptom:** 404 on all pages after deployment

**Check:**
```bash
# Verify repository structure
git clone https://github.com/renatodap/snapmod.git
cd snapmod
ls -la  # Should show app/, package.json, etc. at root
```

**Fix in Vercel Dashboard:**
1. Go to Project **Settings** → **General**
2. Find **Root Directory** setting
3. Should be empty or `./`
4. If set to anything else, **clear it**
5. Save and redeploy

**Fix via Vercel CLI:**
```bash
cd cameraai
vercel --prod
# When prompted for root directory, enter: .
```

### 2. Build Cache Issues

**Symptom:** Old build being deployed, changes not appearing

**Fix:**
1. Go to Vercel project → **Deployments**
2. Click **...** menu on latest deployment
3. Select **Redeploy**
4. Check "Use existing Build Cache" is **UNCHECKED**
5. Click **Redeploy**

### 3. Environment Variables Missing

**Symptom:** 500 error on `/api/nano-banana` route

**Check:**
```bash
# Test API endpoint directly
curl https://your-project.vercel.app/api/nano-banana \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","mode":"generate"}'
```

**Fix:**
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Add: `OPENROUTER_API_KEY=sk-or-v1-...`
3. Apply to: **Production, Preview, Development**
4. Redeploy

### 4. Service Worker Not Loading

**Symptom:** PWA install prompt doesn't appear

**Check:**
```javascript
// Open browser console on your deployed site
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

**Fix:**
1. Ensure HTTPS (Vercel provides this automatically)
2. Clear browser cache
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Check `/sw.js` loads: `https://your-project.vercel.app/sw.js`

### 5. Manifest.json 404

**Symptom:** PWA features not working, console shows manifest 404

**Check:**
Visit: `https://your-project.vercel.app/manifest.json`

**Should return:**
```json
{
  "name": "SnapMod - AI Photo Filters",
  "short_name": "SnapMod",
  ...
}
```

**Fix if missing:**
1. Verify `public/manifest.json` exists in repository
2. Commit and push if missing
3. Redeploy

---

## 🧪 Testing Checklist

### Local Testing
```bash
# Clean install
rm -rf node_modules .next
npm install

# Build
npm run build

# Test production build locally
npm start

# Open http://localhost:3000
```

### Deployment Testing

**1. Homepage Test**
- Visit: `https://your-project.vercel.app/`
- Should see: "AI Photo Magic" heading
- Should see: Two buttons (Take Photo, Upload Photo)

**2. API Test**
```bash
# Test Edge Function
curl https://your-project.vercel.app/api/nano-banana \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset",
    "mode": "generate",
    "aspectRatio": "1:1"
  }'
```

**3. PWA Test**
- Open site in Chrome/Edge
- Check for install icon (⊕) in address bar
- Click install
- App should open in standalone window

**4. Manifest Test**
- Visit: `/manifest.json`
- Should return valid JSON
- Chrome DevTools → Application → Manifest (should show details)

**5. Service Worker Test**
- Chrome DevTools → Application → Service Workers
- Should show "activated and is running"

---

## 🔍 Debugging Tools

### Vercel Logs
```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs your-project-url.vercel.app

# View function logs
vercel logs your-project-url.vercel.app --scope=functions
```

### Browser DevTools

**Check Service Worker:**
1. F12 → Application tab
2. Service Workers section
3. Should show: "activated and is running"

**Check Manifest:**
1. F12 → Application tab
2. Manifest section
3. Should show app name, icons, theme color

**Check Console:**
1. F12 → Console tab
2. Look for errors (red text)
3. Common errors:
   - Service Worker registration failed
   - Failed to load manifest
   - Network errors

### Lighthouse Audit
1. F12 → Lighthouse tab
2. Select: Progressive Web App
3. Click: Analyze page load
4. Check PWA score (should be 100%)

---

## 🚀 Deployment Best Practices

### Before Each Deploy
```bash
# 1. Clean build locally
npm run build

# 2. Test locally
npm start

# 3. Check for errors
npm run lint  # (if configured)

# 4. Commit and push
git add .
git commit -m "Describe changes"
git push

# 5. Vercel auto-deploys from main branch
```

### After Each Deploy
1. Visit production URL
2. Test main functionality:
   - Homepage loads
   - Can upload/capture image
   - Can select filters
   - API calls work
3. Check PWA features:
   - Install prompt appears
   - Service Worker active
   - Offline cache works (for cached images)

---

## 🆘 Still Getting 404?

### Quick Diagnosis

**Run these commands:**
```bash
# 1. Check repository structure
git ls-files | head -20

# Expected output should include:
# app/page.tsx
# app/layout.tsx
# app/api/nano-banana/route.ts
# package.json
# next.config.js

# 2. Check build output
npm run build 2>&1 | grep "Route"

# Expected output:
# ┌ ○ /
# ├ ○ /_not-found
# └ ƒ /api/nano-banana
```

### If Homepage Still 404s

**Option 1: Fresh Vercel Project**
1. Delete current Vercel project
2. Create new: https://vercel.com/new
3. Import: `renatodap/snapmod`
4. Root Directory: **Leave empty** (very important!)
5. Environment Variables: Add `OPENROUTER_API_KEY`
6. Deploy

**Option 2: Manual Deployment**
```bash
# Clone fresh
git clone https://github.com/renatodap/snapmod.git
cd snapmod

# Build locally to verify
npm install
npm run build

# Deploy with Vercel CLI
vercel --prod
```

**Option 3: Check Vercel Configuration**
1. Vercel Dashboard → Your Project
2. Settings → General
3. Verify:
   - Framework Preset: **Next.js**
   - Root Directory: **Empty** or `./`
   - Node.js Version: **18.x** or **20.x**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

---

## 📊 Expected Build Output

```
Route (app)
┌ ○ /                    ← Homepage (MUST be present)
├ ○ /_not-found          ← 404 page
└ ƒ /api/nano-banana     ← API endpoint

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

If you see this in build logs, routing is correct! ✅

---

## 📞 Getting More Help

**Check these resources:**
1. **Vercel Documentation:** https://vercel.com/docs
2. **Next.js Documentation:** https://nextjs.org/docs
3. **GitHub Issues:** https://github.com/renatodap/snapmod/issues

**When asking for help, provide:**
- Vercel deployment URL
- Build logs (from Vercel dashboard)
- Browser console errors (F12)
- Steps you've already tried

---

## ✅ Success Indicators

You know it's working when:

- ✅ Homepage loads with blue gradient background
- ✅ "SnapMod" header appears at top
- ✅ "AI Photo Magic" heading visible
- ✅ Two buttons: "Take Photo" and "Upload Photo"
- ✅ No console errors (F12)
- ✅ Install icon appears in browser
- ✅ `/manifest.json` returns valid JSON
- ✅ Service Worker shows as "activated"

**If you see all these, your PWA is working perfectly!** 🎉

---

Made with ❤️ using Next.js + Nano Banana
