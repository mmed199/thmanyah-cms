/**
 * Create Program DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEnum, IsOptional, IsObject, MaxLength, MinLength } from "class-validator";
import { ProgramType, Category } from "../../../shared/enums";

/**
 * Pure interface for service layer
 */
export interface CreateProgramInput {
  title: string;
  description?: string;
  type: ProgramType;
  category: Category;
  language?: string;
  metadata?: Record<string, unknown>;
}

/**
 * HTTP DTO with validation decorators
 */
export class CreateProgramDto implements CreateProgramInput {
  @ApiProperty({ description: "Program title", example: "سوالف بزنس" })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: "Program description" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: ProgramType, example: ProgramType.PODCAST_SERIES })
  @IsEnum(ProgramType)
  type: ProgramType;

  @ApiProperty({ enum: Category, example: Category.BUSINESS })
  @IsEnum(Category)
  category: Category;

  @ApiPropertyOptional({ description: "Language code", example: "ar", default: "ar" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
