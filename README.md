# SnapMod - AI Photo Filters PWA

A production-ready, mobile-first Progressive Web App (PWA) that leverages **Nano Banana** (Gemini 2.5 Flash Image via OpenRouter) for AI-powered photo editing and generation.

![SnapMod](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)

## ✨ Features

- 🤖 **AI-Powered Filters**: 14+ creative filters powered by Gemini 2.5 Flash Image
- 🎨 **Real-Time Lightroom Filters**: Unlimited manual adjustments (brightness, contrast, saturation, etc.)
- 📸 **Camera & Upload**: Take photos directly or upload existing images
- 💾 **Smart Caching**: IndexedDB caching for instant repeat edits
- 📱 **PWA Ready**: Install to home screen, works offline for cached images
- 🔒 **Privacy First**: All images processed securely
- ⚡ **Edge Functions**: Fast API proxy with Vercel Edge Runtime
- 🎭 **Beautiful UI**: Framer Motion animations and smooth interactions
- 🧪 **Fully Tested**: 75%+ test coverage with Vitest
- 📊 **Structured Logging**: Production-ready logging and monitoring
- ⚠️ **Robust Error Handling**: Comprehensive error handling at all layers

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

### Running Tests

```bash
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
npm run test:ui       # Open Vitest UI
```

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
  /page.tsx                 # Main UI (1,004 lines - to be refactored)
  /layout.tsx               # PWA meta, manifest
  /api
    /nano-banana/route.ts   # Edge Function for AI processing
    /stripe/*               # Payment processing
/components
  /editor/                  # Photo editing components
  /auth/                    # Authentication components
  /providers/               # React context providers
/lib
  /logger.ts                # Structured logging system
  /errors.ts                # Error hierarchy and types
  /api-response.ts          # API response helpers
  /config.ts                # Centralized configuration
  /tracing.ts               # Request tracing utilities
  /image-filters.ts         # Real-time filter processing
  /cache-manager.ts         # IndexedDB operations
  /image-utils.ts           # Compression, format conversion
  /usage-limits-supabase.ts # Usage tracking
  /types/                   # TypeScript type definitions
  /__tests__/               # Unit tests (49 tests, 100% passing)
/hooks
  /useNanoBanana.ts         # Main AI generation hook
  /useImageCache.ts         # Cache management
  /useKeyboardShortcuts.ts  # Power-user shortcuts
/docs
  /API.md                   # Complete API reference
  /ARCHITECTURE.md          # Architecture documentation
  /TESTING_GUIDE.md         # Testing guide (existing)
  /... (18 total docs)
/public
  /manifest.json            # PWA manifest
  /icons/                   # App icons
```

**See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.**

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion 12.23
- **Icons**: Lucide React

### Backend & Services
- **AI Model**: Google Gemini 2.5 Flash Image (via OpenRouter)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Storage**: IndexedDB (client-side)
- **Deployment**: Vercel Edge Functions

### Development
- **Testing**: Vitest + Testing Library
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Test Coverage**: 75%+ (49 tests passing)

## 📱 PWA Features

- **Install to Home Screen**: Works like a native app
- **Offline Support**: View cached images without internet
- **Camera Access**: Direct camera integration
- **Share API**: Native sharing on mobile devices
- **Responsive Design**: Optimized for all screen sizes

## 🔑 Environment Variables

Required environment variables:

```env
# OpenRouter API (for AI processing)
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase (for auth and database)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App URL (auto-set by Vercel)
VERCEL_URL=https://your-app.vercel.app
```

**Getting API Keys:**
- **OpenRouter**: [https://openrouter.ai](https://openrouter.ai)
- **Supabase**: [https://supabase.com](https://supabase.com)
- **Stripe**: [https://stripe.com](https://stripe.com)

**See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) and [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup guides.**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Write tests for your changes (`npm run test`)
4. Ensure tests pass (`npm run test:run`)
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### Development Guidelines

- Write tests for new features (target: 75% coverage)
- Use structured logging (`lib/logger.ts`)
- Follow error handling patterns (`lib/errors.ts`)
- Add JSDoc comments for public APIs
- Run `npm run test:coverage` before submitting PR

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **OpenRouter** for API access to Gemini models
- **Google** for the Gemini 2.5 Flash Image model
- **Vercel** for hosting and Edge Functions
- **Next.js** team for the amazing framework

## 📚 Documentation

- **[API Reference](docs/API.md)** - Complete API documentation
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design
- **[Testing Guide](TESTING_GUIDE.md)** - How to write and run tests
- **[Deployment Guide](DEPLOYMENT.md)** - Deployment instructions
- **[Supabase Setup](SUPABASE_SETUP.md)** - Database and auth setup
- **[Technical Summary](TECHNICAL_SUMMARY.md)** - Technical overview

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Check the [docs/](docs/) directory for guides
- Contact the maintainers

---

Made with ❤️ using Nano Banana (Gemini 2.5 Flash Image)
