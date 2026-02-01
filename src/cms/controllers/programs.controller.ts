import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  ApiCreateProgram,
  ApiGetProgram,
  ApiListPrograms,
  ApiUpdateProgram,
  ApiDeleteProgram,
  ApiGetProgramWithContents,
  ApiPublishProgram,
  ApiArchiveProgram,
} from "../decorators/program.decorator";
import { CmsProgramService } from "../services/program.service";
import { CreateProgramDto } from "../dto/program/create-program.dto";
import { UpdateProgramDto } from "../dto/program/update-program.dto";
import { ProgramQueryDto } from "../dto/program/query-program.dto";
import {
  ProgramResponseDto,
  PaginatedProgramsDto,
  ProgramWithContentsResponseDto,
} from "../dto/program/program-response.dto";

/**
 * Programs Controller
 *
 * REST API for managing programs (CMS operations).
 */
@ApiTags("Programs")
@Controller("cms/programs")
export class ProgramsController {
  constructor(private readonly programService: CmsProgramService) {}

  @Post()
  @ApiCreateProgram()
  async create(@Body() dto: CreateProgramDto): Promise<ProgramResponseDto> {
    const program = await this.programService.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      language: dto.language,
      metadata: dto.metadata,
    });

    return this.toResponse(program);
  }

  @Get()
  @ApiListPrograms()
  async findAll(@Query() query: ProgramQueryDto): Promise<PaginatedProgramsDto> {
    const limit = Math.min(query.limit ?? 20, 100);
    const page = Math.max(query.page ?? 1, 1);
    const offset = (page - 1) * limit;

    const result = await this.programService.findAll(
      {
        type: query.type,
        category: query.category,
        status: query.status,
        language: query.language,
      },
      { limit, offset },
    );

    return {
      items: result.items.map(this.toResponse),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  @Get(":id")
  @ApiGetProgram()
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ProgramResponseDto> {
    const program = await this.programService.findById(id);
    return this.toResponse(program);
  }

  @Get(":id/with-contents")
  @ApiGetProgramWithContents()
  async findOneWithContents(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<ProgramWithContentsResponseDto> {
    const program = await this.programService.findByIdWithContents(id);
    return {
      ...this.toResponse(program),
      contents:
        program.contents?.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          status: c.status,
          publishedAt: c.publishedAt,
        })) ?? [],
    };
  }

  @Put(":id")
  @ApiUpdateProgram()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramDto,
  ): Promise<ProgramResponseDto> {
    const program = await this.programService.update(id, {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      language: dto.language,
      status: dto.status,
      metadata: dto.metadata,
    });

    return this.toResponse(program);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteProgram()
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.programService.delete(id);
  }

  @Post(":id/publish")
  @ApiPublishProgram()
  async publish(@Param("id", ParseUUIDPipe) id: string): Promise<ProgramResponseDto> {
    const program = await this.programService.publish(id);
    return this.toResponse(program);
  }

  @Post(":id/archive")
  @ApiArchiveProgram()
  async archive(@Param("id", ParseUUIDPipe) id: string): Promise<ProgramResponseDto> {
    const program = await this.programService.archive(id);
    return this.toResponse(program);
  }

  private toResponse(program: any): ProgramResponseDto {
    return {
      id: program.id,
      title: program.title,
      description: program.description,
      type: program.type,
      category: program.category,
      language: program.language,
      status: program.status,
      metadata: program.metadata,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }
}
