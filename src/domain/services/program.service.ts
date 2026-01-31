/**
 * Program Service
 *
 * Orchestrates program use cases.
 * Uses ports for persistence and event publishing.
 */

import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { Program, CreateProgramProps } from "../entities/program.entity";
import { Status } from "../enums";
import type {
  IProgramRepository,
  PaginationOptions,
  PaginatedResult,
  ProgramFilter,
} from "../ports/program.repository.port";
import { PROGRAM_REPOSITORY } from "../ports/program.repository.port";
import type { IEventPublisher } from "../ports/event-publisher.port";
import { EVENT_PUBLISHER } from "../ports/event-publisher.port";
import { ProgramCreatedEvent, ProgramUpdatedEvent, ProgramDeletedEvent } from "../events";

export interface CreateProgramInput {
  title: string;
  description?: string;
  type: CreateProgramProps["type"];
  category: CreateProgramProps["category"];
  language?: string;
  metadata?: CreateProgramProps["metadata"];
}

export interface UpdateProgramInput {
  title?: string;
  description?: string;
  type?: CreateProgramProps["type"];
  category?: CreateProgramProps["category"];
  language?: string;
  status?: Status;
  metadata?: CreateProgramProps["metadata"];
}

@Injectable()
export class ProgramService {
  constructor(
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: IProgramRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
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

    this.eventPublisher.publish(new ProgramCreatedEvent(saved.id, saved.title));

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

    // Update other fields
    const { status, ...otherFields } = input;
    program.update(otherFields);

    const saved = await this.programRepository.save(program);

    this.eventPublisher.publish(new ProgramUpdatedEvent(saved.id, Object.keys(input)));

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

    this.eventPublisher.publish(new ProgramDeletedEvent(id));
  }

  async findAll(
    filter: ProgramFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Program>> {
    return this.programRepository.findAll(filter, pagination);
  }
}
