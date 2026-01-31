import { Program, ProgramMetadata } from '../../domain/entities/program.entity';
import { ProgramType } from '../../domain/enums/program-type.enum';
import { Category } from '../../domain/enums/category.enum';
import { Status } from '../../domain/enums/status.enum';

export interface CreateProgramData {
  title: string;
  description?: string;
  type: ProgramType;
  category: Category;
  language?: string;
  status?: Status;
  metadata?: ProgramMetadata;
}

export interface UpdateProgramData {
  title?: string;
  description?: string;
  type?: ProgramType;
  category?: Category;
  language?: string;
  status?: Status;
  metadata?: ProgramMetadata;
}

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

export const PROGRAM_REPOSITORY = Symbol('PROGRAM_REPOSITORY');

export interface IProgramRepository {
  create(data: CreateProgramData): Promise<Program>;
  findById(id: string): Promise<Program | null>;
  findByIdWithContents(id: string): Promise<Program | null>;
  update(id: string, data: UpdateProgramData): Promise<Program | null>;
  delete(id: string): Promise<boolean>;
  findAll(
    filter: ProgramFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Program>>;
}
