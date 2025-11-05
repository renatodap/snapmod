/**
 * Centralized application configuration
 *
 * Single source of truth for:
 * - API settings
 * - Rate limits
 * - Usage limits
 * - Cache settings
 * - Feature flags
 */

export const APP_CONFIG = {
  // Application metadata
  app: {
    name: 'SnapMod',
    description: 'AI-powered photo editing and filters',
    url: process.env.VERCEL_URL || 'https://snapmod.vercel.app',
  },

  // AI service configuration
  ai: {
    provider: 'openrouter',
    model: 'google/gemini-2.5-flash-image-preview',
    timeout: 60000, // 60 seconds
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
  },

  // API rate limiting
  rateLimit: {
    requestsPerMinute: 20,
    windowMs: 60000, // 1 minute
    enabled: true,
  },

  // Usage limits by tier
  usage: {
    free: {
      dailyLimit: 5,
      aiEditsIncluded: true,
      manualFiltersIncluded: true,
    },
    pro: {
      dailyLimit: Infinity,
      aiEditsIncluded: true,
      manualFiltersIncluded: true,
    },
  },

  // Cache configuration
  cache: {
    image: {
      maxVersions: 50,
      maxImages: 50,
      maxSizeBytes: 50 * 1024 * 1024, // 50 MB
      dbName: 'snapmod-cache',
    },
    prompt: {
      maxPrompts: 200,
      dbName: 'snapmod-prompts',
    },
    preset: {
      maxPresets: 50,
      storageKey: 'custom_presets',
    },
  },

  // Image processing
  image: {
    maxUploadSizeMB: 10,
    compressionQuality: 0.85,
    maxDimension: 4096,
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Stripe payment configuration
  stripe: {
    proPriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    successUrl: '/success',
    cancelUrl: '/cancel',
  },

  // Analytics configuration
  analytics: {
    enabled: true,
    trackingId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    events: {
      imageUpload: 'image_upload',
      editStart: 'edit_start',
      editComplete: 'edit_complete',
      editFailed: 'edit_failed',
      presetUsed: 'preset_used',
      download: 'download',
      versionChange: 'version_change',
      comparisonView: 'comparison_view',
      historyOpened: 'history_opened',
    },
  },

  // Feature flags
  features: {
    aiEditing: true,
    manualFilters: true,
    customPresets: true,
    versionHistory: true,
    offlineMode: true,
    shareButton: true,
    exportOptions: true,
    promptBuilder: true,
    keyboardShortcuts: true,
  },

  // Filter defaults
  filters: {
    min: 0,
    max: 200,
    default: 100,
    step: 1,
  },

  // PWA configuration
  pwa: {
    enabled: true,
    name: 'SnapMod',
    shortName: 'SnapMod',
    description: 'AI-powered photo filters',
    themeColor: '#3b82f6',
    backgroundColor: '#000000',
  },
} as const

/**
 * Environment-specific configuration
 */
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // API Keys (server-side only)
  apiKeys: {
    openRouter: process.env.OPENROUTER_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // URLs
  urls: {
    app: process.env.VERCEL_URL || 'http://localhost:3000',
    api: '/api',
  },
} as const

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    'OPENROUTER_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = required.filter((key) => !process.env[key])

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Get configuration value by path
 *
 * @example
 * ```ts
 * const limit = getConfig('usage.free.dailyLimit') // 5
 * const model = getConfig('ai.model') // 'google/gemini-2.5-flash-image-preview'
 * ```
 */
export function getConfig(path: string): any {
  const keys = path.split('.')
  let value: any = APP_CONFIG

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key as keyof typeof value]
    } else {
      return undefined
    }
  }

  return value
}
