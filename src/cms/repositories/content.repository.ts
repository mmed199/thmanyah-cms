/**
 * CMS Content Repository
 *
 * TypeORM implementation of IContentRepository.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Content } from "../../shared/entities/content.entity";
import { ContentOrmEntity, ContentMapper } from "../../shared/persistence";
import type { PaginationOptions, PaginatedResult } from "../../shared/types";
import type { IContentRepository, ContentFilter } from "./content.repository.interface";

@Injectable()
export class ContentRepository implements IContentRepository {
  constructor(
    @InjectRepository(ContentOrmEntity)
    private readonly repository: Repository<ContentOrmEntity>,
  ) {}

  async save(content: Content): Promise<Content> {
    const ormEntity = this.repository.create(ContentMapper.toOrmEntity(content));
    const saved = await this.repository.save(ormEntity);
    return ContentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Content | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? ContentMapper.toDomain(ormEntity) : null;
  }

  async findByIdWithProgram(id: string): Promise<Content | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
      relations: ["program"],
    });
    return ormEntity ? ContentMapper.toDomain(ormEntity) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findByProgramId(
    programId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    const [ormEntities, total] = await this.repository.findAndCount({
      where: { programId },
      take: pagination.limit,
      skip: pagination.offset,
      order: { createdAt: "DESC" },
    });

    return {
      items: ormEntities.map(ContentMapper.toDomain),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async findAll(
    filter: ContentFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    const where = this.buildWhereClause(filter);

    const [ormEntities, total] = await this.repository.findAndCount({
      where,
      take: pagination.limit,
      skip: pagination.offset,
      order: { createdAt: "DESC" },
    });

    return {
      items: ormEntities.map(ContentMapper.toDomain),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async count(filter: ContentFilter): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.repository.count({ where });
  }

  private buildWhereClause(filter: ContentFilter): FindOptionsWhere<ContentOrmEntity> {
    const where: FindOptionsWhere<ContentOrmEntity> = {};

    if (filter.programId) where.programId = filter.programId;
    if (filter.type) where.type = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.language) where.language = filter.language;
    if (filter.status) where.status = filter.status;
    if (filter.source) where.source = filter.source;

    return where;
  }
}
