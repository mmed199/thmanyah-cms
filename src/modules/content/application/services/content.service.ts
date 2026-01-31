import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Content } from "../../domain/entities/content.entity";
import { Status } from "../../domain/enums/status.enum";
import {
  CONTENT_REPOSITORY,
  CreateContentData,
  UpdateContentData,
  ContentFilter,
  PaginationOptions,
  PaginatedResult,
} from "../interfaces/content.repository.interface";
import type { IContentRepository } from "../interfaces/content.repository.interface";
import { PROGRAM_REPOSITORY } from "../interfaces/program.repository.interface";
import type { IProgramRepository } from "../interfaces/program.repository.interface";
import {
  ContentCreatedEvent,
  ContentUpdatedEvent,
  ContentPublishedEvent,
  ContentArchivedEvent,
  ContentDeletedEvent,
} from "../../domain/events";

@Injectable()
export class ContentService {
  constructor(
    @Inject(CONTENT_REPOSITORY)
    private readonly contentRepository: IContentRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: IProgramRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateContentData): Promise<Content> {
    // Validate program exists if programId is provided
    if (data.programId) {
      const program = await this.programRepository.findById(data.programId);
      if (!program) {
        throw new NotFoundException(`Program with ID ${data.programId} not found`);
      }
    }

    const content = await this.contentRepository.create(data);

    // Emit event (but content is draft, so Discovery won't index it)
    this.eventEmitter.emit(
      "content.created",
      new ContentCreatedEvent(
        content.id,
        content.programId,
        content.title,
        content.type,
        content.category,
        content.language,
      ),
    );

    return content;
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

  async update(id: string, data: UpdateContentData): Promise<Content> {
    const existingContent = await this.contentRepository.findById(id);
    if (!existingContent) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    // Validate program exists if programId is being updated
    if (data.programId && data.programId !== existingContent.programId) {
      const program = await this.programRepository.findById(data.programId);
      if (!program) {
        throw new NotFoundException(`Program with ID ${data.programId} not found`);
      }
    }

    const previousStatus = existingContent.status;
    const newStatus = data.status || previousStatus;

    // Validate status transitions
    if (data.status && previousStatus !== newStatus) {
      this.validateStatusTransition(previousStatus, newStatus);

      // Set publishedAt when publishing
      if (newStatus === Status.PUBLISHED && !existingContent.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const updatedContent = await this.contentRepository.update(id, data);
    if (!updatedContent) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    // Emit appropriate events based on status change
    this.emitContentEvents(existingContent, updatedContent, previousStatus, Object.keys(data));

    return updatedContent;
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

    // Emit event for Discovery module to remove from index (if was published)
    this.eventEmitter.emit("content.deleted", new ContentDeletedEvent(id, content.programId));
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

  async publish(id: string): Promise<Content> {
    return this.update(id, { status: Status.PUBLISHED });
  }

  async archive(id: string): Promise<Content> {
    return this.update(id, { status: Status.ARCHIVED });
  }

  private validateStatusTransition(currentStatus: Status, newStatus: Status): void {
    const allowedTransitions: Record<Status, Status[]> = {
      [Status.DRAFT]: [Status.PUBLISHED],
      [Status.PUBLISHED]: [Status.ARCHIVED, Status.DRAFT],
      [Status.ARCHIVED]: [Status.DRAFT],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private emitContentEvents(
    previousContent: Content,
    updatedContent: Content,
    previousStatus: Status,
    updatedFields: string[],
  ): void {
    const newStatus = updatedContent.status;

    // Content was just published
    if (previousStatus !== Status.PUBLISHED && newStatus === Status.PUBLISHED) {
      this.eventEmitter.emit(
        "content.published",
        new ContentPublishedEvent(
          updatedContent.id,
          updatedContent.programId,
          updatedContent.title,
          updatedContent.description,
          updatedContent.type,
          updatedContent.category,
          updatedContent.language,
          updatedContent.metadata,
          updatedContent.publishedAt!,
        ),
      );
      return;
    }

    // Content was archived (remove from index)
    if (previousStatus === Status.PUBLISHED && newStatus === Status.ARCHIVED) {
      this.eventEmitter.emit(
        "content.archived",
        new ContentArchivedEvent(updatedContent.id, updatedContent.programId),
      );
      return;
    }

    // Content was updated while published (reindex)
    if (newStatus === Status.PUBLISHED) {
      this.eventEmitter.emit(
        "content.updated",
        new ContentUpdatedEvent(
          updatedContent.id,
          updatedContent.programId,
          updatedContent.status,
          updatedFields,
        ),
      );
    }
  }
}
