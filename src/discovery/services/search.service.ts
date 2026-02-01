import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, ObjectLiteral } from "typeorm";
import { ContentOrmEntity } from "@shared/persistence/entities/content.orm-entity";
import { ProgramOrmEntity } from "@shared/persistence/entities/program.orm-entity";
import { ContentMapper } from "@shared/persistence/mappers/content.mapper";
import { ProgramMapper } from "@shared/persistence/mappers/program.mapper";
import { Content } from "@shared/entities/content.entity";
import { Program } from "@shared/entities/program.entity";
import { Status } from "@shared/enums/status.enum";
import { Category } from "@shared/enums/category.enum";
import { ContentType } from "@shared/enums/content-type.enum";
import { ProgramType } from "@shared/enums/program-type.enum";
import { SortField, SortOrder } from "../types/search/search.type";

export interface SearchQuery {
  query?: string;
  categories?: Category[];
  contentTypes?: ContentType[];
  programTypes?: ProgramType[];
  language?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface SearchResultItem {
  content?: Content;
  program?: Program;
  score: number;
}

export interface SearchResults {
  items: SearchResultItem[];
  total: number;
}

/**
 * Search Service
 *
 * PostgreSQL full-text search implementation.
 */
@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ContentOrmEntity)
    private readonly contentRepository: Repository<ContentOrmEntity>,
    @InjectRepository(ProgramOrmEntity)
    private readonly programRepository: Repository<ProgramOrmEntity>,
  ) {}

  /**
   * Search contents using PostgreSQL full-text search
   */
  async searchContents(params: SearchQuery): Promise<{ items: Content[]; total: number }> {
    const {
      query,
      categories,
      contentTypes,
      language,
      sortBy,
      sortOrder,
      limit = 20,
      offset = 0,
    } = params;

    let qb = this.contentRepository
      .createQueryBuilder("content")
      .where("content.status = :status", { status: Status.PUBLISHED });

    // Full-text search or fallback to LIKE
    if (query) {
      qb = qb
        .addSelect("ts_rank(content.search_vector, plainto_tsquery('arabic', :query))", "rank")
        .andWhere("content.search_vector @@ plainto_tsquery('arabic', :query)", { query });
    }

    // Filters
    if (categories?.length) {
      qb = qb.andWhere("content.category IN (:...categories)", { categories });
    }
    if (contentTypes?.length) {
      qb = qb.andWhere("content.type IN (:...contentTypes)", { contentTypes });
    }
    if (language) {
      qb = qb.andWhere("content.language = :language", { language });
    }

    // Sorting - only pass hasRank=true if using FTS (which adds rank column)
    const hasRank = !!query;
    qb = this.applySorting(qb, "content", sortBy, sortOrder, hasRank);

    // Get total count
    const total = await qb.getCount();

    // Apply pagination
    qb = qb.skip(offset).take(limit);

    const results = await qb.getMany();
    return {
      items: results.map(ContentMapper.toDomain),
      total,
    };
  }

  /**
   * Search programs using PostgreSQL full-text search
   * Falls back to LIKE search if search_vector column doesn't exist
   */
  async searchPrograms(params: SearchQuery): Promise<{ items: Program[]; total: number }> {
    const {
      query,
      categories,
      programTypes,
      language,
      sortBy,
      sortOrder,
      limit = 20,
      offset = 0,
    } = params;

    let qb = this.programRepository
      .createQueryBuilder("program")
      .where("program.status = :status", { status: Status.PUBLISHED });

    // Full-text search or fallback to LIKE
    if (query) {
      qb = qb
        .addSelect("ts_rank(program.search_vector, plainto_tsquery('arabic', :query))", "rank")
        .andWhere("program.search_vector @@ plainto_tsquery('arabic', :query)", { query });
    }

    // Filters
    if (categories?.length) {
      qb = qb.andWhere("program.category IN (:...categories)", { categories });
    }
    if (programTypes?.length) {
      qb = qb.andWhere("program.type IN (:...programTypes)", { programTypes });
    }
    if (language) {
      qb = qb.andWhere("program.language = :language", { language });
    }

    // Sorting - only pass hasRank=true if using FTS (which adds rank column)
    const hasRank = !!query;
    qb = this.applySorting(qb, "program", sortBy, sortOrder, hasRank);

    // Get total count
    const total = await qb.getCount();

    // Apply pagination
    qb = qb.skip(offset).take(limit);

    const results = await qb.getMany();
    return {
      items: results.map(ProgramMapper.toDomain),
      total,
    };
  }

  /**
   * Unified search across programs and contents
   */
  async search(params: SearchQuery): Promise<SearchResults> {
    const { limit = 20, offset = 0 } = params;

    // Search both in parallel
    const [contentResults, programResults] = await Promise.all([
      this.searchContents({ ...params, limit: limit * 2, offset: 0 }),
      this.searchPrograms({ ...params, limit: limit * 2, offset: 0 }),
    ]);

    // Combine and interleave results
    const items: SearchResultItem[] = [];

    // Add programs first (higher priority)
    for (const program of programResults.items) {
      items.push({ program, score: 1.0 });
    }

    // Add contents
    for (const content of contentResults.items) {
      items.push({ content, score: 0.9 });
    }

    // Apply pagination to combined results
    const paginatedItems = items.slice(offset, offset + limit);
    const total = contentResults.total + programResults.total;

    return {
      items: paginatedItems,
      total,
    };
  }

  /**
   * Get published contents for a program
   */
  async getPublishedContentsByProgram(
    programId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ items: Content[]; total: number }> {
    const [results, total] = await this.contentRepository.findAndCount({
      where: {
        programId,
        status: Status.PUBLISHED,
      },
      order: { publishedAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return {
      items: results.map(ContentMapper.toDomain),
      total,
    };
  }

  private applySorting<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    sortBy?: SortField,
    sortOrder?: SortOrder,
    hasRank?: boolean,
  ): SelectQueryBuilder<T> {
    const order = sortOrder === SortOrder.ASC ? "ASC" : "DESC";

    switch (sortBy) {
      case SortField.TITLE:
        return qb.orderBy(`${alias}.title`, order);
      case SortField.CREATED_AT:
        return qb.orderBy(`${alias}.created_at`, order);
      case SortField.PUBLISHED_AT:
        return qb.orderBy(`${alias}.published_at`, order, "NULLS LAST");
      case SortField.RELEVANCE:
      default:
        if (hasRank) {
          return qb.orderBy("rank", "DESC");
        }
        return qb.orderBy(`${alias}.created_at`, "DESC");
    }
  }
}
