# SnapMod - AI Photo Filters PWA

A production-ready, mobile-first Progressive Web App (PWA) that leverages **Nano Banana** (Gemini 2.5 Flash Image via OpenRouter) for AI-powered photo editing and generation.

![SnapMod](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)

## ✨ Features

- 🤖 **AI-Powered Filters**: 14+ creative filters powered by Gemini 2.5 Flash Image
- 📸 **Camera & Upload**: Take photos directly or upload existing images
- 💾 **Smart Caching**: IndexedDB caching for instant repeat edits
- 🎨 **Filter Categories**: Retro, Lighting, Color, Art, and Creative styles
- 📱 **PWA Ready**: Install to home screen, works offline for cached images
- 🔒 **Privacy First**: All images processed securely
- ⚡ **Edge Functions**: Fast API proxy with Vercel Edge Runtime
- 🎭 **Beautiful UI**: Framer Motion animations and smooth interactions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenRouter API Key ([get one here](https://openrouter.ai))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/renatodap/snapmod.git
   cd snapmod
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_actual_key_here
   VERCEL_URL=http://localhost:3000
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub** (if you haven't already)
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variable: `OPENROUTER_API_KEY`
   - Click "Deploy"

3. **Done!** Your app will be live at `https://your-project.vercel.app`

### Manual Deployment

```bash
npm run build
npm start
```

## 🎨 Available Filters

### Retro
- **1970s Vintage**: Warm peachy tones with authentic film stock look
- **Film Camera**: Analog film with light leaks and grain

### Lighting
- **Golden Hour**: Warm sunset glow with soft backlighting
- **High Contrast**: Bold dramatic look with deep shadows
- **Soft Light**: Dreamy ethereal atmosphere

### Color
- **Black & White**: Timeless monochrome aesthetic
- **Pop Art**: Bold posterized colors
- **Cool Tone**: Calm blue/cyan tones
- **Warm Tone**: Cozy orange/red tones

### Art
- **Oil Painting**: Brush strokes and paint texture
- **Watercolor**: Soft blended edges and color washes
- **Pencil Sketch**: Hand-drawn graphite aesthetic

### Creative
- **Cyberpunk**: Neon colors and futuristic vibes
- **Dreamy**: Magical fantasy feel with soft focus

## 🏗️ Architecture

```
/app
  /page.tsx                 # Main UI
  /layout.tsx              # PWA meta, manifest
  /api
    /nano-banana
      /route.ts            # Edge Function for OpenRouter
/components                # (Future components)
/lib
  /filter-presets.ts       # 14+ filter configurations
  /cache-manager.ts        # IndexedDB operations
  /image-utils.ts          # Compression, format conversion
/hooks
  /useNanoBanana.ts        # Main generation hook
  /useImageCache.ts        # Cache management
/public
  /manifest.json           # PWA manifest
  /icons/                  # App icons
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI Model**: Google Gemini 2.5 Flash Image (via OpenRouter)
- **Storage**: IndexedDB
- **Deployment**: Vercel Edge Functions

## 📱 PWA Features

- **Install to Home Screen**: Works like a native app
- **Offline Support**: View cached images without internet
- **Camera Access**: Direct camera integration
- **Share API**: Native sharing on mobile devices
- **Responsive Design**: Optimized for all screen sizes

## 🔑 API Keys

You need an OpenRouter API key to use this app:

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Get your API key from the dashboard
4. Add it to `.env.local` as `OPENROUTER_API_KEY`

**Note**: OpenRouter charges per API call. Check their pricing page for current rates.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **OpenRouter** for API access to Gemini models
- **Google** for the Gemini 2.5 Flash Image model
- **Vercel** for hosting and Edge Functions
- **Next.js** team for the amazing framework

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Contact the maintainers

---

Made with ❤️ using Nano Banana (Gemini 2.5 Flash Image)
