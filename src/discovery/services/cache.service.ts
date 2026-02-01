import { Injectable, Inject } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import type { IDiscoveryCache } from "../adapters/cache/cache.interface";
import { DISCOVERY_CACHE } from "../adapters/cache/cache.interface";
import {
  ProgramCreatedEvent,
  ProgramUpdatedEvent,
  ProgramDeletedEvent,
} from "@shared/events/program";
import {
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentPublishedEvent,
  ContentArchivedEvent,
  ContentDeletedEvent,
} from "@shared/events/content";

// Cache key prefixes
const CACHE_KEYS = {
  PROGRAM: "discovery:program:",
  CONTENT: "discovery:content:",
  PROGRAM_CONTENTS: "discovery:program_contents:",
  SEARCH: "discovery:search:",
  PROGRAMS_LIST: "discovery:programs:",
  CONTENTS_LIST: "discovery:contents:",
};

// TTL in seconds
const CACHE_TTL = {
  ENTITY: 3600, // 1 hour for single entities
  LIST: 300, // 5 minutes for lists
  SEARCH: 180, // 3 minutes for search results
};

/**
 * Cache Service
 *
 * Read-through caching for Discovery API with event-driven invalidation.
 */
@Injectable()
export class CacheService {
  constructor(
    @Inject(DISCOVERY_CACHE)
    private readonly cache: IDiscoveryCache,
  ) {}

  // Program Caching
  async getProgram<T>(id: string): Promise<T | null> {
    return this.cache.get<T>(`${CACHE_KEYS.PROGRAM}${id}`);
  }

  async setProgram<T>(id: string, program: T): Promise<void> {
    await this.cache.set(`${CACHE_KEYS.PROGRAM}${id}`, program, CACHE_TTL.ENTITY);
  }

  async getProgramContents<T>(programId: string): Promise<T | null> {
    return this.cache.get<T>(`${CACHE_KEYS.PROGRAM_CONTENTS}${programId}`);
  }

  async setProgramContents<T>(programId: string, contents: T): Promise<void> {
    await this.cache.set(`${CACHE_KEYS.PROGRAM_CONTENTS}${programId}`, contents, CACHE_TTL.LIST);
  }

  // Content Caching
  async getContent<T>(id: string): Promise<T | null> {
    return this.cache.get<T>(`${CACHE_KEYS.CONTENT}${id}`);
  }

  async setContent<T>(id: string, content: T): Promise<void> {
    await this.cache.set(`${CACHE_KEYS.CONTENT}${id}`, content, CACHE_TTL.ENTITY);
  }

  // Search Caching
  async getSearchResults<T>(cacheKey: string): Promise<T | null> {
    return this.cache.get<T>(`${CACHE_KEYS.SEARCH}${cacheKey}`);
  }

  async setSearchResults<T>(cacheKey: string, results: T): Promise<void> {
    await this.cache.set(`${CACHE_KEYS.SEARCH}${cacheKey}`, results, CACHE_TTL.SEARCH);
  }

  /**
   * Generate a cache key from search parameters
   */
  generateSearchKey(params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          if (params[key] !== undefined && params[key] !== null) {
            acc[key] = params[key];
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );
    return Buffer.from(JSON.stringify(sorted)).toString("base64");
  }

  // Event Handlers for Cache Invalidation

  @OnEvent("program.created")
  async handleProgramCreated(_event: ProgramCreatedEvent): Promise<void> {
    // Invalidate program list caches
    await this.cache.deletePattern(`${CACHE_KEYS.PROGRAMS_LIST}*`);
    await this.cache.deletePattern(`${CACHE_KEYS.SEARCH}*`);
  }

  @OnEvent("program.updated")
  async handleProgramUpdated(event: ProgramUpdatedEvent): Promise<void> {
    // Invalidate specific program and lists
    await this.cache.delete(`${CACHE_KEYS.PROGRAM}${event.programId}`);
    await this.cache.deletePattern(`${CACHE_KEYS.PROGRAMS_LIST}*`);
    await this.cache.deletePattern(`${CACHE_KEYS.SEARCH}*`);
  }

  @OnEvent("program.deleted")
  async handleProgramDeleted(event: ProgramDeletedEvent): Promise<void> {
    // Invalidate program and all related caches
    await this.cache.delete(`${CACHE_KEYS.PROGRAM}${event.programId}`);
    await this.cache.delete(`${CACHE_KEYS.PROGRAM_CONTENTS}${event.programId}`);
    await this.cache.deletePattern(`${CACHE_KEYS.PROGRAMS_LIST}*`);
    await this.cache.deletePattern(`${CACHE_KEYS.SEARCH}*`);
  }

  @OnEvent("content.created")
  async handleContentCreated(event: ContentCreatedEvent): Promise<void> {
    // Invalidate content lists and parent program contents
    await this.cache.deletePattern(`${CACHE_KEYS.CONTENTS_LIST}*`);
    await this.cache.deletePattern(`${CACHE_KEYS.SEARCH}*`);
    if (event.programId) {
      await this.cache.delete(`${CACHE_KEYS.PROGRAM_CONTENTS}${event.programId}`);
    }
  }

  @OnEvent("content.updated")
  async handleContentUpdated(event: ContentUpdatedEvent): Promise<void> {
    await this.cache.delete(`${CACHE_KEYS.CONTENT}${event.contentId}`);
    await this.cache.deletePattern(`${CACHE_KEYS.CONTENTS_LIST}*`);
    await this.cache.deletePattern(`${CACHE_KEYS.SEARCH}*`);
  }

  @OnEvent("content.published")
  async handleContentPublished(event: ContentPublishedEvent): Promise<void> {
    await this.cache.delete(`${CACHE_KEYS.CONTENT}${event.contentId}`);
    await this.cache.deletePattern(`${CACHE_KEYS.CONTENTS_LIST}*`);
    await this.cache.deletePattern(`${CACHE_KEYS.SEARCH}*`);
    if (event.programId) {
      await this.cache.delete(`${CACHE_KEYS.PROGRAM_CONTENTS}${event.programId}`);
    }
  }

  @OnEvent("content.archived")
  async handleContentArchived(event: ContentArchivedEvent): Promise<void> {
    await this.cache.delete(`${CACHE_KEYS.CONTENT}${event.contentId}`);
    await this.cache.deletePattern(`${CACHE_KEYS.CONTENTS_LIST}*`);
    await this.cache.deletePattern(`${CACHE_KEYS.SEARCH}*`);
    if (event.programId) {
      await this.cache.delete(`${CACHE_KEYS.PROGRAM_CONTENTS}${event.programId}`);
    }
  }

  @OnEvent("content.deleted")
  async handleContentDeleted(event: ContentDeletedEvent): Promise<void> {
    await this.cache.delete(`${CACHE_KEYS.CONTENT}${event.contentId}`);
    await this.cache.deletePattern(`${CACHE_KEYS.CONTENTS_LIST}*`);
    await this.cache.deletePattern(`${CACHE_KEYS.SEARCH}*`);
    if (event.programId) {
      await this.cache.delete(`${CACHE_KEYS.PROGRAM_CONTENTS}${event.programId}`);
    }
  }
}
