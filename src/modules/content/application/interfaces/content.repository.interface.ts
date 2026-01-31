import { Content, ContentMetadata } from '../../domain/entities/content.entity';
import { ContentType } from '../../domain/enums/content-type.enum';
import { Category } from '../../domain/enums/category.enum';
import { Status } from '../../domain/enums/status.enum';
import { Source } from '../../domain/enums/source.enum';

export interface CreateContentData {
  programId?: string | null;
  title: string;
  description?: string;
  type: ContentType;
  category: Category;
  language?: string;
  status?: Status;
  source?: Source;
  externalId?: string | null;
  metadata?: ContentMetadata;
  publishedAt?: Date | null;
}

export interface UpdateContentData {
  programId?: string | null;
  title?: string;
  description?: string;
  type?: ContentType;
  category?: Category;
  language?: string;
  status?: Status;
  source?: Source;
  externalId?: string | null;
  metadata?: ContentMetadata;
  publishedAt?: Date | null;
}

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

export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY');

export interface IContentRepository {
  create(data: CreateContentData): Promise<Content>;
  findById(id: string): Promise<Content | null>;
  findByIdWithProgram(id: string): Promise<Content | null>;
  update(id: string, data: UpdateContentData): Promise<Content | null>;
  delete(id: string): Promise<boolean>;
  findByProgramId(
    programId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>>;
  findAll(
    filter: ContentFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>>;
  findByExternalId(source: Source, externalId: string): Promise<Content | null>;
  findPublishedByProgramId(programId: string): Promise<Content[]>;
}
