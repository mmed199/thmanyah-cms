/**
 * Ingestion Content Writer Interface
 *
 * Interface for content write operations used by Ingestion module.
 * Focused on creating content from external sources.
 */

import { Content } from "@shared/entities/content.entity";
import { Source } from "@shared/enums";

export const INGESTION_CONTENT_WRITER = Symbol("INGESTION_CONTENT_WRITER");

export interface IIngestionContentWriter {
  /**
   * Save content (create or update)
   */
  save(content: Content): Promise<Content>;

  /**
   * Find content by external ID (for idempotent imports)
   */
  findByExternalId(source: Source, externalId: string): Promise<Content | null>;
}
