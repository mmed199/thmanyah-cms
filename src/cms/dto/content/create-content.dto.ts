/**
 * Create Content DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { ContentType, Category, Source } from "../../../shared/enums";

/**
 * Pure interface for service layer
 */
export interface CreateContentInput {
  programId?: string;
  title: string;
  description?: string;
  type: ContentType;
  category: Category;
  language?: string;
  source?: Source;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * HTTP DTO with validation decorators
 */
export class CreateContentDto implements CreateContentInput {
  @ApiPropertyOptional({ description: "Parent program ID" })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiProperty({ description: "Content title", example: "الحلقة 1: بداية الرحلة" })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ description: "Content description" })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ enum: ContentType, example: ContentType.PODCAST_EPISODE })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ enum: Category, example: Category.BUSINESS })
  @IsEnum(Category)
  category: Category;

  @ApiPropertyOptional({ description: "Language code", example: "ar", default: "ar" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ enum: Source, description: "Content source", default: Source.MANUAL })
  @IsOptional()
  @IsEnum(Source)
  source?: Source;

  @ApiPropertyOptional({ description: "External ID for imported content" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalId?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
