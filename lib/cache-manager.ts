const DB_NAME = 'snapmod-cache';
const STORE_NAME = 'images';
const DB_VERSION = 1;
const MAX_CACHE_SIZE = 50; // Maximum number of cached images

interface CachedImage {
  key: string;
  image: string; // base64 or URL
  timestamp: number;
  size: number;
}

class CacheManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    console.log('[CacheManager] Initializing IndexedDB...');
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[CacheManager] Failed to open database:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[CacheManager] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('[CacheManager] Database upgrade needed');
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('[CacheManager] Creating object store:', STORE_NAME);
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('[CacheManager] Object store created');
        }
      };
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.db) await this.init();

    console.log('[CacheManager] Getting cached image for key:', key.substring(0, 100));
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CachedImage | undefined;
        if (result) {
          console.log('[CacheManager] Cache hit! Image size:', result.size, 'Age:', Date.now() - result.timestamp, 'ms');
        } else {
          console.log('[CacheManager] Cache miss');
        }
        resolve(result?.image || null);
      };
      request.onerror = () => {
        console.error('[CacheManager] Error getting from cache:', request.error);
        reject(request.error);
      };
    });
  }

  async set(key: string, image: string): Promise<void> {
    if (!this.db) await this.init();

    console.log('[CacheManager] Caching image for key:', key.substring(0, 100));

    // Estimate size (rough approximation)
    const size = new Blob([image]).size;
    console.log('[CacheManager] Image size:', size, 'bytes');

    const cachedImage: CachedImage = {
      key,
      image,
      timestamp: Date.now(),
      size
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Check cache size and cleanup if needed
      this.cleanupOldEntries(store);

      const request = store.put(cachedImage);
      request.onsuccess = () => {
        console.log('[CacheManager] Image cached successfully');
        resolve();
      };
      request.onerror = () => {
        console.error('[CacheManager] Error caching image:', request.error);
        reject(request.error);
      };
    });
  }

  private async cleanupOldEntries(store: IDBObjectStore): Promise<void> {
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const cacheCount = countRequest.result;
      console.log('[CacheManager] Current cache size:', cacheCount, '/', MAX_CACHE_SIZE);

      if (cacheCount >= MAX_CACHE_SIZE) {
        console.log('[CacheManager] Cache full, cleaning up old entries...');
        const index = store.index('timestamp');
        const cursorRequest = index.openCursor();

        let deleteCount = cacheCount - MAX_CACHE_SIZE + 10; // Delete extra
        console.log('[CacheManager] Will delete', deleteCount, 'old entries');

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && deleteCount > 0) {
            console.log('[CacheManager] Deleting old entry:', cursor.primaryKey);
            store.delete(cursor.primaryKey);
            deleteCount--;
            cursor.continue();
          } else {
            console.log('[CacheManager] Cleanup complete');
          }
        };
      }
    };
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
}

export const cacheManager = new CacheManager();
