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
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CachedImage | undefined;
        resolve(result?.image || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, image: string): Promise<void> {
    if (!this.db) await this.init();

    // Estimate size (rough approximation)
    const size = new Blob([image]).size;

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
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async cleanupOldEntries(store: IDBObjectStore): Promise<void> {
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result >= MAX_CACHE_SIZE) {
        const index = store.index('timestamp');
        const cursorRequest = index.openCursor();

        let deleteCount = countRequest.result - MAX_CACHE_SIZE + 10; // Delete extra

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && deleteCount > 0) {
            store.delete(cursor.primaryKey);
            deleteCount--;
            cursor.continue();
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
