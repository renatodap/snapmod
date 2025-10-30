import { useCallback } from 'react';
import { cacheManager } from '@/lib/cache-manager';

export function useImageCache() {
  const getCachedImage = useCallback(async (key: string): Promise<string | null> => {
    try {
      return await cacheManager.get(key);
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }, []);

  const cacheImage = useCallback(async (key: string, image: string): Promise<void> => {
    try {
      await cacheManager.set(key, image);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await cacheManager.clear();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  const getAllCachedKeys = useCallback(async (): Promise<string[]> => {
    try {
      return await cacheManager.getAllKeys();
    } catch (error) {
      console.error('Failed to get cached keys:', error);
      return [];
    }
  }, []);

  return {
    getCachedImage,
    cacheImage,
    clearCache,
    getAllCachedKeys
  };
}
