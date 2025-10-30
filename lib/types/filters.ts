/**
 * Image Filter Types
 *
 * Defines the structure for real-time image filters
 * (Lightroom-style adjustments)
 */

export interface FilterState {
  // Exposure & Tone
  brightness: number;    // -100 to 100
  exposure: number;      // -100 to 100
  contrast: number;      // -100 to 100
  highlights: number;    // -100 to 100
  shadows: number;       // -100 to 100

  // Color
  saturation: number;    // -100 to 100
  vibrance: number;      // -100 to 100
  temperature: number;   // -100 to 100 (cool to warm)
  tint: number;         // -100 to 100 (green to magenta)

  // Detail
  clarity: number;       // -100 to 100
  sharpness: number;     // 0 to 100

  // Effects
  vignette: number;      // 0 to 100
}

export const DEFAULT_FILTERS: FilterState = {
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
};

export interface FilterRange {
  min: number;
  max: number;
  step: number;
  default: number;
}

export const FILTER_RANGES: Record<keyof FilterState, FilterRange> = {
  brightness: { min: -100, max: 100, step: 1, default: 0 },
  exposure: { min: -100, max: 100, step: 1, default: 0 },
  contrast: { min: -100, max: 100, step: 1, default: 0 },
  highlights: { min: -100, max: 100, step: 1, default: 0 },
  shadows: { min: -100, max: 100, step: 1, default: 0 },
  saturation: { min: -100, max: 100, step: 1, default: 0 },
  vibrance: { min: -100, max: 100, step: 1, default: 0 },
  temperature: { min: -100, max: 100, step: 1, default: 0 },
  tint: { min: -100, max: 100, step: 1, default: 0 },
  clarity: { min: -100, max: 100, step: 1, default: 0 },
  sharpness: { min: 0, max: 100, step: 1, default: 0 },
  vignette: { min: 0, max: 100, step: 1, default: 0 },
};

export type FilterCategory = 'exposure' | 'color' | 'detail' | 'effects';

export interface FilterGroup {
  category: FilterCategory;
  label: string;
  filters: (keyof FilterState)[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  {
    category: 'exposure',
    label: 'Exposure',
    filters: ['brightness', 'exposure', 'contrast', 'highlights', 'shadows'],
  },
  {
    category: 'color',
    label: 'Color',
    filters: ['saturation', 'vibrance', 'temperature', 'tint'],
  },
  {
    category: 'detail',
    label: 'Detail',
    filters: ['clarity', 'sharpness'],
  },
  {
    category: 'effects',
    label: 'Effects',
    filters: ['vignette'],
  },
];
