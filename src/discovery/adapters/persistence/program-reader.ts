import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Program } from "@shared/entities/program.entity";
import { Status } from "@shared/enums";
import { ProgramOrmEntity, ProgramMapper, ContentMapper } from "@shared/persistence";
import type { PaginationOptions, PaginatedResult } from "@shared/types";
import type { IDiscoveryProgramReader, ProgramReadFilter } from "./program-reader.interface";

/**
 * Discovery Program Reader Repository
 *
 * Only returns published programs for consumer-facing API.
 */
@Injectable()
export class ProgramReader implements IDiscoveryProgramReader {
  constructor(
    @InjectRepository(ProgramOrmEntity)
    private readonly repository: Repository<ProgramOrmEntity>,
  ) {}

  async findById(id: string): Promise<Program | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, status: Status.PUBLISHED },
    });
    return ormEntity ? ProgramMapper.toDomain(ormEntity) : null;
  }

  async findByIdWithContents(id: string): Promise<Program | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, status: Status.PUBLISHED },
      relations: ["contents"],
    });

    if (!ormEntity) return null;

    const program = ProgramMapper.toDomain(ormEntity);

    // Only include published contents
    if (ormEntity.contents) {
      program.contents = ormEntity.contents
        .filter((c) => c.status === Status.PUBLISHED)
        .map(ContentMapper.toDomain);
    }

    return program;
  }

  async findAll(
    filter: ProgramReadFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Program>> {
    const where = this.buildWhereClause(filter);

    const [ormEntities, total] = await this.repository.findAndCount({
      where,
      take: pagination.limit,
      skip: pagination.offset,
      order: { createdAt: "DESC" },
    });

    return {
      items: ormEntities.map(ProgramMapper.toDomain),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  private buildWhereClause(filter: ProgramReadFilter): FindOptionsWhere<ProgramOrmEntity> {
    const where: FindOptionsWhere<ProgramOrmEntity> = {
      status: Status.PUBLISHED,
    };

    if (filter.type) where.type = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.language) where.language = filter.language;

    return where;
  }
}
