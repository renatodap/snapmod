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
  userMessage?: string;
  cached?: boolean;
}

export function useNanoBanana() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { getCachedImage, cacheImage } = useImageCache();

  const generate = useCallback(async (options: GenerationOptions): Promise<GenerationResult> => {
    console.log('[useNanoBanana] Starting generation with options:', {
      mode: options.mode,
      promptLength: options.prompt?.length,
      hasImage: !!options.imageUrl
    });

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Check cache first
      const cacheKey = `${options.mode}-${options.prompt}-${options.imageUrl || 'new'}`;
      console.log('[useNanoBanana] Checking cache for key:', cacheKey.substring(0, 100));

      const cached = await getCachedImage(cacheKey);

      if (cached) {
        console.log('[useNanoBanana] Cache hit! Returning cached image');
        setProgress(100);
        setIsGenerating(false);
        return { success: true, image: cached, cached: true };
      }

      console.log('[useNanoBanana] Cache miss, calling API...');

      // Simulate progress (since we can't get real progress from API)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          console.log('[useNanaBanana] Progress:', newProgress);
          return newProgress;
        });
      }, 500);

      // Call API
      console.log('[useNanoBanana] Sending request to /api/nano-banana');
      const response = await fetch('/api/nano-banana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      clearInterval(progressInterval);
      setProgress(95);

      console.log('[useNanoBanana] API response status:', response.status);

      if (!response.ok) {
        console.error('[useNanoBanana] API error response:', response.status);
        const errorData = await response.json();
        console.error('[useNanoBanana] Error data:', errorData);

        const errorMessage = errorData.error || 'Generation failed';
        const userMessage = errorData.userMessage || errorMessage;

        setError(errorMessage);
        setIsGenerating(false);
        setProgress(0);
        return { success: false, error: errorMessage, userMessage };
      }

      console.log('[useNanoBanana] Parsing response...');
      const data = await response.json();
      console.log('[useNanoBanana] Response parsed:', {
        success: data.success,
        hasImage: !!data.image,
        imageSize: data.image?.length || 0
      });

      if (!data.success || !data.image) {
        console.error('[useNanoBanana] No image in successful response');
        throw new Error('No image returned');
      }

      // Cache the result
      console.log('[useNanoBanana] Caching result...');
      await cacheImage(cacheKey, data.image);
      console.log('[useNanoBanana] Image cached successfully');

      setProgress(100);
      setIsGenerating(false);

      console.log('[useNanoBanana] Generation complete!');
      return { success: true, image: data.image, cached: false };

    } catch (err) {
      console.error('[useNanoBanana] Exception during generation:', err);
      console.error('[useNanoBanana] Exception stack:', err instanceof Error ? err.stack : 'No stack');

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsGenerating(false);
      setProgress(0);

      return { success: false, error: errorMessage, userMessage: errorMessage };
    }
  }, [getCachedImage, cacheImage]);

  return {
    generate,
    isGenerating,
    progress,
    error
  };
}
