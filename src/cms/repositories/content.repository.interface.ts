/**
 * CMS Content Repository Interface
 *
 * Interface for content persistence operations used by CMS module.
 * Full CRUD access for content management.
 */

import { Content } from "../../shared/entities/content.entity";
import { ContentType, Category, Status, Source } from "../../shared/enums";
import type { PaginationOptions, PaginatedResult } from "../../shared/types";

export interface ContentFilter {
  programId?: string;
  type?: ContentType;
  category?: Category;
  language?: string;
  status?: Status;
  source?: Source;
}

export const CMS_CONTENT_REPOSITORY = Symbol("CMS_CONTENT_REPOSITORY");

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
   * Count content matching filter
   */
  count(filter: ContentFilter): Promise<number>;
}
