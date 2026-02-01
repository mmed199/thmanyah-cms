/**
 * Discovery Cache Repository
 *
 * Redis implementation of IDiscoveryCache.
 */

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import type { IDiscoveryCache } from "./cache.interface";

@Injectable()
export class CacheRepository implements IDiscoveryCache, OnModuleDestroy {
  private readonly defaultTtl = 3600; // 1 hour

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    const ttl = ttlSeconds ?? this.defaultTtl;
    await this.redis.setex(key, ttl, serialized);
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }

  async deletePattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async onModuleDestroy(): Promise<void> {
    // Redis connection is managed by the module
  }
}
