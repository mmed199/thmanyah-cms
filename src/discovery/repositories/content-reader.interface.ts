/**
 * Discovery Content Reader Interface
 *
 * Read-only interface for content queries used by Discovery module.
 * Only exposes published content for consumer-facing API.
 */

import { Content } from "../../shared/entities/content.entity";
import { ContentType, Category } from "../../shared/enums";
import type { PaginationOptions, PaginatedResult } from "../../shared/types";

export interface ContentReadFilter {
  programId?: string;
  type?: ContentType;
  category?: Category;
  language?: string;
}

export const DISCOVERY_CONTENT_READER = Symbol("DISCOVERY_CONTENT_READER");

export interface IDiscoveryContentReader {
  /**
   * Find published content by ID
   */
  findById(id: string): Promise<Content | null>;

  /**
   * Find published content by ID with its program
   */
  findByIdWithProgram(id: string): Promise<Content | null>;

  /**
   * Find all published content for a program
   */
  findByProgramId(
    programId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>>;

  /**
   * Find all published content with optional filtering
   */
  findAll(
    filter: ContentReadFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>>;
}
