/**
 * CMS Program Repository
 *
 * TypeORM implementation of ICmsProgramRepository.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Program } from "../../shared/entities/program.entity";
import { ProgramOrmEntity, ProgramMapper } from "../../shared/persistence";
import type { PaginationOptions, PaginatedResult } from "../../shared/types";
import type { ICmsProgramRepository, ProgramFilter } from "./program.repository.interface";

@Injectable()
export class ProgramRepository implements ICmsProgramRepository {
  constructor(
    @InjectRepository(ProgramOrmEntity)
    private readonly repository: Repository<ProgramOrmEntity>,
  ) {}

  async save(program: Program): Promise<Program> {
    const ormEntity = this.repository.create(ProgramMapper.toOrmEntity(program));
    const saved = await this.repository.save(ormEntity);
    return ProgramMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Program | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? ProgramMapper.toDomain(ormEntity) : null;
  }

  async findByIdWithContents(id: string): Promise<Program | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
      relations: ["contents"],
    });
    return ormEntity ? ProgramMapper.toDomain(ormEntity) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAll(
    filter: ProgramFilter,
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

  async count(filter: ProgramFilter): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.repository.count({ where });
  }

  private buildWhereClause(filter: ProgramFilter): FindOptionsWhere<ProgramOrmEntity> {
    const where: FindOptionsWhere<ProgramOrmEntity> = {};

    if (filter.type) where.type = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.language) where.language = filter.language;
    if (filter.status) where.status = filter.status;

    return where;
  }
}
