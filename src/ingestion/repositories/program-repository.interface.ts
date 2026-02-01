/**
 * Ingestion Program Repository Interface
 *
 * Interface for program operations used by Ingestion module.
 * Only needs to verify programs exist and create new ones.
 */

import { Program } from "../../shared/entities/program.entity";

export const INGESTION_PROGRAM_REPOSITORY = Symbol("INGESTION_PROGRAM_REPOSITORY");

export interface IIngestionProgramRepository {
  /**
   * Find program by ID
   */
  findById(id: string): Promise<Program | null>;

  /**
   * Save program (create or update)
   */
  save(program: Program): Promise<Program>;
}
