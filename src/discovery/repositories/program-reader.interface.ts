/**
 * Discovery Program Reader Interface
 *
 * Read-only interface for program queries used by Discovery module.
 * Only exposes published programs for consumer-facing API.
 */

import { Program } from "../../shared/entities/program.entity";
import { ProgramType, Category } from "../../shared/enums";
import type { PaginationOptions, PaginatedResult } from "../../shared/types";

export interface ProgramReadFilter {
  type?: ProgramType;
  category?: Category;
  language?: string;
}

export const DISCOVERY_PROGRAM_READER = Symbol("DISCOVERY_PROGRAM_READER");

export interface IDiscoveryProgramReader {
  /**
   * Find published program by ID
   */
  findById(id: string): Promise<Program | null>;

  /**
   * Find published program by ID with its contents
   */
  findByIdWithContents(id: string): Promise<Program | null>;

  /**
   * Find all published programs with optional filtering
   */
  findAll(
    filter: ProgramReadFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Program>>;
}
