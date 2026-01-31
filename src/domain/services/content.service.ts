/**
 * Content Service
 *
 * Orchestrates content use cases.
 * Uses ports for persistence and event publishing.
 */

import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { Content, CreateContentProps } from "../entities/content.entity";
import { Status, Source } from "../enums";
import type {
  IContentRepository,
  ContentFilter,
  PaginationOptions,
  PaginatedResult,
} from "../ports/content.repository.port";
import { CONTENT_REPOSITORY } from "../ports/content.repository.port";
import type { IProgramRepository } from "../ports/program.repository.port";
import { PROGRAM_REPOSITORY } from "../ports/program.repository.port";
import type { IEventPublisher } from "../ports/event-publisher.port";
import { EVENT_PUBLISHER } from "../ports/event-publisher.port";
import {
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentPublishedEvent,
  ContentArchivedEvent,
  ContentDeletedEvent,
} from "../events";

export interface CreateContentInput {
  programId?: string | null;
  title: string;
  description?: string;
  type: CreateContentProps["type"];
  category: CreateContentProps["category"];
  language?: string;
  source?: Source;
  externalId?: string | null;
  metadata?: CreateContentProps["metadata"];
}

export interface UpdateContentInput {
  programId?: string | null;
  title?: string;
  description?: string;
  type?: CreateContentProps["type"];
  category?: CreateContentProps["category"];
  language?: string;
  status?: Status;
  metadata?: CreateContentProps["metadata"];
}

@Injectable()
export class ContentService {
  constructor(
    @Inject(CONTENT_REPOSITORY)
    private readonly contentRepository: IContentRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: IProgramRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
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

    this.eventPublisher.publish(
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

  async findByExternalId(source: Source, externalId: string): Promise<Content | null> {
    return this.contentRepository.findByExternalId(source, externalId);
  }

  async update(id: string, input: UpdateContentInput): Promise<Content> {
    const content = await this.contentRepository.findById(id);
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    // Validate program exists if programId is being changed
    if (input.programId !== undefined && input.programId !== content.programId) {
      if (input.programId) {
        const program = await this.programRepository.findById(input.programId);
        if (!program) {
          throw new NotFoundException(`Program with ID ${input.programId} not found`);
        }
      }
    }

    const previousStatus = content.status;

    // Handle status transition
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

    // Update other fields
    const { status, ...otherFields } = input;
    content.update(otherFields);

    const saved = await this.contentRepository.save(content);

    // Emit appropriate events based on status change
    this.emitContentEvents(saved, previousStatus, Object.keys(input));

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

    this.eventPublisher.publish(new ContentDeletedEvent(id, content.programId));
  }

  async publish(id: string): Promise<Content> {
    return this.update(id, { status: Status.PUBLISHED });
  }

  async archive(id: string): Promise<Content> {
    return this.update(id, { status: Status.ARCHIVED });
  }

  async findByProgramId(
    programId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    return this.contentRepository.findByProgramId(programId, pagination);
  }

  async findAll(
    filter: ContentFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Content>> {
    return this.contentRepository.findAll(filter, pagination);
  }

  private emitContentEvents(
    content: Content,
    previousStatus: Status,
    updatedFields: string[],
  ): void {
    const newStatus = content.status;

    // Content was just published
    if (previousStatus !== Status.PUBLISHED && newStatus === Status.PUBLISHED) {
      this.eventPublisher.publish(
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

    // Content was archived
    if (previousStatus === Status.PUBLISHED && newStatus === Status.ARCHIVED) {
      this.eventPublisher.publish(new ContentArchivedEvent(content.id, content.programId));
      return;
    }

    // Content was updated while published
    if (newStatus === Status.PUBLISHED && updatedFields.length > 0) {
      this.eventPublisher.publish(
        new ContentUpdatedEvent(content.id, content.programId, updatedFields),
      );
    }
  }
}
