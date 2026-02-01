/**
 * Import Request DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, Min, Max } from "class-validator";
import { Source, ContentType, Category } from "../../../shared/enums";

/**
 * Pure interface for service layer
 */
export interface ImportRequestInput {
  source: Source;
  channelId: string;
  programId?: string;
  contentType?: ContentType;
  category?: Category;
  maxResults?: number;
}

/**
 * HTTP DTO with validation decorators
 */
export class ImportRequestDto implements ImportRequestInput {
  @ApiProperty({ enum: Source, description: "External source", example: Source.YOUTUBE })
  @IsEnum(Source)
  source: Source;

  @ApiProperty({ description: "External channel/playlist ID", example: "UC_demo_channel_1" })
  @IsString()
  channelId: string;

  @ApiPropertyOptional({ description: "Target program ID (auto-created if not provided)" })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiPropertyOptional({
    enum: ContentType,
    description: "Content type for imported items",
    default: ContentType.PODCAST_EPISODE,
  })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @ApiPropertyOptional({
    enum: Category,
    description: "Category for imported items",
    default: Category.ENTERTAINMENT,
  })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({ description: "Maximum items to import", default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxResults?: number;
}
