/**
 * Discovery Content Reader Repository
 *
 * TypeORM implementation of IDiscoveryContentReader.
 * Only returns published content for consumer-facing API.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Content } from "../../shared/entities/content.entity";
import { Status } from "../../shared/enums";
import { ContentOrmEntity, ContentMapper } from "../../shared/persistence";
import type { PaginationOptions, PaginatedResult } from "../../shared/types";
import type { IDiscoveryContentReader, ContentReadFilter } from "./content-reader.interface";

@Injectable()
export class ContentReader implements IDiscoveryContentReader {
  constructor(
    @InjectRepository(ContentOrmEntity)
    private readonly repository: Repository<ContentOrmEntity>,
  ) {}

  async findById(id: string): Promise<Content | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, status: Status.PUBLISHED },
    });
    return ormEntity ? ContentMapper.toDomain(ormEntity) : null;
  }

  async findByIdWithProgram(id: string): Promise<Content | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, status: Status.PUBLISHED },
      relations: ["program"],
    });
    return ormEntity ? ContentMapper.toDomain(ormEntity) : null;
  }

  async findByProgramId(
    programId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    const [ormEntities, total] = await this.repository.findAndCount({
      where: { programId, status: Status.PUBLISHED },
      take: pagination.limit,
      skip: pagination.offset,
      order: { publishedAt: "DESC" },
    });

    return {
      items: ormEntities.map(ContentMapper.toDomain),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async findAll(
    filter: ContentReadFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    const where = this.buildWhereClause(filter);

    const [ormEntities, total] = await this.repository.findAndCount({
      where,
      take: pagination.limit,
      skip: pagination.offset,
      order: { publishedAt: "DESC" },
    });

    return {
      items: ormEntities.map(ContentMapper.toDomain),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  private buildWhereClause(filter: ContentReadFilter): FindOptionsWhere<ContentOrmEntity> {
    const where: FindOptionsWhere<ContentOrmEntity> = {
      status: Status.PUBLISHED,
    };

    if (filter.programId) where.programId = filter.programId;
    if (filter.type) where.type = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.language) where.language = filter.language;

    return where;
  }
}
