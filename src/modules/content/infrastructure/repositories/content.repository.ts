import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Content } from '../../domain/entities/content.entity';
import { Status } from '../../domain/enums/status.enum';
import { Source } from '../../domain/enums/source.enum';
import {
  IContentRepository,
  CreateContentData,
  UpdateContentData,
  ContentFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../application/interfaces/content.repository.interface';

@Injectable()
export class ContentRepository implements IContentRepository {
  constructor(
    @InjectRepository(Content)
    private readonly repository: Repository<Content>,
  ) {}

  async create(data: CreateContentData): Promise<Content> {
    const content = this.repository.create({
      programId: data.programId || null,
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      language: data.language || 'ar',
      status: data.status,
      source: data.source || Source.MANUAL,
      externalId: data.externalId || null,
      metadata: data.metadata,
      publishedAt: data.publishedAt || null,
    });
    return this.repository.save(content);
  }

  async findById(id: string): Promise<Content | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithProgram(id: string): Promise<Content | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['program'],
    });
  }

  async update(id: string, data: UpdateContentData): Promise<Content | null> {
    const content = await this.findById(id);
    if (!content) {
      return null;
    }

    Object.assign(content, data);
    return this.repository.save(content);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findByProgramId(
    programId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    const [items, total] = await this.repository.findAndCount({
      where: { programId },
      take: pagination.limit,
      skip: pagination.offset,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async findAll(
    filter: ContentFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    const where: FindOptionsWhere<Content> = {};

    if (filter.programId) {
      where.programId = filter.programId;
    }
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.language) {
      where.language = filter.language;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.source) {
      where.source = filter.source;
    }

    const [items, total] = await this.repository.findAndCount({
      where,
      take: pagination.limit,
      skip: pagination.offset,
      order: { createdAt: 'DESC' },
      relations: ['program'],
    });

    return {
      items,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  async findByExternalId(
    source: Source,
    externalId: string,
  ): Promise<Content | null> {
    return this.repository.findOne({
      where: { source, externalId },
    });
  }

  async findPublishedByProgramId(programId: string): Promise<Content[]> {
    return this.repository.find({
      where: {
        programId,
        status: Status.PUBLISHED,
      },
    });
  }
}
