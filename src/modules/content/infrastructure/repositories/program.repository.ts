import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Program } from "../../domain/entities/program.entity";
import {
  IProgramRepository,
  CreateProgramData,
  UpdateProgramData,
  ProgramFilter,
  PaginationOptions,
  PaginatedResult,
} from "../../application/interfaces/program.repository.interface";

@Injectable()
export class ProgramRepository implements IProgramRepository {
  constructor(
    @InjectRepository(Program)
    private readonly repository: Repository<Program>,
  ) {}

  async create(data: CreateProgramData): Promise<Program> {
    const program = this.repository.create({
      title: data.title,
      description: data.description,
      type: data.type,
      category: data.category,
      language: data.language || "ar",
      status: data.status,
      metadata: data.metadata,
    });
    return this.repository.save(program);
  }

  async findById(id: string): Promise<Program | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithContents(id: string): Promise<Program | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["contents"],
    });
  }

  async update(id: string, data: UpdateProgramData): Promise<Program | null> {
    const program = await this.findById(id);
    if (!program) {
      return null;
    }

    Object.assign(program, data);
    return this.repository.save(program);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findAll(
    filter: ProgramFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Program>> {
    const where: FindOptionsWhere<Program> = {};

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

    const [items, total] = await this.repository.findAndCount({
      where,
      take: pagination.limit,
      skip: pagination.offset,
      order: { createdAt: "DESC" },
    });

    return {
      items,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }
}
