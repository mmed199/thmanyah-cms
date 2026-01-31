/**
 * Cache Port
 *
 * Interface for caching operations.
 * Used by Discovery module for read optimization.
 */

export const CACHE_PORT = Symbol("CACHE_PORT");

export interface ICachePort {
  /**
   * Get a value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Delete a key from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple keys matching a pattern
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Check if a key exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get remaining TTL for a key (in seconds)
   */
  ttl(key: string): Promise<number>;
}
