# 🚀 Vercel Deployment Setup Guide

## ⚠️ Important: Correct Root Directory Configuration

The GitHub repository `renatodap/snapmod` **IS** the correct root directory. All project files are at the repository root.

### Step-by-Step Vercel Configuration

#### 1. Delete Existing Vercel Project (If Any)
If you already created a Vercel project and got a 404 error:
1. Go to your Vercel dashboard
2. Select the project
3. Go to **Settings** → **General**
4. Scroll to bottom and click **Delete Project**
5. Confirm deletion

#### 2. Create New Vercel Project

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in if needed

2. **Import Git Repository**
   - Click **Import Git Repository**
   - Select `renatodap/snapmod`
   - Click **Import**

3. **Configure Project** (CRITICAL STEP)

   **Framework Preset:**
   - Should auto-detect as **Next.js** ✅

   **Root Directory:**
   - Leave as `./` (DO NOT CHANGE)
   - The repository root is correct ✅

   **Build Settings:**
   - Build Command: `npm run build` (default) ✅
   - Output Directory: `.next` (default) ✅
   - Install Command: `npm install` (default) ✅

   **Node.js Version:**
   - 18.x or 20.x (automatic) ✅

4. **Environment Variables** (REQUIRED)

   Click **Add Environment Variable** and add:
   ```
   Key: OPENROUTER_API_KEY
   Value: sk-or-v1-your-actual-api-key-here
   ```

   **How to get OpenRouter API Key:**
   - Visit https://openrouter.ai
   - Sign up or log in
   - Go to **Keys** section
   - Click **Create Key**
   - Copy the key (starts with `sk-or-v1-`)

5. **Deploy**
   - Click **Deploy**
   - Wait 2-3 minutes
   - ✅ Your app will be live!

### 🔍 Troubleshooting

#### 404: NOT_FOUND Error

**Cause:** Vercel may have detected the wrong root directory or there are conflicting lockfiles.

**Solution 1: Check Root Directory**
1. Go to Vercel project **Settings**
2. Click **General**
3. Find **Root Directory** setting
4. Should be: `./` or empty (not set)
5. If it's set to something else, clear it
6. Redeploy

**Solution 2: Redeploy from Scratch**
1. Delete the Vercel project
2. In GitHub, verify files are at repository root (not in subdirectory)
3. Create new Vercel project following steps above

**Solution 3: Use Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project directory
cd cameraai

# Deploy
vercel

# Follow prompts
# Set root directory to current directory (.)
# Add OPENROUTER_API_KEY when prompted
```

#### Build Fails

**Error:** "Cannot find module 'next'"
- **Fix:** Ensure `package.json` has all dependencies
- Run locally: `npm install && npm run build`

**Error:** Tailwind/PostCSS issues
- **Fix:** Already resolved in latest commit ✅
- Ensure `@tailwindcss/postcss` is in dependencies

#### Runtime Errors

**Error:** "OPENROUTER_API_KEY is not defined"
- **Fix:** Add environment variable in Vercel settings
- Go to **Settings** → **Environment Variables**
- Add `OPENROUTER_API_KEY`
- Redeploy

### ✅ Verification Steps

After deployment, verify your app works:

1. **Homepage loads**
   - You see "AI Photo Magic" heading
   - "Take Photo" and "Upload Photo" buttons visible

2. **Camera Access** (on mobile/HTTPS)
   - Click "Take Photo"
   - Browser asks for camera permission
   - Grant permission
   - Camera feed appears

3. **File Upload**
   - Click "Upload Photo"
   - File picker opens
   - Select an image
   - Image displays with filters

4. **Filter Application**
   - Select one or more filters
   - Click "Apply Filters"
   - Loading progress shows
   - Edited image appears

5. **Download/Share**
   - Click "Save" downloads the image
   - Click "Share" opens native share dialog (mobile)

### 📊 Monitoring

**Check Build Logs:**
1. Go to Vercel dashboard
2. Select your project
3. Click **Deployments**
4. Click on latest deployment
5. View build logs and runtime logs

**Check Function Logs:**
1. In deployment details
2. Click **Functions** tab
3. View Edge Function logs for `/api/nano-banana`

**Monitor API Usage:**
1. Go to https://openrouter.ai
2. Check **Usage** dashboard
3. Monitor API calls and costs

### 🎯 Expected URLs

- **Production:** `https://your-project.vercel.app`
- **API Endpoint:** `https://your-project.vercel.app/api/nano-banana`
- **Manifest:** `https://your-project.vercel.app/manifest.json`

### 🔧 Advanced Configuration

#### Custom Domain
1. Go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions

#### Environment Variables for Different Environments
```
Production: Set in Vercel dashboard
Preview: Automatically inherits from Production
Development: Use .env.local locally
```

#### Performance Optimization
- ✅ Edge Functions already configured
- ✅ Image optimization disabled (Tailwind generates)
- ✅ Static generation where possible

### 📱 PWA Installation

Once deployed, users can install the PWA:

**iOS Safari:**
1. Open site
2. Tap Share button
3. Tap "Add to Home Screen"

**Android Chrome:**
1. Open site
2. Tap menu (⋮)
3. Tap "Install App"

**Desktop Chrome:**
1. Open site
2. Click install icon (⊕) in address bar
3. Click "Install"

### 🎉 Success Checklist

- [ ] Vercel project created
- [ ] Repository imported correctly
- [ ] Root directory is `./`
- [ ] OPENROUTER_API_KEY environment variable set
- [ ] Build completed successfully
- [ ] Homepage loads correctly
- [ ] Can upload/capture images
- [ ] Filters can be applied
- [ ] Images can be downloaded
- [ ] PWA manifest loads (check `/manifest.json`)

### 🆘 Still Having Issues?

**Double-check repository structure:**
```bash
git clone https://github.com/renatodap/snapmod.git
cd snapmod
ls -la
```

You should see:
- ✅ app/ directory
- ✅ package.json
- ✅ next.config.js
- ✅ tsconfig.json
- ✅ All core files at root

**Repository structure is CORRECT** if all these files are at the root level!

### 📞 Get Help

- Check Vercel documentation: https://vercel.com/docs
- Check Next.js documentation: https://nextjs.org/docs
- Open GitHub issue: https://github.com/renatodap/snapmod/issues

---

**Made with** ❤️ using Next.js + Nano Banana
