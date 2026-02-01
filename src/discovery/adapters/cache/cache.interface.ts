export const DISCOVERY_CACHE = Symbol("DISCOVERY_CACHE");

/**
 * Discovery Cache Interface
 *
 * Interface for caching operations used by Discovery module.
 */
export interface IDiscoveryCache {
  /**
   * Get value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Delete value from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple values by pattern
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Check if key exists
   */
  exists(key: string): Promise<boolean>;
}
