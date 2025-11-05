# Architecture Documentation

Comprehensive overview of SnapMod's technical architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Subsystems](#core-subsystems)
5. [Data Flow](#data-flow)
6. [Error Handling](#error-handling)
7. [Logging & Monitoring](#logging--monitoring)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)
10. [Security](#security)

---

## Overview

SnapMod is a Progressive Web App (PWA) for AI-powered photo editing built with Next.js 15, React 19, and TypeScript. It uses Google's Gemini 2.5 Flash Image model via OpenRouter for AI processing and Supabase for authentication and data storage.

### Key Features

- AI-powered photo editing (via Gemini 2.5 Flash Image)
- Real-time Lightroom-style filters (CPU/GPU accelerated)
- Offline-capable PWA with service worker
- Version history and comparison tools
- User authentication and Pro subscriptions
- Mobile-first responsive design

### Architecture Principles

1. **Separation of Concerns** - Clear boundaries between UI, business logic, and data
2. **Error Resilience** - Comprehensive error handling at all layers
3. **Performance First** - Optimized for mobile devices and slow networks
4. **Type Safety** - TypeScript everywhere with strict mode
5. **Testability** - Modular design enables unit and integration testing

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React Components (Presentational)            │  │
│  │  • PhotoEditor  • FilterPanel  • HistoryDrawer        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         React Hooks (Business Logic)                   │  │
│  │  • useNanoBanana  • useFilters  • useAuth             │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Utility Libraries                           │  │
│  │  • image-filters  • cache-manager  • logger           │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Client Storage                              │  │
│  │  • IndexedDB (images)  • localStorage (presets)       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┴───────────────────────────────────┐
│                    VERCEL EDGE NETWORK                        │
├─────────────────────────────────────────────────────────────  ┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Next.js API Routes (Edge Functions)        │  │
│  │  • /api/nano-banana  • /api/stripe/*                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Middleware & Infrastructure                    │  │
│  │  • Request tracing  • Rate limiting  • Error handling │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────┬─────────────────┬─────────────────────┘
                      │                 │
          ┌───────────┴──────┐    ┌────┴────────┐
          │                  │    │             │
┌─────────┴─────────┐  ┌────┴────▼──┐  ┌──────▼─────────┐
│   OpenRouter API   │  │  Supabase   │  │  Stripe API    │
│  (Gemini 2.5 Flash)│  │  (Auth, DB) │  │  (Payments)    │
└────────────────────┘  └─────────────┘  └────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.0+ | React framework with SSR/SSG |
| **React** | 19.2 | UI library |
| **TypeScript** | 5.9 | Type safety |
| **Tailwind CSS** | 4.1 | Styling |
| **Framer Motion** | 12.23 | Animations |
| **Lucide React** | 0.548 | Icons |

### Backend & Services

| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting & Edge Functions |
| **OpenRouter** | AI model proxy (Gemini 2.5 Flash Image) |
| **Supabase** | Authentication & PostgreSQL database |
| **Stripe** | Payment processing |
| **IndexedDB** | Client-side image storage |

### Development

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit testing |
| **Testing Library** | Component testing |
| **ESLint** | Code linting |
| **TypeScript** | Type checking |

---

## Core Subsystems

### 1. Image Processing Subsystem

**Location:** `/lib/image-filters.ts`, `/components/editor/FilterPanel.tsx`

**Two-Tier Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                    USER ADJUSTS FILTER                   │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
┌───────▼────────┐             ┌────────▼─────────┐
│   CSS FILTERS  │             │  CANVAS FILTERS  │
│  (Preview)     │             │  (Export)        │
│                │             │                  │
│  • Instant     │             │  • High Quality  │
│  • GPU accel   │             │  • Pixel-level   │
│  • <16ms       │             │  • 1-2 seconds   │
└────────────────┘             └──────────────────┘
```

**CSS Filters (Real-Time Preview):**
- Applied as CSS `filter` property
- GPU-accelerated
- Instant feedback (<16ms)
- Limited accuracy but very fast

**Canvas Filters (High-Quality Export):**
- Pixel-level manipulation
- Precise algorithms
- Higher quality
- Slower (1-2 seconds for large images)

**Filter Types:**
- **Exposure:** Brightness, Exposure, Contrast, Highlights, Shadows
- **Color:** Saturation, Vibrance, Temperature, Tint
- **Detail:** Clarity, Sharpness
- **Effects:** Vignette

### 2. AI Processing Subsystem

**Location:** `/app/api/nano-banana/route.ts`, `/hooks/useNanoBanana.ts`

**Flow:**

```
User Request → Rate Limiting → Validation → Cache Check
                                               │
                                      ┌────────┴─────────┐
                                      │                  │
                                   CACHE HIT          CACHE MISS
                                      │                  │
                                   Return            Call OpenRouter
                                   Cached               API
                                   Image                │
                                      │            Process Response
                                      │                  │
                                      │            Validate Image
                                      │                  │
                                      │              Cache Result
                                      │                  │
                                      └────────┬─────────┘
                                               │
                                          Return Image
```

**Key Components:**

1. **Rate Limiter** - 20 requests/minute per IP
2. **Request Validator** - Check prompt, image, mode
3. **Cache Manager** - IndexedDB with LRU eviction
4. **OpenRouter Client** - HTTP client with retry logic
5. **Response Validator** - Verify image format and quality

### 3. Authentication & Authorization

**Location:** `/lib/supabase/`, `/components/providers/AuthProvider.tsx`

**Flow:**

```
Sign Up/Sign In → Supabase Auth → JWT Token → Store in Browser
                                                     │
                                          ┌──────────┴──────────┐
                                          │                     │
                                      Check Pro              Track
                                      Status                 Usage
                                          │                     │
                                    Allow/Deny            Update DB
                                    Features
```

**User Tiers:**
- **Guest:** 5 AI edits/day, unlimited manual filters
- **Free (Authenticated):** 5 AI edits/day (tracked in DB)
- **Pro:** Unlimited AI edits, all features

### 4. Storage Subsystem

**Multi-Layer Storage:**

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION STATE                     │
│              (React State & Context)                     │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
┌───────▼────┐  ┌───────▼──────┐  ┌─────▼──────────┐
│ IndexedDB  │  │ localStorage │  │   Supabase     │
│            │  │              │  │   PostgreSQL   │
│ • Images   │  │ • Presets    │  │                │
│ • Versions │  │ • Settings   │  │ • Users        │
│ • Cache    │  │ • Prompts    │  │ • Profiles     │
│            │  │              │  │ • Usage Logs   │
│ 50MB max   │  │  5MB max     │  │ • Unlimited    │
└────────────┘  └──────────────┘  └────────────────┘
```

**Storage Policies:**

| Data Type | Storage | Max Size | Eviction |
|-----------|---------|----------|----------|
| Image Versions | IndexedDB | 50 versions | LRU |
| Image Cache | IndexedDB | 50 images | LRU |
| Prompt History | localStorage | 200 prompts | FIFO |
| Custom Presets | localStorage | 50 presets | Manual |
| User Data | Supabase | Unlimited | Manual |

### 5. Error Handling System

**Location:** `/lib/errors.ts`, `/lib/api-response.ts`

**Error Hierarchy:**

```
AppError (base class)
├── ValidationError
│   ├── EmptyPromptError
│   └── ImageRequiredError
├── RateLimitError
├── UsageLimitError
├── AuthenticationRequiredError
├── AIServiceError
│   ├── AIInvalidResponseError
│   └── AITextResponseError
├── DatabaseError
├── CacheError
├── StorageError
├── PaymentError
└── NetworkError
```

**Error Flow:**

```
Error Occurs → AppError → API Response → Client → User Message
                  │                         │
                  └─── Logger ─────────────┴── Analytics
```

**Key Features:**
- User-friendly messages separate from technical messages
- Retry indicators for transient errors
- Contextual information for debugging
- Consistent error codes across API

### 6. Logging & Observability

**Location:** `/lib/logger.ts`, `/lib/tracing.ts`

**Logging Levels:**
- **debug:** Development only, verbose information
- **info:** General information, normal operations
- **warn:** Warning conditions, degraded functionality
- **error:** Error conditions, failures

**Structured Logs (Production):**

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "level": "info",
  "module": "API",
  "message": "Request completed",
  "requestId": "req_1704067200000_abc123",
  "duration": 2341,
  "context": {
    "userId": "user_123",
    "cached": false
  }
}
```

**Request Tracing:**
- Unique `requestId` for each API call
- Trace request through entire stack
- Log key checkpoints (rate limit, validation, AI call, response)

---

## Data Flow

### Image Edit Flow

```
1. User uploads photo
   └→ compressImage() → Store in state

2. User applies filter
   └→ convertFilterStateToCSS() → Apply CSS filter for preview

3. User applies AI edit
   └→ Check cache → (miss) → Call /api/nano-banana
      └→ Rate limit check → Validation → OpenRouter API
         └→ Extract image → Validate → Return

4. Store result
   └→ versionStorage.save() → IndexedDB

5. User exports
   └→ applyFiltersToCanvas() → Canvas processing → Download
```

### Authentication Flow

```
1. User signs up/in
   └→ Supabase Auth → JWT token → Store in browser

2. Check auth state
   └→ createClient().auth.getUser() → User object

3. Check Pro status
   └→ Query profiles table → is_pro boolean

4. Track usage
   └→ Increment usage_logs → Check daily limit
```

### Payment Flow

```
1. User clicks "Upgrade to Pro"
   └→ POST /api/stripe/create-checkout
      └→ Create Stripe session → Return checkout URL

2. User completes payment
   └→ Stripe webhook → POST /api/stripe/webhook
      └→ Update profiles.is_pro = true

3. User gains Pro access
   └→ Unlimited AI edits, all features
```

---

## Error Handling

### Client-Side Errors

```typescript
try {
  // API call
} catch (error) {
  if (error instanceof AppError) {
    // Show user message
    toast.error(error.userMessage)

    // Retry if applicable
    if (error.isRetryable) {
      await sleep(2000)
      retry()
    }
  }
}
```

### Server-Side Errors

```typescript
export const POST = withRequestTracing(async (req, requestId) => {
  try {
    // Handler logic
    return successResponse(data)
  } catch (error) {
    // Automatically caught by withRequestTracing
    // Logged and formatted into error response
    throw error
  }
})
```

### React Error Boundaries

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Catches unhandled React errors and shows fallback UI.

---

## Logging & Monitoring

### Development Logging

```
[2025-01-01T12:00:00.000Z] [INFO] [API] Request started
[2025-01-01T12:00:00.100Z] [DEBUG] [API] Rate limit check passed
[2025-01-01T12:00:02.500Z] [INFO] [API] Request completed
```

### Production Logging

```json
{"timestamp":"2025-01-01T12:00:00.000Z","level":"info","module":"API","message":"Request completed","requestId":"req_123","duration":2341}
```

**Monitoring Stack:**
- **Vercel Logs:** Built-in log aggregation
- **Sentry (Optional):** Error tracking and performance monitoring
- **Custom Analytics:** Client-side event tracking

---

## Testing Strategy

### Unit Tests

**Coverage:** 75% target

**Tools:** Vitest, Testing Library

**Scope:**
- Utility functions (image-filters, errors, config)
- React hooks (useNanoBanana, useImageCache)
- API handlers (rate limiting, validation)

### Integration Tests

**Scope:**
- API routes with mocked external services
- Component integration with hooks
- Database operations

### E2E Tests (Future)

**Tools:** Playwright

**Scope:**
- Full user flows (upload → edit → export)
- Payment flow
- Authentication flow

---

## Deployment

### Vercel Configuration

```javascript
// next.config.js
export default {
  images: { unoptimized: true },
  experimental: { serverActions: true }
}
```

### Environment Variables

**Required:**
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Build Process

```bash
npm run build    # Next.js production build
npm start        # Start production server
```

### Edge Functions

All API routes run on Vercel Edge Network:
- Global distribution
- Low latency
- Automatic scaling
- 60s max duration

---

## Security

### Authentication

- Password-based auth via Supabase
- JWT tokens with automatic refresh
- HttpOnly cookies for session management

### API Security

- Rate limiting (20 req/min per IP)
- Input validation on all endpoints
- CORS configured for app domain only

### Data Security

- All data encrypted in transit (HTTPS)
- Supabase handles data encryption at rest
- No sensitive data in client storage

### Payment Security

- PCI compliance via Stripe
- Webhook signature verification
- No credit card data stored

---

## Performance Optimizations

### Client-Side

1. **Image Compression** - Reduce upload size
2. **CSS Filters** - GPU-accelerated preview
3. **IndexedDB Cache** - Instant repeat edits
4. **Code Splitting** - Lazy load components
5. **PWA Caching** - Offline capability

### Server-Side

1. **Edge Functions** - Global distribution
2. **Response Caching** - (Future) Cache common requests
3. **Database Indexing** - Fast queries
4. **Connection Pooling** - Supabase handles this

---

## Future Architecture Improvements

1. **WebSocket Support** - Real-time progress updates
2. **CDN for Images** - Faster image delivery
3. **Background Jobs** - Queue for long-running tasks
4. **Redis Cache** - Shared cache across edge functions
5. **GraphQL API** - More flexible querying
6. **Microservices** - Separate AI service

---

## Diagrams

### Component Tree

```
App
├── AuthProvider
│   ├── ErrorBoundary
│   │   ├── ServiceWorkerRegistration
│   │   │   ├── PhotoEditor
│   │   │   │   ├── UploadButton
│   │   │   │   ├── PhotoDisplay
│   │   │   │   ├── FilterPanel
│   │   │   │   │   └── FilterSlider (×12)
│   │   │   │   ├── VersionTimeline
│   │   │   │   ├── PromptInput
│   │   │   │   ├── HistoryDrawer
│   │   │   │   ├── ComparisonModes
│   │   │   │   ├── ExportModal
│   │   │   │   ├── CustomPresetsPanel
│   │   │   │   └── ShareButton
│   │   │   ├── SignInModal
│   │   │   └── UpgradeModal
```

### Database Schema

```sql
-- Supabase Tables

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  is_pro BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IndexedDB Stores

{
  "snapmod-cache": {
    "versions": [{ id, image, timestamp, sessionId, filterState }],
    "images": [{ key, image, timestamp, size }]
  },
  "snapmod-prompts": {
    "history": [{ id, prompt, timestamp, favorite, usageCount }]
  }
}
```

---

## Conclusion

SnapMod's architecture prioritizes:
- **User Experience** - Fast, responsive, offline-capable
- **Developer Experience** - Type-safe, testable, maintainable
- **Scalability** - Edge functions, client-side processing
- **Reliability** - Comprehensive error handling, logging

The modular design allows for easy extension and maintenance while keeping the codebase clean and understandable.
