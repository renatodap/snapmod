/**
 * Version Storage - IndexedDB management for photo versions
 *
 * Handles:
 * - Saving/loading versions
 * - Auto-cleanup (max 50 versions per session)
 * - Compression and optimization
 * - Error handling and logging
 */

import type { FilterState } from './types/filters';

const DB_NAME = 'snapmod-versions';
const STORE_NAME = 'versions';
const DB_VERSION = 1;
const MAX_VERSIONS = 50;

export interface Version {
  id: string;                    // UUID
  prompt?: string;               // Prompt used (for AI edits)
  image: string;                 // Base64 data URL
  timestamp: number;             // Date.now()
  sessionId: string;             // Group by photo session
  filterState?: FilterState;     // Filter values (for manual edits)
  isAiGenerated: boolean;        // True = AI edit, False = manual filter
}

class VersionStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    console.log('[VersionStorage] Initializing IndexedDB...');

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[VersionStorage] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[VersionStorage] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('[VersionStorage] Database upgrade needed');
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('[VersionStorage] Creating object store:', STORE_NAME);
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('[VersionStorage] Object store created');
        }
      };
    });
  }

  /**
   * Save a version
   */
  async save(version: Version): Promise<void> {
    if (!this.db) await this.init();

    console.log('[VersionStorage] Saving version:', {
      id: version.id,
      sessionId: version.sessionId,
      promptLength: version.prompt?.length || 0,
      imageSize: version.image.length,
      isAiGenerated: version.isAiGenerated
    });

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Cleanup old versions for this session
      this.cleanupOldVersions(store, version.sessionId);

      const request = store.put(version);

      request.onsuccess = () => {
        console.log('[VersionStorage] Version saved successfully:', version.id);
        resolve();
      };

      request.onerror = () => {
        console.error('[VersionStorage] Failed to save version:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all versions for a session
   */
  async getBySession(sessionId: string): Promise<Version[]> {
    if (!this.db) await this.init();

    console.log('[VersionStorage] Getting versions for session:', sessionId);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onsuccess = () => {
        const versions = request.result as Version[];
        console.log('[VersionStorage] Found', versions.length, 'versions');

        // Sort by timestamp (oldest first)
        versions.sort((a, b) => a.timestamp - b.timestamp);
        resolve(versions);
      };

      request.onerror = () => {
        console.error('[VersionStorage] Failed to get versions:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a specific version
   */
  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();

    console.log('[VersionStorage] Deleting version:', id);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[VersionStorage] Version deleted:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[VersionStorage] Failed to delete version:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all versions for a session
   */
  async clearSession(sessionId: string): Promise<void> {
    if (!this.db) await this.init();

    console.log('[VersionStorage] Clearing session:', sessionId);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.openCursor(sessionId);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          console.log('[VersionStorage] Session cleared');
          resolve();
        }
      };

      request.onerror = () => {
        console.error('[VersionStorage] Failed to clear session:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Cleanup old versions if exceeding limit
   */
  private async cleanupOldVersions(store: IDBObjectStore, sessionId: string): Promise<void> {
    const index = store.index('sessionId');
    const countRequest = index.count(sessionId);

    countRequest.onsuccess = () => {
      const count = countRequest.result;
      console.log('[VersionStorage] Current version count for session:', count, '/', MAX_VERSIONS);

      if (count >= MAX_VERSIONS) {
        console.log('[VersionStorage] Cleanup needed, deleting oldest versions');

        const cursorRequest = index.openCursor(sessionId);
        let deleteCount = count - MAX_VERSIONS + 10; // Delete extra to avoid frequent cleanup

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && deleteCount > 0) {
            console.log('[VersionStorage] Deleting old version:', cursor.primaryKey);
            store.delete(cursor.primaryKey);
            deleteCount--;
            cursor.continue();
          } else {
            console.log('[VersionStorage] Cleanup complete');
          }
        };
      }
    };
  }

  /**
   * Get storage stats
   */
  async getStats(): Promise<{ totalVersions: number; totalSize: number }> {
    if (!this.db) await this.init();

    console.log('[VersionStorage] Getting storage stats...');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const versions = request.result as Version[];
        const totalSize = versions.reduce((sum, v) => sum + v.image.length, 0);

        console.log('[VersionStorage] Stats:', {
          totalVersions: versions.length,
          totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
        });

        resolve({ totalVersions: versions.length, totalSize });
      };

      request.onerror = () => {
        console.error('[VersionStorage] Failed to get stats:', request.error);
        reject(request.error);
      };
    });
  }
}

export const versionStorage = new VersionStorage();
