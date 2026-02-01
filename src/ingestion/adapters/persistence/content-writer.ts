/**
 * Ingestion Content Writer Repository
 *
 * TypeORM implementation of IIngestionContentWriter.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Content } from "@shared/entities/content.entity";
import { Source } from "@shared/enums";
import { ContentOrmEntity, ContentMapper } from "@shared/persistence";
import type { IIngestionContentWriter } from "./content-writer.interface";

@Injectable()
export class ContentWriter implements IIngestionContentWriter {
  constructor(
    @InjectRepository(ContentOrmEntity)
    private readonly repository: Repository<ContentOrmEntity>,
  ) {}

  async save(content: Content): Promise<Content> {
    const ormEntity = this.repository.create(ContentMapper.toOrmEntity(content));
    const saved = await this.repository.save(ormEntity);
    return ContentMapper.toDomain(saved);
  }

  async findByExternalId(source: Source, externalId: string): Promise<Content | null> {
    const ormEntity = await this.repository.findOne({
      where: { source, externalId },
    });
    return ormEntity ? ContentMapper.toDomain(ormEntity) : null;
  }
}
