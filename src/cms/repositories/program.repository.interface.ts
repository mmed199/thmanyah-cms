/**
 * CMS Program Repository Interface
 *
 * Interface for program persistence operations used by CMS module.
 * Full CRUD access for program management.
 */

import { Program } from "../../shared/entities/program.entity";
import { ProgramType, Category, Status } from "../../shared/enums";
import type { PaginationOptions, PaginatedResult } from "../../shared/types";

export interface ProgramFilter {
  type?: ProgramType;
  category?: Category;
  language?: string;
  status?: Status;
}

export const CMS_PROGRAM_REPOSITORY = Symbol("CMS_PROGRAM_REPOSITORY");

export interface ICmsProgramRepository {
  /**
   * Save a program (create or update)
   */
  save(program: Program): Promise<Program>;

  /**
   * Find program by ID
   */
  findById(id: string): Promise<Program | null>;

  /**
   * Find program by ID with its contents
   */
  findByIdWithContents(id: string): Promise<Program | null>;

  /**
   * Delete program by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Find all programs with optional filtering and pagination
   */
  findAll(filter: ProgramFilter, pagination: PaginationOptions): Promise<PaginatedResult<Program>>;

  /**
   * Count programs matching filter
   */
  count(filter: ProgramFilter): Promise<number>;
}
