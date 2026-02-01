/**
 * Ingestion Controller
 *
 * REST API for triggering content imports from external sources.
 */

import { Controller, Get, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { IngestionService } from "../services/ingestion.service";
import { ImportRequestDto } from "../dto/import/import-request.dto";
import { ImportResultDto, AvailableSourcesDto } from "../dto/import/import-response.dto";

@ApiTags("Ingestion")
@Controller("cms/ingestion")
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Get("sources")
  @ApiOperation({ summary: "Get available ingestion sources" })
  @ApiResponse({ status: 200, description: "List of available sources", type: AvailableSourcesDto })
  getAvailableSources(): AvailableSourcesDto {
    return {
      sources: this.ingestionService.getAvailableSources(),
    };
  }

  @Post("import")
  @ApiOperation({ summary: "Import content from external source" })
  @ApiResponse({ status: 201, description: "Import completed", type: ImportResultDto })
  @ApiResponse({ status: 400, description: "Invalid request or unknown source" })
  @ApiResponse({ status: 404, description: "Program not found (if programId provided)" })
  async import(@Body() dto: ImportRequestDto): Promise<ImportResultDto> {
    return this.ingestionService.import({
      source: dto.source,
      channelId: dto.channelId,
      programId: dto.programId,
      contentType: dto.contentType,
      category: dto.category,
      maxResults: dto.maxResults,
    });
  }
}
