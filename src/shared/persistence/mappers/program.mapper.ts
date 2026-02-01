/**
 * Program Mapper
 *
 * Maps between domain entity and ORM entity.
 */

import { Program } from "../../entities/program.entity";
import type { ProgramMetadata } from "../../entities/metadata";
import { ProgramOrmEntity } from "../entities/program.orm-entity";
import { ContentMapper } from "./content.mapper";

export class ProgramMapper {
  /**
   * Map ORM entity to domain entity
   */
  static toDomain(ormEntity: ProgramOrmEntity): Program {
    const program = new Program({
      id: ormEntity.id,
      title: ormEntity.title,
      description: ormEntity.description ?? undefined,
      type: ormEntity.type,
      category: ormEntity.category,
      language: ormEntity.language,
      status: ormEntity.status,
      metadata: ormEntity.metadata as ProgramMetadata | undefined,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });

    // Map contents if loaded
    if (ormEntity.contents) {
      program.contents = ormEntity.contents.map(ContentMapper.toDomain);
    }

    return program;
  }

  /**
   * Map domain entity to ORM entity (partial, for saving)
   */
  static toOrmEntity(domain: Program): Partial<ProgramOrmEntity> {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      type: domain.type,
      category: domain.category,
      language: domain.language,
      status: domain.status,
      metadata: domain.metadata,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
