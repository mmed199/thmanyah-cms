/**
 * Content Repository Port
 *
 * Interface for content persistence operations.
 * Implementations are in infrastructure layer.
 */

import { Content } from "../entities/content.entity";
import { ContentType, Category, Status, Source } from "../enums";

export interface ContentFilter {
  programId?: string;
  type?: ContentType;
  category?: Category;
  language?: string;
  status?: Status;
  source?: Source;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const CONTENT_REPOSITORY = Symbol("CONTENT_REPOSITORY");

export interface IContentRepository {
  /**
   * Save content (create or update)
   */
  save(content: Content): Promise<Content>;

  /**
   * Find content by ID
   */
  findById(id: string): Promise<Content | null>;

  /**
   * Find content by ID with its program
   */
  findByIdWithProgram(id: string): Promise<Content | null>;

  /**
   * Delete content by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Find all content for a program
   */
  findByProgramId(
    programId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>>;

  /**
   * Find all content with optional filtering and pagination
   */
  findAll(filter: ContentFilter, pagination: PaginationOptions): Promise<PaginatedResult<Content>>;

  /**
   * Find content by external ID and source (for idempotent imports)
   */
  findByExternalId(source: Source, externalId: string): Promise<Content | null>;

  /**
   * Find all published content for a program
   */
  findPublishedByProgramId(programId: string): Promise<Content[]>;

  /**
   * Count content matching filter
   */
  count(filter: ContentFilter): Promise<number>;
}
