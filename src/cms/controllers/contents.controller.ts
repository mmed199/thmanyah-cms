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
  ApiCreateContent,
  ApiGetContent,
  ApiListContents,
  ApiUpdateContent,
  ApiDeleteContent,
  ApiPublishContent,
  ApiArchiveContent,
} from "../decorators/content.decorator";
import { CmsContentService } from "../services/content.service";
import { CreateContentDto } from "../dto/content/create-content.dto";
import { UpdateContentDto } from "../dto/content/update-content.dto";
import { ContentQueryDto } from "../dto/content/query-content.dto";
import { ContentResponseDto, PaginatedContentsDto } from "../dto/content/content-response.dto";

/**
 * Contents Controller
 *
 * REST API for managing content (CMS operations).
 */
@ApiTags("Contents")
@Controller("cms/contents")
export class ContentsController {
  constructor(private readonly contentService: CmsContentService) {}

  @Post()
  @ApiCreateContent()
  async create(@Body() dto: CreateContentDto): Promise<ContentResponseDto> {
    const content = await this.contentService.create({
      programId: dto.programId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      language: dto.language,
      source: dto.source,
      externalId: dto.externalId,
      metadata: dto.metadata,
    });

    return this.toResponse(content);
  }

  @Get()
  @ApiListContents()
  async findAll(@Query() query: ContentQueryDto): Promise<PaginatedContentsDto> {
    const limit = Math.min(query.limit ?? 20, 100);
    const page = Math.max(query.page ?? 1, 1);
    const offset = (page - 1) * limit;

    const result = await this.contentService.findAll(
      {
        programId: query.programId,
        type: query.type,
        category: query.category,
        status: query.status,
        source: query.source,
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
  @ApiGetContent()
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ContentResponseDto> {
    const content = await this.contentService.findById(id);
    return this.toResponse(content);
  }

  @Put(":id")
  @ApiUpdateContent()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
  ): Promise<ContentResponseDto> {
    const content = await this.contentService.update(id, {
      programId: dto.programId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      language: dto.language,
      status: dto.status,
      metadata: dto.metadata,
    });

    return this.toResponse(content);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteContent()
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.contentService.delete(id);
  }

  @Post(":id/publish")
  @ApiPublishContent()
  async publish(@Param("id", ParseUUIDPipe) id: string): Promise<ContentResponseDto> {
    const content = await this.contentService.publish(id);
    return this.toResponse(content);
  }

  @Post(":id/archive")
  @ApiArchiveContent()
  async archive(@Param("id", ParseUUIDPipe) id: string): Promise<ContentResponseDto> {
    const content = await this.contentService.archive(id);
    return this.toResponse(content);
  }

  private toResponse(content: any): ContentResponseDto {
    return {
      id: content.id,
      programId: content.programId,
      title: content.title,
      description: content.description,
      type: content.type,
      category: content.category,
      language: content.language,
      status: content.status,
      source: content.source,
      externalId: content.externalId,
      metadata: content.metadata,
      publishedAt: content.publishedAt,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }
}
