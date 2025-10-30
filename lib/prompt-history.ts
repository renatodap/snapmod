/**
 * Prompt History - IndexedDB management for prompt history and favorites
 *
 * Handles:
 * - Saving prompt history
 * - Favoriting prompts
 * - Usage count tracking
 * - Search and filtering
 * - Auto-cleanup (max 200 items)
 */

const DB_NAME = 'snapmod-prompts';
const STORE_NAME = 'history';
const DB_VERSION = 1;
const MAX_HISTORY = 200;

export interface PromptHistoryItem {
  id: string;              // UUID
  prompt: string;          // The actual prompt text
  timestamp: number;       // Date.now()
  favorite: boolean;       // Star status
  usageCount: number;      // How many times used
  lastUsed: number;        // Last usage timestamp
}

class PromptHistory {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    console.log('[PromptHistory] Initializing IndexedDB...');

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[PromptHistory] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[PromptHistory] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('[PromptHistory] Database upgrade needed');
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('[PromptHistory] Creating object store:', STORE_NAME);
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('favorite', 'favorite', { unique: false });
          store.createIndex('lastUsed', 'lastUsed', { unique: false });
          console.log('[PromptHistory] Object store created');
        }
      };
    });
  }

  /**
   * Add a prompt to history (or increment usage if exists)
   */
  async add(prompt: string): Promise<void> {
    if (!this.db) await this.init();

    console.log('[PromptHistory] Adding prompt:', prompt.substring(0, 50));

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Check if prompt already exists
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const allItems = getAllRequest.result as PromptHistoryItem[];
        const existing = allItems.find(item => item.prompt === prompt);

        if (existing) {
          // Update existing
          console.log('[PromptHistory] Prompt exists, incrementing usage count');
          existing.usageCount++;
          existing.lastUsed = Date.now();
          store.put(existing);
        } else {
          // Add new
          console.log('[PromptHistory] Adding new prompt to history');
          const newItem: PromptHistoryItem = {
            id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            prompt,
            timestamp: Date.now(),
            favorite: false,
            usageCount: 1,
            lastUsed: Date.now()
          };

          store.put(newItem);

          // Cleanup old items
          this.cleanupOldItems(store);
        }

        resolve();
      };

      getAllRequest.onerror = () => {
        console.error('[PromptHistory] Failed to add prompt:', getAllRequest.error);
        reject(getAllRequest.error);
      };
    });
  }

  /**
   * Get all history items (sorted by most recent)
   */
  async getAll(): Promise<PromptHistoryItem[]> {
    if (!this.db) await this.init();

    console.log('[PromptHistory] Getting all history items...');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as PromptHistoryItem[];
        console.log('[PromptHistory] Found', items.length, 'history items');

        // Sort by most recent
        items.sort((a, b) => b.lastUsed - a.lastUsed);
        resolve(items);
      };

      request.onerror = () => {
        console.error('[PromptHistory] Failed to get history:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get favorites only
   */
  async getFavorites(): Promise<PromptHistoryItem[]> {
    if (!this.db) await this.init();

    console.log('[PromptHistory] Getting favorites...');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allItems = request.result as PromptHistoryItem[];
        const favorites = allItems.filter(item => item.favorite);
        console.log('[PromptHistory] Found', favorites.length, 'favorites');

        // Sort by most recent
        favorites.sort((a, b) => b.lastUsed - a.lastUsed);
        resolve(favorites);
      };

      request.onerror = () => {
        console.error('[PromptHistory] Failed to get favorites:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<void> {
    if (!this.db) await this.init();

    console.log('[PromptHistory] Toggling favorite:', id);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result as PromptHistoryItem;
        if (item) {
          item.favorite = !item.favorite;
          console.log('[PromptHistory] Favorite toggled to:', item.favorite);
          store.put(item);
          resolve();
        } else {
          reject(new Error('Item not found'));
        }
      };

      request.onerror = () => {
        console.error('[PromptHistory] Failed to toggle favorite:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a prompt from history
   */
  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    console.log('[PromptHistory] Deleting prompt:', id);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[PromptHistory] Prompt deleted');
        resolve();
      };

      request.onerror = () => {
        console.error('[PromptHistory] Failed to delete prompt:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all history (keep favorites)
   */
  async clearHistory(): Promise<void> {
    if (!this.db) await this.init();

    console.log('[PromptHistory] Clearing non-favorite history...');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as PromptHistoryItem[];
        const deletePromises = items
          .filter(item => !item.favorite)
          .map(item => store.delete(item.id));

        console.log('[PromptHistory] Deleting', deletePromises.length, 'non-favorite items');
        resolve();
      };

      request.onerror = () => {
        console.error('[PromptHistory] Failed to clear history:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Search prompts
   */
  async search(query: string): Promise<PromptHistoryItem[]> {
    const allItems = await this.getAll();
    const lowerQuery = query.toLowerCase();

    const results = allItems.filter(item =>
      item.prompt.toLowerCase().includes(lowerQuery)
    );

    console.log('[PromptHistory] Search for "' + query + '" found', results.length, 'results');
    return results;
  }

  /**
   * Cleanup old items if exceeding limit
   */
  private cleanupOldItems(store: IDBObjectStore): void {
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      console.log('[PromptHistory] Current history count:', count, '/', MAX_HISTORY);

      if (count >= MAX_HISTORY) {
        console.log('[PromptHistory] Cleanup needed, deleting oldest non-favorite items');

        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const allItems = getAllRequest.result as PromptHistoryItem[];

          // Sort by oldest first, excluding favorites
          const nonFavorites = allItems
            .filter(item => !item.favorite)
            .sort((a, b) => a.timestamp - b.timestamp);

          const deleteCount = count - MAX_HISTORY + 20; // Delete extra

          for (let i = 0; i < Math.min(deleteCount, nonFavorites.length); i++) {
            console.log('[PromptHistory] Deleting old item:', nonFavorites[i].id);
            store.delete(nonFavorites[i].id);
          }

          console.log('[PromptHistory] Cleanup complete');
        };
      }
    };
  }
}

export const promptHistory = new PromptHistory();
