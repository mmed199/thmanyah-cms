import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Program } from '../../domain/entities/program.entity';
import { Status } from '../../domain/enums/status.enum';
import {
  PROGRAM_REPOSITORY,
  CreateProgramData,
  UpdateProgramData,
  ProgramFilter,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces/program.repository.interface';
import type { IProgramRepository } from '../interfaces/program.repository.interface';
import { ProgramUpdatedEvent, ProgramDeletedEvent } from '../../domain/events';

@Injectable()
export class ProgramService {
  constructor(
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: IProgramRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateProgramData): Promise<Program> {
    return this.programRepository.create(data);
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

  async update(id: string, data: UpdateProgramData): Promise<Program> {
    const existingProgram = await this.programRepository.findById(id);
    if (!existingProgram) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    // Validate status transitions
    if (data.status && existingProgram.status !== data.status) {
      this.validateStatusTransition(existingProgram.status, data.status);
    }

    const updatedProgram = await this.programRepository.update(id, data);
    if (!updatedProgram) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    // Emit event for Discovery module to reindex published content
    const updatedFields = Object.keys(data);
    this.eventEmitter.emit(
      'program.updated',
      new ProgramUpdatedEvent(id, updatedFields),
    );

    return updatedProgram;
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

    // Emit event for Discovery module to remove content from index
    this.eventEmitter.emit('program.deleted', new ProgramDeletedEvent(id));
  }

  async findAll(
    filter: ProgramFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Program>> {
    return this.programRepository.findAll(filter, pagination);
  }

  private validateStatusTransition(
    currentStatus: Status,
    newStatus: Status,
  ): void {
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
}
