/**
 * Ingestion Interfaces
 *
 * Strategy pattern types for content ingestion from external sources.
 */

import { Source } from "@shared/enums";

// Re-export DTO interfaces for service use
export type { ImportRequestInput as ImportRequest } from "../dto/import/import-request.dto";
export type { ImportResultResponse as ImportResult } from "../dto/import/import-response.dto";

/**
 * Raw content data from external source before transformation
 */
export interface ExternalContentItem {
  externalId: string;
  title: string;
  description?: string;
  publishedAt?: Date;
  duration?: number;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of fetching from external source
 */
export interface FetchResult {
  items: ExternalContentItem[];
  nextPageToken?: string;
  totalResults?: number;
}

/**
 * Options for fetching content
 */
export interface FetchOptions {
  maxResults?: number;
  pageToken?: string;
  publishedAfter?: Date;
}

/**
 * Ingestion strategy interface
 * Each external source (YouTube, RSS, etc.) implements this
 */
export interface IIngestionStrategy {
  readonly source: Source;

  /**
   * Fetch content from external source
   */
  fetch(channelId: string, options?: FetchOptions): Promise<FetchResult>;

  /**
   * Get channel/program metadata
   */
  getChannelInfo?(channelId: string): Promise<{
    title: string;
    description?: string;
    thumbnailUrl?: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Token for DI - strategy registry
 */
export const INGESTION_STRATEGIES = Symbol("INGESTION_STRATEGIES");
