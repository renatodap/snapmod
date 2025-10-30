import { useState, useCallback } from 'react';
import { useImageCache } from './useImageCache';

interface GenerationOptions {
  prompt: string;
  imageUrl?: string;
  mode: 'generate' | 'edit';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}

interface GenerationResult {
  success: boolean;
  image?: string;
  error?: string;
  cached?: boolean;
}

export function useNanoBanana() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { getCachedImage, cacheImage } = useImageCache();

  const generate = useCallback(async (options: GenerationOptions): Promise<GenerationResult> => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Check cache first
      const cacheKey = `${options.mode}-${options.prompt}-${options.imageUrl || 'new'}`;
      const cached = await getCachedImage(cacheKey);

      if (cached) {
        setProgress(100);
        setIsGenerating(false);
        return { success: true, image: cached, cached: true };
      }

      // Simulate progress (since we can't get real progress from API)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Call API
      const response = await fetch('/api/nano-banana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      clearInterval(progressInterval);
      setProgress(95);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();

      if (!data.success || !data.image) {
        throw new Error('No image returned');
      }

      // Cache the result
      await cacheImage(cacheKey, data.image);

      setProgress(100);
      setIsGenerating(false);

      return { success: true, image: data.image, cached: false };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsGenerating(false);
      setProgress(0);
      return { success: false, error: errorMessage };
    }
  }, [getCachedImage, cacheImage]);

  return {
    generate,
    isGenerating,
    progress,
    error
  };
}
