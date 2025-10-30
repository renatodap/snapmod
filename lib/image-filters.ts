/**
 * Image Filters - Real-time filter processing
 *
 * Two-tier approach:
 * 1. CSS filters for instant preview (GPU-accelerated)
 * 2. Canvas pixel manipulation for high-quality export
 */

import type { FilterState } from './types/filters';
import { DEFAULT_FILTERS } from './types/filters';

/**
 * Convert filter state to CSS filter string
 * Used for real-time preview (GPU-accelerated, <16ms)
 */
export function convertFilterStateToCSS(filters: FilterState): string {
  const cssFilters: string[] = [];

  // Brightness (-100 to 100 → 0 to 2)
  if (filters.brightness !== 0) {
    const brightness = 1 + filters.brightness / 100;
    cssFilters.push(`brightness(${brightness})`);
  }

  // Contrast (-100 to 100 → 0 to 2)
  if (filters.contrast !== 0) {
    const contrast = 1 + filters.contrast / 100;
    cssFilters.push(`contrast(${contrast})`);
  }

  // Saturation (-100 to 100 → 0 to 2)
  if (filters.saturation !== 0) {
    const saturation = 1 + filters.saturation / 100;
    cssFilters.push(`saturate(${saturation})`);
  }

  // Temperature via hue-rotate (-100 to 100 → -180 to 180deg)
  if (filters.temperature !== 0) {
    const hueRotate = filters.temperature * 1.8;
    cssFilters.push(`hue-rotate(${hueRotate}deg)`);
  }

  // Tint via sepia (approximation)
  if (filters.tint > 0) {
    const sepia = filters.tint / 200; // 0 to 0.5
    cssFilters.push(`sepia(${sepia})`);
  }

  // Sharpness (approximation via contrast)
  if (filters.sharpness > 0) {
    const sharpnessContrast = 1 + filters.sharpness / 200;
    cssFilters.push(`contrast(${sharpnessContrast})`);
  }

  return cssFilters.join(' ') || 'none';
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return Object.entries(filters).some(
    ([key, value]) => value !== DEFAULT_FILTERS[key as keyof FilterState]
  );
}

/**
 * Reset all filters to default
 */
export function resetFilters(): FilterState {
  return { ...DEFAULT_FILTERS };
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Apply filters to canvas for high-quality export
 * Pixel-level manipulation for accurate results
 */
export async function applyFiltersToCanvas(
  imageUrl: string,
  filters: FilterState
): Promise<string> {
  console.log('[Filters] Applying filters to canvas:', filters);

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Load image
  const img = await loadImage(imageUrl);
  canvas.width = img.width;
  canvas.height = img.height;

  console.log('[Filters] Canvas size:', canvas.width, 'x', canvas.height);

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  console.log('[Filters] Processing', data.length / 4, 'pixels');

  // Apply filters pixel by pixel
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    // Alpha at data[i + 3] - keep unchanged

    // BRIGHTNESS: Add/subtract from RGB
    if (filters.brightness !== 0) {
      const brightnessFactor = filters.brightness * 2.55; // -100 to 100 → -255 to 255
      r = clamp(r + brightnessFactor, 0, 255);
      g = clamp(g + brightnessFactor, 0, 255);
      b = clamp(b + brightnessFactor, 0, 255);
    }

    // EXPOSURE: Similar to brightness but affects midtones more
    if (filters.exposure !== 0) {
      const exposureFactor = 1 + filters.exposure / 100;
      r = clamp(r * exposureFactor, 0, 255);
      g = clamp(g * exposureFactor, 0, 255);
      b = clamp(b * exposureFactor, 0, 255);
    }

    // CONTRAST: Expand/compress around midpoint (128)
    if (filters.contrast !== 0) {
      const contrastFactor = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));
      r = clamp(contrastFactor * (r - 128) + 128, 0, 255);
      g = clamp(contrastFactor * (g - 128) + 128, 0, 255);
      b = clamp(contrastFactor * (b - 128) + 128, 0, 255);
    }

    // HIGHLIGHTS: Affect bright areas only
    if (filters.highlights !== 0) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance > 128) {
        const highlightFactor = filters.highlights / 100;
        const weight = (luminance - 128) / 127; // 0 to 1 for bright pixels
        r = clamp(r + highlightFactor * 50 * weight, 0, 255);
        g = clamp(g + highlightFactor * 50 * weight, 0, 255);
        b = clamp(b + highlightFactor * 50 * weight, 0, 255);
      }
    }

    // SHADOWS: Affect dark areas only
    if (filters.shadows !== 0) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 128) {
        const shadowFactor = filters.shadows / 100;
        const weight = (128 - luminance) / 128; // 0 to 1 for dark pixels
        r = clamp(r + shadowFactor * 50 * weight, 0, 255);
        g = clamp(g + shadowFactor * 50 * weight, 0, 255);
        b = clamp(b + shadowFactor * 50 * weight, 0, 255);
      }
    }

    // SATURATION: Move toward/away from grayscale
    if (filters.saturation !== 0 || filters.vibrance !== 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Saturation
      if (filters.saturation !== 0) {
        const saturationFactor = 1 + filters.saturation / 100;
        r = clamp(gray + saturationFactor * (r - gray), 0, 255);
        g = clamp(gray + saturationFactor * (g - gray), 0, 255);
        b = clamp(gray + saturationFactor * (b - gray), 0, 255);
      }

      // Vibrance (affects less saturated colors more)
      if (filters.vibrance !== 0) {
        const currentSaturation = Math.max(r, g, b) - Math.min(r, g, b);
        const vibranceFactor = 1 + (filters.vibrance / 100) * (1 - currentSaturation / 255);
        r = clamp(gray + vibranceFactor * (r - gray), 0, 255);
        g = clamp(gray + vibranceFactor * (g - gray), 0, 255);
        b = clamp(gray + vibranceFactor * (b - gray), 0, 255);
      }
    }

    // TEMPERATURE: Shift toward warm (orange) or cool (blue)
    if (filters.temperature !== 0) {
      const tempFactor = filters.temperature / 100;
      if (tempFactor > 0) {
        // Warm: increase red, decrease blue
        r = clamp(r + tempFactor * 50, 0, 255);
        b = clamp(b - tempFactor * 30, 0, 255);
      } else {
        // Cool: decrease red, increase blue
        r = clamp(r + tempFactor * 30, 0, 255);
        b = clamp(b - tempFactor * 50, 0, 255);
      }
    }

    // TINT: Shift toward green or magenta
    if (filters.tint !== 0) {
      const tintFactor = filters.tint / 100;
      if (tintFactor > 0) {
        // Magenta: increase red and blue, decrease green
        r = clamp(r + tintFactor * 30, 0, 255);
        g = clamp(g - tintFactor * 20, 0, 255);
        b = clamp(b + tintFactor * 30, 0, 255);
      } else {
        // Green: increase green, decrease red and blue
        r = clamp(r + tintFactor * 20, 0, 255);
        g = clamp(g - tintFactor * 40, 0, 255);
        b = clamp(b + tintFactor * 20, 0, 255);
      }
    }

    // CLARITY: Enhance midtone contrast
    if (filters.clarity !== 0) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const clarityFactor = filters.clarity / 100;
      const distance = luminance - 128;
      const clarityAdjust = distance * clarityFactor * 0.5;
      r = clamp(r + clarityAdjust, 0, 255);
      g = clamp(g + clarityAdjust, 0, 255);
      b = clamp(b + clarityAdjust, 0, 255);
    }

    // Write modified values back
    data[i] = Math.round(r);
    data[i + 1] = Math.round(g);
    data[i + 2] = Math.round(b);
    // data[i + 3] (alpha) unchanged
  }

  // SHARPNESS: Apply via unsharp mask (simplified)
  if (filters.sharpness > 0) {
    console.log('[Filters] Applying sharpness:', filters.sharpness);
    applySharpness(imageData, filters.sharpness / 100);
  }

  // VIGNETTE: Darken edges
  if (filters.vignette > 0) {
    console.log('[Filters] Applying vignette:', filters.vignette);
    applyVignette(imageData, canvas.width, canvas.height, filters.vignette / 100);
  }

  // Put modified data back
  ctx.putImageData(imageData, 0, 0);

  console.log('[Filters] Canvas processing complete');

  // Return as data URL (JPEG at 95% quality)
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Apply sharpness via unsharp mask
 */
function applySharpness(imageData: ImageData, amount: number): void {
  // Simplified sharpening - enhance edges
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Create a copy for reading
  const original = new Uint8ClampedArray(data);

  const sharpenKernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB only, skip alpha
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += original[idx] * sharpenKernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        const sharpened = sum;
        data[idx] = clamp(original[idx] + (sharpened - original[idx]) * amount, 0, 255);
      }
    }
  }
}

/**
 * Apply vignette effect (darken edges)
 */
function applyVignette(imageData: ImageData, width: number, height: number, amount: number): void {
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const vignetteFactor = 1 - (distance / maxDistance) * amount;

      const idx = (y * width + x) * 4;
      data[idx] = clamp(data[idx] * vignetteFactor, 0, 255);     // R
      data[idx + 1] = clamp(data[idx + 1] * vignetteFactor, 0, 255); // G
      data[idx + 2] = clamp(data[idx + 2] * vignetteFactor, 0, 255); // B
    }
  }
}

/**
 * Check if Canvas API is available
 */
export function canUseCanvas(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  } catch {
    return false;
  }
}
