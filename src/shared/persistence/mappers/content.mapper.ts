/**
 * Content Mapper
 *
 * Maps between domain entity and ORM entity.
 */

import { Content } from "../../entities/content.entity";
import type { ContentMetadata } from "../../entities/metadata";
import { ContentOrmEntity } from "../entities/content.orm-entity";

export class ContentMapper {
  /**
   * Map ORM entity to domain entity
   */
  static toDomain(ormEntity: ContentOrmEntity): Content {
    return new Content({
      id: ormEntity.id,
      programId: ormEntity.programId,
      title: ormEntity.title,
      description: ormEntity.description ?? undefined,
      type: ormEntity.type,
      category: ormEntity.category,
      language: ormEntity.language,
      status: ormEntity.status,
      source: ormEntity.source,
      externalId: ormEntity.externalId,
      metadata: ormEntity.metadata as ContentMetadata | undefined,
      publishedAt: ormEntity.publishedAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * Map domain entity to ORM entity (partial, for saving)
   */
  static toOrmEntity(domain: Content): Partial<ContentOrmEntity> {
    return {
      id: domain.id,
      programId: domain.programId,
      title: domain.title,
      description: domain.description,
      type: domain.type,
      category: domain.category,
      language: domain.language,
      status: domain.status,
      source: domain.source,
      externalId: domain.externalId,
      metadata: domain.metadata,
      publishedAt: domain.publishedAt,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
