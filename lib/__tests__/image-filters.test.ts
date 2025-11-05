import { describe, it, expect } from 'vitest'
import { convertFilterStateToCSS, hasActiveFilters, resetFilters } from '../image-filters'
import { DEFAULT_FILTERS, type FilterState } from '../types/filters'

describe('image-filters', () => {
  describe('convertFilterStateToCSS', () => {
    it('returns "none" for default filters', () => {
      const result = convertFilterStateToCSS(DEFAULT_FILTERS)
      expect(result).toBe('none')
    })

    it('generates correct CSS for brightness (20 = 1.2)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, brightness: 20 }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('brightness(1.2)')
    })

    it('generates correct CSS for contrast (30 = 1.3)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, contrast: 30 }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('contrast(1.3)')
    })

    it('generates correct CSS for saturation (50 = 1.5)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, saturation: 50 }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('saturate(1.5)')
    })

    it('chains multiple filters correctly', () => {
      const filters: FilterState = {
        ...DEFAULT_FILTERS,
        brightness: 10,
        contrast: 20,
        saturation: 30,
      }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('brightness(1.1)')
      expect(result).toContain('contrast(1.2)')
      expect(result).toContain('saturate(1.3)')
    })

    it('handles temperature adjustment (hue-rotate)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, temperature: 10 }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('hue-rotate(18deg)') // 10 * 1.8 = 18
    })

    it('handles tint adjustment (sepia)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, tint: 40 }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('sepia(0.2)') // 40 / 200 = 0.2
    })

    it('handles sharpness (adds contrast)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, sharpness: 20 }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('contrast(1.1)') // 1 + 20/200 = 1.1
    })

    it('handles vignette (returns string)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, vignette: 50 }
      const result = convertFilterStateToCSS(filters)
      // Vignette is not in CSS, so should return 'none' (no CSS filter for vignette)
      expect(typeof result).toBe('string')
    })

    it('handles negative values (-20 = 0.8)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, brightness: -20 }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('brightness(0.8)')
    })

    it('handles zero values (returns none)', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, brightness: 0 }
      const result = convertFilterStateToCSS(filters)
      expect(result).toBe('none')
    })

    it('handles multiple filters with mixed values', () => {
      const filters: FilterState = {
        ...DEFAULT_FILTERS,
        brightness: -10,
        contrast: 15,
        saturation: -20,
      }
      const result = convertFilterStateToCSS(filters)
      expect(result).toContain('brightness(0.9)')
      expect(result).toContain('contrast(1.15)')
      expect(result).toContain('saturate(0.8)')
    })
  })

  describe('hasActiveFilters', () => {
    it('returns false for default filters', () => {
      expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false)
    })

    it('returns true when brightness is modified', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, brightness: 20 }
      expect(hasActiveFilters(filters)).toBe(true)
    })

    it('returns true when contrast is modified', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, contrast: -20 }
      expect(hasActiveFilters(filters)).toBe(true)
    })

    it('returns true when any filter is modified', () => {
      const filters: FilterState = { ...DEFAULT_FILTERS, saturation: 10 }
      expect(hasActiveFilters(filters)).toBe(true)
    })

    it('returns false when all filters are at default (0)', () => {
      const filters: FilterState = {
        brightness: 0,
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        saturation: 0,
        vibrance: 0,
        temperature: 0,
        tint: 0,
        clarity: 0,
        sharpness: 0,
        vignette: 0,
      }
      expect(hasActiveFilters(filters)).toBe(false)
    })
  })

  describe('resetFilters', () => {
    it('returns default filter state', () => {
      const result = resetFilters()
      expect(result).toEqual(DEFAULT_FILTERS)
    })

    it('resets all values to defaults (0)', () => {
      const result = resetFilters()
      expect(result.brightness).toBe(0)
      expect(result.contrast).toBe(0)
      expect(result.saturation).toBe(0)
      expect(result.vignette).toBe(0)
    })
  })
})
