/**
 * Simple in-memory cache with TTL support
 * For MVP - can be replaced with Redis or similar for production
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 60 * 1000; // 60 seconds default

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs TTL in milliseconds (optional, uses default if not provided)
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Delete all entries matching a pattern
   * @param pattern String pattern to match (supports wildcards with *)
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// Cache key helpers
export const CacheKeys = {
  partyDashboard: (userId: string) => `party:dashboard:${userId}`,
  partyMembers: (partyId: string) => `party:members:${partyId}`,
  activeMonster: (partyId: string) => `party:monster:${partyId}`,
  userBadges: (userId: string) => `user:badges:${userId}`,
  checkInStatus: (partyMemberId: string, date: string) => `checkin:status:${partyMemberId}:${date}`,
};

// Cache TTLs (in milliseconds)
export const CacheTTL = {
  party: 30 * 1000, // 30 seconds - party data changes frequently during check-ins
  monster: 60 * 1000, // 1 minute - monster HP updates during combat
  badges: 5 * 60 * 1000, // 5 minutes - badges change infrequently
  checkIn: 24 * 60 * 60 * 1000, // 24 hours - historical check-in data doesn't change
};
