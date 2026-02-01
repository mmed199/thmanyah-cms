/**
 * Programs Controller
 *
 * REST API for managing programs (CMS operations).
 */

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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { CmsProgramService } from "../services/program.service";
import { CreateProgramDto } from "../dto/program/create-program.dto";
import { UpdateProgramDto } from "../dto/program/update-program.dto";
import { ProgramQueryDto } from "../dto/program/query-program.dto";
import { ProgramResponseDto, PaginatedProgramsDto } from "../dto/program/program-response.dto";

@ApiTags("Programs")
@Controller("cms/programs")
export class ProgramsController {
  constructor(private readonly programService: CmsProgramService) {}

  @Post()
  @ApiOperation({ summary: "Create a new program" })
  @ApiResponse({ status: 201, description: "Program created", type: ProgramResponseDto })
  @ApiResponse({ status: 400, description: "Invalid input" })
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
  @ApiOperation({ summary: "List programs with filters" })
  @ApiResponse({ status: 200, description: "Paginated programs", type: PaginatedProgramsDto })
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
  @ApiOperation({ summary: "Get a program by ID" })
  @ApiParam({ name: "id", description: "Program UUID" })
  @ApiResponse({ status: 200, description: "Program found", type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: "Program not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ProgramResponseDto> {
    const program = await this.programService.findById(id);
    return this.toResponse(program);
  }

  @Get(":id/with-contents")
  @ApiOperation({ summary: "Get a program with its contents" })
  @ApiParam({ name: "id", description: "Program UUID" })
  @ApiResponse({ status: 200, description: "Program with contents" })
  @ApiResponse({ status: 404, description: "Program not found" })
  async findOneWithContents(@Param("id", ParseUUIDPipe) id: string) {
    const program = await this.programService.findByIdWithContents(id);
    return {
      ...this.toResponse(program),
      contents: program.contents?.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        status: c.status,
        publishedAt: c.publishedAt,
      })),
    };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a program" })
  @ApiParam({ name: "id", description: "Program UUID" })
  @ApiResponse({ status: 200, description: "Program updated", type: ProgramResponseDto })
  @ApiResponse({ status: 400, description: "Invalid input or status transition" })
  @ApiResponse({ status: 404, description: "Program not found" })
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
  @ApiOperation({ summary: "Delete a program" })
  @ApiParam({ name: "id", description: "Program UUID" })
  @ApiResponse({ status: 204, description: "Program deleted" })
  @ApiResponse({ status: 404, description: "Program not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.programService.delete(id);
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
