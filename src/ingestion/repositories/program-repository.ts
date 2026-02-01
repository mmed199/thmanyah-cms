/**
 * Ingestion Program Repository
 *
 * TypeORM implementation of IIngestionProgramRepository.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Program } from "../../shared/entities/program.entity";
import { ProgramOrmEntity, ProgramMapper } from "../../shared/persistence";
import type { IIngestionProgramRepository } from "./program-repository.interface";

@Injectable()
export class ProgramRepository implements IIngestionProgramRepository {
  constructor(
    @InjectRepository(ProgramOrmEntity)
    private readonly repository: Repository<ProgramOrmEntity>,
  ) {}

  async findById(id: string): Promise<Program | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? ProgramMapper.toDomain(ormEntity) : null;
  }

  async save(program: Program): Promise<Program> {
    const ormEntity = this.repository.create(ProgramMapper.toOrmEntity(program));
    const saved = await this.repository.save(ormEntity);
    return ProgramMapper.toDomain(saved);
  }
}
