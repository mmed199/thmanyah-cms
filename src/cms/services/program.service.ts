import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { Program } from "@shared/entities/program.entity";
import { Status } from "@shared/enums/status.enum";
import { ProgramCreatedEvent } from "@shared/events/program/program-created.event";
import { ProgramUpdatedEvent } from "@shared/events/program/program-updated.event";
import { ProgramDeletedEvent } from "@shared/events/program/program-deleted.event";
import type { PaginationOptions, PaginatedResult } from "@shared/types/pagination.types";
import type {
  ICmsProgramRepository,
  ProgramFilter,
} from "../adapters/persistence/program.repository.interface";
import { CMS_PROGRAM_REPOSITORY } from "../adapters/persistence/program.repository.interface";
import type { ICmsEventPublisher } from "../adapters/messaging/event-publisher.interface";
import { CMS_EVENT_PUBLISHER } from "../adapters/messaging/event-publisher.interface";
import type { CreateProgramInput } from "../dto/program/create-program.dto";
import type { UpdateProgramInput } from "../dto/program/update-program.dto";

/**
 * CMS Program Service
 * 
 * Business logic for managing programs
 */
@Injectable()
export class CmsProgramService {
  constructor(
    @Inject(CMS_PROGRAM_REPOSITORY)
    private readonly programRepository: ICmsProgramRepository,
    @Inject(CMS_EVENT_PUBLISHER)
    private readonly eventPublisher: ICmsEventPublisher,
  ) {}

  async create(input: CreateProgramInput): Promise<Program> {
    const program = new Program({
      id: uuid(),
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      language: input.language,
      metadata: input.metadata,
    });

    const saved = await this.programRepository.save(program);

    await this.eventPublisher.publish(new ProgramCreatedEvent(saved.id, saved.title));

    return saved;
  }

  async findById(id: string): Promise<Program> {
    const program = await this.programRepository.findById(id);
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    return program;
  }

  async findByIdWithContents(id: string): Promise<Program> {
    const program = await this.programRepository.findByIdWithContents(id);
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    return program;
  }

  async update(id: string, input: UpdateProgramInput): Promise<Program> {
    const program = await this.programRepository.findById(id);
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    // Handle status transition
    if (input.status && input.status !== program.status) {
      if (!program.canTransitionTo(input.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${program.status} to ${input.status}`,
        );
      }

      switch (input.status) {
        case Status.PUBLISHED:
          program.publish();
          break;
        case Status.ARCHIVED:
          program.archive();
          break;
        case Status.DRAFT:
          program.revertToDraft();
          break;
      }
    }

    // Update other fields (status is handled above via state transitions)
    const { status: _status, ...otherFields } = input;
    program.update(otherFields);

    const saved = await this.programRepository.save(program);

    await this.eventPublisher.publish(new ProgramUpdatedEvent(saved.id, Object.keys(input)));

    return saved;
  }

  async delete(id: string): Promise<void> {
    const program = await this.programRepository.findById(id);
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    const deleted = await this.programRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    await this.eventPublisher.publish(new ProgramDeletedEvent(id));
  }

  async publish(id: string): Promise<Program> {
    return this.update(id, { status: Status.PUBLISHED });
  }

  async archive(id: string): Promise<Program> {
    return this.update(id, { status: Status.ARCHIVED });
  }

  async findAll(
    filter: ProgramFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Program>> {
    return this.programRepository.findAll(filter, pagination);
  }
}
