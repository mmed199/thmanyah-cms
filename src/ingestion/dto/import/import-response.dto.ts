/**
 * Import Response DTO
 */

import { ApiProperty } from "@nestjs/swagger";
import { Source } from "../../../shared/enums";

/**
 * Pure interface for service layer
 */
export interface ImportResultResponse {
  source: Source;
  channelId: string;
  programId: string;
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * HTTP DTO with Swagger decorators
 */
export class ImportResultDto implements ImportResultResponse {
  @ApiProperty({ enum: Source })
  source: Source;

  @ApiProperty({ description: "Channel ID that was imported" })
  channelId: string;

  @ApiProperty({ description: "Program ID (created or provided)" })
  programId: string;

  @ApiProperty({ description: "Number of items imported" })
  imported: number;

  @ApiProperty({ description: "Number of items skipped (already existed)" })
  skipped: number;

  @ApiProperty({ description: "Error messages for failed items", type: [String] })
  errors: string[];
}

/**
 * Available sources response interface
 */
export interface AvailableSourcesResponse {
  sources: Source[];
}

/**
 * Available sources HTTP DTO
 */
export class AvailableSourcesDto implements AvailableSourcesResponse {
  @ApiProperty({ enum: Source, isArray: true, description: "Available ingestion sources" })
  sources: Source[];
}
