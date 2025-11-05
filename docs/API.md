# API Reference

Complete reference for SnapMod API endpoints.

## Base URL

```
Production: https://snapmod.vercel.app/api
Development: http://localhost:3000/api
```

---

## POST /api/nano-banana

Generate or edit images using AI (Gemini 2.5 Flash Image via OpenRouter).

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```typescript
{
  prompt: string          // Filter instructions or generation prompt (required)
  imageUrl?: string       // Base64-encoded image (required for edit mode)
  mode: 'generate' | 'edit'  // Operation mode (required)
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'  // Image aspect ratio (optional)
}
```

**Example - Edit Mode:**
```json
{
  "prompt": "Make it more cinematic with warmer tones",
  "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mode": "edit"
}
```

**Example - Generate Mode:**
```json
{
  "prompt": "A serene mountain landscape at sunset",
  "mode": "generate",
  "aspectRatio": "16:9"
}
```

### Response

**Success (200 OK):**
```typescript
{
  success: true
  data: {
    image: string       // Base64 data URL
    cached: boolean     // Whether result was from cache
  }
}
```

**Error (4xx/5xx):**
```typescript
{
  error: {
    code: ErrorCode           // Machine-readable error code
    message: string           // Technical error message
    userMessage: string       // User-friendly error message
    isRetryable: boolean      // Whether request can be retried
    context?: {               // Additional error context
      requestId?: string
      [key: string]: any
    }
  }
}
```

### Error Codes

| Code | Status | Description | Retryable |
|------|--------|-------------|-----------|
| `EMPTY_PROMPT` | 400 | No filter prompt provided | No |
| `IMAGE_REQUIRED` | 400 | Image required for edit mode | No |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Yes |
| `USAGE_LIMIT_EXCEEDED` | 403 | Daily usage limit reached | No |
| `AI_SERVICE_ERROR` | 503 | OpenRouter API error | Yes |
| `AI_INVALID_RESPONSE` | 500 | Invalid AI response format | Yes |
| `AI_TEXT_RESPONSE` | 500 | AI returned text instead of image | Yes |
| `NETWORK_ERROR` | 503 | Network connectivity issue | Yes |
| `UNKNOWN_ERROR` | 500 | Unexpected server error | No |

### Rate Limiting

- **Limit:** 20 requests per minute per IP address
- **Headers:** Response includes `Retry-After` header (seconds) when rate limited
- **Reset:** Rate limit window resets after 1 minute

### Usage Limits

| Tier | Daily Limit | Manual Filters |
|------|-------------|----------------|
| **Free** | 5 AI edits | Unlimited |
| **Pro** | Unlimited | Unlimited |

Manual filter adjustments (brightness, contrast, etc.) do not count toward usage limits.

---

## POST /api/stripe/create-checkout

Create a Stripe checkout session for Pro subscription.

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```typescript
{
  userId: string     // User ID from Supabase auth
  email: string      // User email address
}
```

### Response

**Success (200 OK):**
```typescript
{
  success: true
  data: {
    sessionId: string    // Stripe checkout session ID
    url: string          // Checkout page URL
  }
}
```

**Error:**
See error format in `/api/nano-banana` section.

---

## POST /api/stripe/webhook

Handle Stripe webhook events (internal endpoint).

### Request

**Headers:**
```
stripe-signature: string    // Stripe webhook signature
Content-Type: application/json
```

**Body:**
Stripe webhook event payload (varies by event type).

### Response

**Success (200 OK):**
```typescript
{
  received: true
}
```

**Supported Events:**
- `checkout.session.completed` - Activate Pro subscription
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription

---

## GET /auth/callback

OAuth/Magic link authentication callback (handled by Supabase).

### Query Parameters

```
code: string           // Auth code from provider
error?: string         // Error message if auth failed
error_description?: string  // Detailed error description
```

### Response

Redirects to application with auth state.

---

## Error Handling

### Client-Side Error Handling

```typescript
import { parseApiError } from '@/lib/api-response'

try {
  const response = await fetch('/api/nano-banana', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, imageUrl, mode }),
  })

  if (!response.ok) {
    const error = await parseApiError(response)

    // Check if retryable
    if (error.isRetryable) {
      // Implement retry logic
      await sleep(2000)
      // Retry request...
    }

    // Show user-friendly message
    alert(error.userMessage)

    throw error
  }

  const result = await response.json()
  return result.data
} catch (error) {
  console.error('API error:', error)
  throw error
}
```

### Retry Strategy

For retryable errors (network issues, service errors, rate limits):

```typescript
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (error instanceof AppError && !error.isRetryable) {
        throw error  // Don't retry non-retryable errors
      }

      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000  // Exponential backoff
        await sleep(delay)
      }
    }
  }

  throw lastError!
}
```

---

## Common Scenarios

### Scenario 1: Edit Photo with AI

```typescript
const response = await fetch('/api/nano-banana', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Make it look cinematic',
    imageUrl: photoDataUrl,  // Base64 data URL
    mode: 'edit',
  }),
})

const result = await response.json()
if (result.success) {
  const editedImage = result.data.image  // Base64 data URL
  // Display edited image...
}
```

### Scenario 2: Generate Image from Text

```typescript
const response = await fetch('/api/nano-banana', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A beautiful sunset over mountains',
    mode: 'generate',
    aspectRatio: '16:9',
  }),
})

const result = await response.json()
if (result.success) {
  const generatedImage = result.data.image
  // Display generated image...
}
```

### Scenario 3: Upgrade to Pro

```typescript
const response = await fetch('/api/stripe/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    email: user.email,
  }),
})

const result = await response.json()
if (result.success) {
  window.location.href = result.data.url  // Redirect to Stripe checkout
}
```

---

## Rate Limit Headers

All API responses include rate limit information:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1704067200
```

When rate limited (429), response includes:

```
Retry-After: 60
```

---

## Caching

### Client-Side Caching

The app uses IndexedDB for caching AI-generated images:

- **Cache Key:** Hash of `prompt + imageUrl`
- **Cache Duration:** Until session ends or cache is cleared
- **Max Entries:** 50 images
- **Eviction:** LRU (Least Recently Used)

To check if request will use cache:

```typescript
import { getCachedImage } from '@/hooks/useImageCache'

const cacheKey = `${prompt}_${imageUrl}`
const cached = await getCachedImage(cacheKey)

if (cached) {
  // Use cached image instead of API call
  return cached
}
```

### Server-Side Caching

No server-side caching currently implemented. All requests go directly to OpenRouter API.

---

## WebSocket Support

WebSocket support is not currently available. All communication is via HTTP REST API.

For real-time progress updates during image generation, the client polls the API or uses a loading state.

---

## Security

### Authentication

- User authentication via Supabase Auth (password-based)
- Session management via JWT tokens
- Auth required for Pro features and usage tracking

### API Keys

All API keys should be stored in environment variables:

```env
OPENROUTER_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### CORS

CORS is handled by Next.js Edge Runtime:
- Origin: All origins allowed in development
- Origin: Specific origin in production (via VERCEL_URL)

---

## Monitoring & Debugging

### Request Tracing

All API requests include a unique `requestId` in logs and error responses:

```
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "context": {
      "requestId": "req_1704067200000_abc123"
    }
  }
}
```

Use this ID to trace the request through logs.

### Logging

Structured JSON logs in production:

```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "level": "info",
  "module": "API",
  "message": "Request completed",
  "requestId": "req_1704067200000_abc123",
  "duration": 2341
}
```

### Health Check

No dedicated health check endpoint. Use a simple API call:

```bash
curl https://snapmod.vercel.app/api/nano-banana \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","mode":"generate"}'
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
try {
  const result = await apiCall()
} catch (error) {
  if (error instanceof AppError) {
    // Show user message
    showToast(error.userMessage)
  } else {
    // Log unexpected errors
    console.error('Unexpected error:', error)
    showToast('Something went wrong. Please try again.')
  }
}
```

### 2. Implement Retry Logic for Transient Errors

```typescript
if (error.isRetryable) {
  await sleep(2000)
  return retry()
}
```

### 3. Show Loading States

AI generation can take 5-30 seconds. Always show progress:

```typescript
setLoading(true)
try {
  const result = await generateImage()
} finally {
  setLoading(false)
}
```

### 4. Validate Input Client-Side

Reduce unnecessary API calls:

```typescript
if (!prompt.trim()) {
  alert('Please enter a prompt')
  return
}

if (mode === 'edit' && !imageUrl) {
  alert('Please upload an image first')
  return
}
```

### 5. Use Caching

Check cache before making API calls:

```typescript
const cached = await getCachedImage(cacheKey)
if (cached) return cached

const result = await apiCall()
await cacheImage(cacheKey, result)
return result
```

---

## Changelog

### v1.1.0 (2025-11-05)

- Added structured error responses
- Implemented request tracing
- Added rate limit headers
- Improved error codes and messages

### v1.0.0 (2025-01-01)

- Initial API release
- AI image generation and editing
- Stripe payment integration
- Basic rate limiting
