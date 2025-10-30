/**
 * Custom Preset Storage
 *
 * Allows users to save their own editing "recipes" for reuse
 * Creates lock-in: Users build library of presets over time
 */

export interface CustomPreset {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  usageCount: number;

  // Prompt data
  basePrompt: string;
  modifiers?: Array<{
    type: string;
    instruction: string;
    intensity: number;
  }>;

  // Example images (optional)
  exampleBefore?: string; // base64 thumbnail
  exampleAfter?: string; // base64 thumbnail

  // Metadata
  category?: 'portrait' | 'landscape' | 'product' | 'food' | 'custom';
  tags?: string[];
  isFavorite?: boolean;
}

const STORAGE_KEY = 'custom_presets';
const MAX_PRESETS = 50; // Limit storage

class CustomPresetsManager {
  /**
   * Get all custom presets
   */
  async getAll(): Promise<CustomPreset[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const presets: CustomPreset[] = JSON.parse(stored);

      // Sort by usage count (most used first)
      return presets.sort((a, b) => b.usageCount - a.usageCount);
    } catch (error) {
      console.error('[CustomPresets] Failed to get presets:', error);
      return [];
    }
  }

  /**
   * Get preset by ID
   */
  async getById(id: string): Promise<CustomPreset | null> {
    const presets = await this.getAll();
    return presets.find(p => p.id === id) || null;
  }

  /**
   * Save new preset
   */
  async save(preset: Omit<CustomPreset, 'id' | 'createdAt' | 'usageCount'>): Promise<CustomPreset> {
    try {
      const presets = await this.getAll();

      // Check limit
      if (presets.length >= MAX_PRESETS) {
        // Remove least used preset
        presets.sort((a, b) => a.usageCount - b.usageCount);
        presets.shift();
      }

      const newPreset: CustomPreset = {
        ...preset,
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        usageCount: 0,
      };

      presets.push(newPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));

      console.log('[CustomPresets] Preset saved:', newPreset.name);
      return newPreset;
    } catch (error) {
      console.error('[CustomPresets] Failed to save preset:', error);
      throw error;
    }
  }

  /**
   * Update existing preset
   */
  async update(id: string, updates: Partial<CustomPreset>): Promise<void> {
    try {
      const presets = await this.getAll();
      const index = presets.findIndex(p => p.id === id);

      if (index === -1) {
        throw new Error('Preset not found');
      }

      presets[index] = { ...presets[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));

      console.log('[CustomPresets] Preset updated:', id);
    } catch (error) {
      console.error('[CustomPresets] Failed to update preset:', error);
      throw error;
    }
  }

  /**
   * Delete preset
   */
  async delete(id: string): Promise<void> {
    try {
      const presets = await this.getAll();
      const filtered = presets.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

      console.log('[CustomPresets] Preset deleted:', id);
    } catch (error) {
      console.error('[CustomPresets] Failed to delete preset:', error);
      throw error;
    }
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string): Promise<void> {
    try {
      const presets = await this.getAll();
      const index = presets.findIndex(p => p.id === id);

      if (index !== -1) {
        presets[index].usageCount++;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      }
    } catch (error) {
      console.error('[CustomPresets] Failed to increment usage:', error);
    }
  }

  /**
   * Toggle favorite
   */
  async toggleFavorite(id: string): Promise<void> {
    try {
      const presets = await this.getAll();
      const index = presets.findIndex(p => p.id === id);

      if (index !== -1) {
        presets[index].isFavorite = !presets[index].isFavorite;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      }
    } catch (error) {
      console.error('[CustomPresets] Failed to toggle favorite:', error);
    }
  }

  /**
   * Get favorites only
   */
  async getFavorites(): Promise<CustomPreset[]> {
    const presets = await this.getAll();
    return presets.filter(p => p.isFavorite);
  }

  /**
   * Search presets by name or tags
   */
  async search(query: string): Promise<CustomPreset[]> {
    const presets = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return presets.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get presets by category
   */
  async getByCategory(category: CustomPreset['category']): Promise<CustomPreset[]> {
    const presets = await this.getAll();
    return presets.filter(p => p.category === category);
  }

  /**
   * Export presets (for backup)
   */
  async exportAll(): Promise<string> {
    const presets = await this.getAll();
    return JSON.stringify(presets, null, 2);
  }

  /**
   * Import presets (from backup)
   */
  async importAll(json: string): Promise<void> {
    try {
      const imported: CustomPreset[] = JSON.parse(json);

      // Validate structure
      if (!Array.isArray(imported)) {
        throw new Error('Invalid preset format');
      }

      const existing = await this.getAll();
      const merged = [...existing, ...imported];

      // Remove duplicates by name
      const unique = merged.filter((preset, index, self) =>
        index === self.findIndex(p => p.name === preset.name)
      );

      // Limit to MAX_PRESETS
      const limited = unique.slice(-MAX_PRESETS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      console.log('[CustomPresets] Imported', imported.length, 'presets');
    } catch (error) {
      console.error('[CustomPresets] Failed to import presets:', error);
      throw error;
    }
  }

  /**
   * Get storage stats
   */
  async getStats(): Promise<{
    total: number;
    favorites: number;
    mostUsed: CustomPreset | null;
    categories: Record<string, number>;
  }> {
    const presets = await this.getAll();

    const favorites = presets.filter(p => p.isFavorite).length;
    const mostUsed = presets.length > 0
      ? presets.reduce((prev, current) =>
          current.usageCount > prev.usageCount ? current : prev
        )
      : null;

    const categories: Record<string, number> = {};
    presets.forEach(p => {
      const cat = p.category || 'custom';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return {
      total: presets.length,
      favorites,
      mostUsed,
      categories,
    };
  }
}

// Singleton instance
export const customPresets = new CustomPresetsManager();

// Helper function to create thumbnail from image
export async function createThumbnail(imageDataUrl: string, maxSize: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}
