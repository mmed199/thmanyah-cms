/**
 * Program Repository Port
 *
 * Interface for program persistence operations.
 * Implementations are in infrastructure layer.
 */

import { Program, CreateProgramProps } from "../entities/program.entity";
import { ProgramType, Category, Status } from "../enums";

export interface ProgramFilter {
  type?: ProgramType;
  category?: Category;
  language?: string;
  status?: Status;
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

export const PROGRAM_REPOSITORY = Symbol("PROGRAM_REPOSITORY");

export interface IProgramRepository {
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
