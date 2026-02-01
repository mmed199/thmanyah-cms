/**
 * CMS Content Service
 *
 * Orchestrates content management use cases for CMS module.
 * Uses CMS-owned ports for persistence and event publishing.
 */

import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { Content } from "../../shared/entities/content.entity";
import { Status } from "../../shared/enums";
import {
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentPublishedEvent,
  ContentArchivedEvent,
  ContentDeletedEvent,
} from "../../shared/events/content";
import type { PaginationOptions, PaginatedResult } from "../../shared/types";
import type { IContentRepository, ContentFilter } from "../repositories/content.repository.interface";
import { CMS_CONTENT_REPOSITORY } from "../repositories/content.repository.interface";
import type { ICmsProgramRepository } from "../repositories/program.repository.interface";
import { CMS_PROGRAM_REPOSITORY } from "../repositories/program.repository.interface";
import type { ICmsEventPublisher } from "../repositories/event-publisher.interface";
import { CMS_EVENT_PUBLISHER } from "../repositories/event-publisher.interface";
import type { CreateContentInput } from "../dto/content/create-content.dto";
import type { UpdateContentInput } from "../dto/content/update-content.dto";

@Injectable()
export class CmsContentService {
  constructor(
    @Inject(CMS_CONTENT_REPOSITORY)
    private readonly contentRepository: IContentRepository,
    @Inject(CMS_PROGRAM_REPOSITORY)
    private readonly programRepository: ICmsProgramRepository,
    @Inject(CMS_EVENT_PUBLISHER)
    private readonly eventPublisher: ICmsEventPublisher,
  ) {}

  async create(input: CreateContentInput): Promise<Content> {
    // Validate program exists if programId is provided
    if (input.programId) {
      const program = await this.programRepository.findById(input.programId);
      if (!program) {
        throw new NotFoundException(`Program with ID ${input.programId} not found`);
      }
    }

    const content = new Content({
      id: uuid(),
      programId: input.programId,
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      language: input.language,
      source: input.source,
      externalId: input.externalId,
      metadata: input.metadata,
    });

    const saved = await this.contentRepository.save(content);

    await this.eventPublisher.publish(
      new ContentCreatedEvent(
        saved.id,
        saved.programId,
        saved.title,
        saved.type,
        saved.category,
        saved.language,
      ),
    );

    return saved;
  }

  async findById(id: string): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    return content;
  }

  async findByIdWithProgram(id: string): Promise<Content> {
    const content = await this.contentRepository.findByIdWithProgram(id);
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    return content;
  }

  async update(id: string, input: UpdateContentInput): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    const previousStatus = content.status;

    // Handle status transitions
    if (input.status && input.status !== content.status) {
      if (!content.canTransitionTo(input.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${content.status} to ${input.status}`,
        );
      }

      switch (input.status) {
        case Status.PUBLISHED:
          content.publish();
          break;
        case Status.ARCHIVED:
          content.archive();
          break;
        case Status.DRAFT:
          content.revertToDraft();
          break;
      }
    }

    // Update other fields (status is handled above via state transitions)
    const { status: _status, ...otherFields } = input;
    content.update(otherFields);

    const saved = await this.contentRepository.save(content);

    // Emit appropriate events
    await this.emitContentEvents(saved, previousStatus, input);

    return saved;
  }

  async delete(id: string): Promise<void> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    const deleted = await this.contentRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    await this.eventPublisher.publish(new ContentDeletedEvent(id, content.programId));
  }

  async findAll(
    filter: ContentFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    return this.contentRepository.findAll(filter, pagination);
  }

  async findByProgramId(
    programId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    return this.contentRepository.findByProgramId(programId, pagination);
  }

  async publish(id: string): Promise<Content> {
    return this.update(id, { status: Status.PUBLISHED });
  }

  async archive(id: string): Promise<Content> {
    return this.update(id, { status: Status.ARCHIVED });
  }

  private async emitContentEvents(
    content: Content,
    previousStatus: Status,
    input: UpdateContentInput,
  ): Promise<void> {
    // Check for status transitions first
    if (input.status && previousStatus !== content.status) {
      if (content.status === Status.PUBLISHED) {
        await this.eventPublisher.publish(
          new ContentPublishedEvent(
            content.id,
            content.programId,
            content.title,
            content.description,
            content.type,
            content.category,
            content.language,
            content.metadata,
            content.publishedAt!,
          ),
        );
        return;
      }
      if (content.status === Status.ARCHIVED) {
        await this.eventPublisher.publish(new ContentArchivedEvent(content.id, content.programId));
        return;
      }
    }

    // Default update event
    await this.eventPublisher.publish(
      new ContentUpdatedEvent(content.id, content.programId, Object.keys(input)),
    );
  }
}
