// lib/sprites/SpriteCache.ts
// Multi-level caching system for generated sprites

import { dataURLToCanvas, canvasToDataURL } from '../utils/canvas-helpers';

export class SpriteCache {
  // Level 1: In-memory cache (fastest)
  private memoryCache: Map<string, HTMLCanvasElement> = new Map();

  // Level 2: Session storage (persists across page loads in same session)
  private readonly SESSION_PREFIX = 'sprite-cache-';

  // Level 3: IndexedDB (for large sprite collections)
  private db: IDBDatabase | null = null;
  private dbInitialized: boolean = false;

  // Cache limits
  private readonly MAX_MEMORY_CACHE_SIZE = 50;
  private readonly MAX_SESSION_STORAGE_SIZE = 20;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Get cached sprite (checks all cache levels)
   */
  async get(key: string): Promise<HTMLCanvasElement | null> {
    // Level 1: Memory cache (fastest)
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)!;
    }

    // Level 2: Session storage
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_PREFIX + key);
      if (sessionData) {
        const canvas = await dataURLToCanvas(sessionData);
        // Promote to L1 cache
        this.setMemoryCache(key, canvas);
        return canvas;
      }
    } catch (error) {
      console.warn('Session storage read failed:', error);
    }

    // Level 3: IndexedDB
    if (this.dbInitialized) {
      const dbData = await this.getFromIndexedDB(key);
      if (dbData) {
        const canvas = await dataURLToCanvas(dbData);
        // Promote to L1 cache
        this.setMemoryCache(key, canvas);
        return canvas;
      }
    }

    return null;
  }

  /**
   * Set cached sprite (stores in all appropriate levels)
   */
  async set(key: string, canvas: HTMLCanvasElement): Promise<void> {
    // Level 1: Memory cache (always)
    this.setMemoryCache(key, canvas);

    // Level 2: Session storage (with size check)
    try {
      if (this.memoryCache.size <= this.MAX_SESSION_STORAGE_SIZE) {
        const dataURL = canvasToDataURL(canvas);
        sessionStorage.setItem(this.SESSION_PREFIX + key, dataURL);
      }
    } catch (error) {
      console.warn('Session storage write failed (likely full):', error);
    }

    // Level 3: IndexedDB (asynchronous, don't wait)
    if (this.dbInitialized) {
      const dataURL = canvasToDataURL(canvas);
      this.setInIndexedDB(key, dataURL).catch((error) => {
        console.warn('IndexedDB write failed:', error);
      });
    }
  }

  /**
   * Check if key exists in any cache level
   */
  async has(key: string): Promise<boolean> {
    // Check L1
    if (this.memoryCache.has(key)) {
      return true;
    }

    // Check L2
    try {
      if (sessionStorage.getItem(this.SESSION_PREFIX + key)) {
        return true;
      }
    } catch (error) {
      // Ignore
    }

    // Check L3
    if (this.dbInitialized) {
      const data = await this.getFromIndexedDB(key);
      return data !== null;
    }

    return false;
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    // Clear L1
    this.memoryCache.clear();

    // Clear L2
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(this.SESSION_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }

    // Clear L3
    if (this.db) {
      try {
        const transaction = this.db.transaction(['sprites'], 'readwrite');
        const store = transaction.objectStore('sprites');
        store.clear();
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memorySize: number;
    sessionSize: number;
    dbAvailable: boolean;
  } {
    let sessionSize = 0;
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(this.SESSION_PREFIX)) {
          sessionSize++;
        }
      });
    } catch (error) {
      // Ignore
    }

    return {
      memorySize: this.memoryCache.size,
      sessionSize,
      dbAvailable: this.dbInitialized,
    };
  }

  /**
   * Set item in memory cache with LRU eviction
   */
  private setMemoryCache(key: string, canvas: HTMLCanvasElement): void {
    // Remove if exists (to update position)
    this.memoryCache.delete(key);

    // Evict oldest if at capacity
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, canvas);
  }

  /**
   * Initialize IndexedDB
   */
  private initIndexedDB(): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      console.warn('IndexedDB not available');
      return;
    }

    try {
      const request = indexedDB.open('FitnessQuestSprites', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('sprites')) {
          db.createObjectStore('sprites', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.dbInitialized = true;
      };

      request.onerror = (event) => {
        console.warn('IndexedDB initialization failed:', event);
        this.dbInitialized = false;
      };
    } catch (error) {
      console.warn('IndexedDB not available:', error);
      this.dbInitialized = false;
    }
  }

  /**
   * Get item from IndexedDB
   */
  private async getFromIndexedDB(key: string): Promise<string | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['sprites'], 'readonly');
        const store = transaction.objectStore('sprites');
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result?.dataURL || null);
        };

        request.onerror = () => {
          console.warn('IndexedDB read failed');
          resolve(null);
        };
      } catch (error) {
        console.warn('IndexedDB read error:', error);
        resolve(null);
      }
    });
  }

  /**
   * Set item in IndexedDB
   */
  private async setInIndexedDB(key: string, dataURL: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(['sprites'], 'readwrite');
        const store = transaction.objectStore('sprites');
        const request = store.put({
          key,
          dataURL,
          timestamp: Date.now(),
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('IndexedDB write failed'));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbInitialized = false;
    }
  }
}

// Singleton instance
let cacheInstance: SpriteCache | null = null;

/**
 * Get singleton sprite cache instance
 */
export function getSpriteCache(): SpriteCache {
  if (!cacheInstance) {
    cacheInstance = new SpriteCache();
  }
  return cacheInstance;
}
