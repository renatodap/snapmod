import { describe, it, expect } from 'vitest'
import { APP_CONFIG, getConfig } from '../config'

describe('config', () => {
  describe('APP_CONFIG', () => {
    it('has app metadata', () => {
      expect(APP_CONFIG.app.name).toBe('SnapMod')
      expect(APP_CONFIG.app.description).toBeDefined()
      expect(APP_CONFIG.app.url).toBeDefined()
    })

    it('has AI configuration', () => {
      expect(APP_CONFIG.ai.provider).toBe('openrouter')
      expect(APP_CONFIG.ai.model).toBe('google/gemini-2.5-flash-image-preview')
      expect(APP_CONFIG.ai.timeout).toBe(60000)
      expect(APP_CONFIG.ai.maxRetries).toBe(3)
    })

    it('has rate limit configuration', () => {
      expect(APP_CONFIG.rateLimit.requestsPerMinute).toBe(20)
      expect(APP_CONFIG.rateLimit.windowMs).toBe(60000)
      expect(APP_CONFIG.rateLimit.enabled).toBe(true)
    })

    it('has usage limits', () => {
      expect(APP_CONFIG.usage.free.dailyLimit).toBe(5)
      expect(APP_CONFIG.usage.pro.dailyLimit).toBe(Infinity)
    })

    it('has cache configuration', () => {
      expect(APP_CONFIG.cache.image.maxVersions).toBe(50)
      expect(APP_CONFIG.cache.image.maxImages).toBe(50)
      expect(APP_CONFIG.cache.prompt.maxPrompts).toBe(200)
      expect(APP_CONFIG.cache.preset.maxPresets).toBe(50)
    })

    it('has image processing config', () => {
      expect(APP_CONFIG.image.maxUploadSizeMB).toBe(10)
      expect(APP_CONFIG.image.compressionQuality).toBe(0.85)
      expect(APP_CONFIG.image.maxDimension).toBe(4096)
      expect(APP_CONFIG.image.supportedFormats).toContain('image/jpeg')
    })

    it('has feature flags', () => {
      expect(APP_CONFIG.features.aiEditing).toBe(true)
      expect(APP_CONFIG.features.manualFilters).toBe(true)
      expect(APP_CONFIG.features.customPresets).toBe(true)
    })

    it('has filter defaults', () => {
      expect(APP_CONFIG.filters.min).toBe(0)
      expect(APP_CONFIG.filters.max).toBe(200)
      expect(APP_CONFIG.filters.default).toBe(100)
      expect(APP_CONFIG.filters.step).toBe(1)
    })
  })

  describe('getConfig', () => {
    it('retrieves top-level config', () => {
      expect(getConfig('app')).toEqual(APP_CONFIG.app)
    })

    it('retrieves nested config', () => {
      expect(getConfig('usage.free.dailyLimit')).toBe(5)
      expect(getConfig('ai.model')).toBe('google/gemini-2.5-flash-image-preview')
      expect(getConfig('cache.image.maxVersions')).toBe(50)
    })

    it('returns undefined for non-existent path', () => {
      expect(getConfig('nonexistent')).toBeUndefined()
      expect(getConfig('app.nonexistent')).toBeUndefined()
      expect(getConfig('app.name.nested.too.deep')).toBeUndefined()
    })

    it('handles deeply nested paths', () => {
      expect(getConfig('cache.image.maxSizeBytes')).toBe(50 * 1024 * 1024)
    })
  })
})
