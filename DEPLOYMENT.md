# 🚀 Deployment Guide for SnapMod

## Quick Deploy to Vercel (5 minutes)

### Step 1: Get Your OpenRouter API Key

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up or log in
3. Navigate to **Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-or-v1-...`)

### Step 2: Deploy to Vercel

#### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/renatodap/snapmod&env=OPENROUTER_API_KEY&envDescription=Your%20OpenRouter%20API%20key%20for%20Nano%20Banana%20access)

1. Click the button above
2. Sign in to Vercel (or create an account)
3. Give your project a name
4. Add your `OPENROUTER_API_KEY` when prompted
5. Click **Deploy**
6. Wait 2-3 minutes for deployment
7. **Done!** Your app is live 🎉

#### Option B: Manual Deploy

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click **Add New** → **Project**

2. **Import Repository**
   - Select **Import Git Repository**
   - Choose `renatodap/snapmod` from your GitHub
   - Click **Import**

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```
   - Click **Add** to save

5. **Deploy**
   - Click **Deploy**
   - Wait 2-3 minutes
   - Your app will be live at `https://your-project.vercel.app`

### Step 3: Test Your Deployment

1. Open your deployed URL
2. Click **Take Photo** or **Upload Photo**
3. Select one or more filters
4. Click **Apply Filters**
5. Download or share your result!

## 📱 PWA Installation

### For Users:

**On iOS (Safari):**
1. Open your deployed URL in Safari
2. Tap the **Share** button
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**
5. The app icon appears on your home screen!

**On Android (Chrome):**
1. Open your deployed URL in Chrome
2. Tap the **menu** (three dots)
3. Tap **Add to Home Screen** or **Install App**
4. Tap **Install**
5. The app appears in your app drawer!

**On Desktop (Chrome/Edge):**
1. Open your deployed URL
2. Look for the **install icon** in the address bar (⊕)
3. Click **Install**
4. The app opens as a standalone window!

## 🎨 Adding Custom Icons

The project needs custom PWA icons. Create these files:

### Required Icons:
- `public/icons/icon-192.png` (192x192px)
- `public/icons/icon-512.png` (512x512px)
- `public/favicon.ico`

### Quick Icon Generation:

1. **Use a free tool**:
   - [Favicon.io](https://favicon.io/) - Generate from text/image
   - [RealFaviconGenerator](https://realfavicongenerator.net/) - All formats

2. **Create a simple icon**:
   - Use a blue gradient background (#2563eb)
   - Add a white sparkle/camera icon
   - Or use the text "SM" in bold white letters

3. **Place in the project**:
   ```
   public/
     ├── icons/
     │   ├── icon-192.png
     │   └── icon-512.png
     └── favicon.ico
   ```

4. **Commit and push**:
   ```bash
   git add public/icons public/favicon.ico
   git commit -m "Add PWA icons"
   git push
   ```

Vercel will auto-deploy the update!

## ⚙️ Environment Variables

### Required:
- `OPENROUTER_API_KEY` - Your OpenRouter API key (required)

### Optional:
- `VERCEL_URL` - Automatically set by Vercel (no action needed)

### How to Update:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update or add variables
5. Click **Save**
6. Redeploy: **Deployments** → **...** → **Redeploy**

## 🔧 Custom Domain Setup

1. **Buy a domain** (e.g., from Namecheap, GoDaddy)

2. **Add to Vercel**:
   - Go to **Settings** → **Domains**
   - Click **Add**
   - Enter your domain (e.g., `snapmod.app`)
   - Follow DNS configuration instructions

3. **Update DNS** (at your domain registrar):
   - Add the provided DNS records
   - Wait 24-48 hours for propagation

4. **Done!** Your app will be live at your custom domain with HTTPS!

## 📊 Monitoring & Analytics

### Check Usage:

1. **Vercel Analytics**:
   - Go to your project dashboard
   - Click **Analytics** tab
   - See visitor stats, performance

2. **OpenRouter Usage**:
   - Log in to [openrouter.ai](https://openrouter.ai)
   - Check **Usage** tab
   - Monitor API calls and costs

### Set Budget Alerts:

1. Go to OpenRouter **Settings**
2. Set a monthly budget limit
3. Enable email alerts
4. Avoid surprise bills!

## 🐛 Troubleshooting

### "Image generation failed"
- **Check** your `OPENROUTER_API_KEY` is correct
- **Verify** you have credits on OpenRouter
- **Check** Vercel function logs

### "Camera access denied"
- **Must use** HTTPS (Vercel provides this automatically)
- **User must** grant camera permission in browser

### Build fails on Vercel
- **Check** all dependencies are in `package.json`
- **Ensure** TypeScript has no errors
- **View** build logs in Vercel dashboard

### PWA not installing
- **Ensure** icons exist in `public/icons/`
- **Check** `manifest.json` is valid
- **Clear** browser cache and reload

## 📈 Performance Tips

1. **Enable Vercel Analytics** (free tier available)
2. **Monitor OpenRouter costs** regularly
3. **Set rate limits** if needed (in API route)
4. **Use IndexedDB caching** (already implemented!)
5. **Compress images** before uploading (auto-handled)

## 🔒 Security Best Practices

- ✅ Never commit `.env.local` (already in `.gitignore`)
- ✅ Use Edge Functions for API calls (already implemented)
- ✅ Validate user input (already implemented)
- ✅ Keep dependencies updated: `npm update`
- ✅ Enable Vercel's security headers

## 📦 Updates & Maintenance

### Deploy Updates:

1. Make your changes locally
2. Test with `npm run dev`
3. Commit: `git commit -am "Your changes"`
4. Push: `git push`
5. Vercel auto-deploys! ✨

### Keep Dependencies Updated:

```bash
npm update
npm audit fix
git commit -am "Update dependencies"
git push
```

## 🎉 Success!

Your SnapMod PWA is now live! Share it with friends:

- 📱 Works on mobile and desktop
- 🚀 Installs like a native app
- 🤖 Powered by Gemini 2.5 Flash Image
- 💾 Smart caching for fast edits
- 🔒 Privacy-first design

**Need help?** Open an issue on GitHub!

---

Made with ❤️ using Next.js + Nano Banana
