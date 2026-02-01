import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEnum, IsOptional, IsUUID, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ContentType, Category, Status, Source } from "@shared/enums";

/**
 * Pure interface for service layer
 */
export interface ContentQueryInput {
  programId?: string;
  type?: ContentType;
  category?: Category;
  status?: Status;
  source?: Source;
  language?: string;
  page?: number;
  limit?: number;
}

/**
 * HTTP DTO with validation decorators
 */
export class ContentQueryDto implements ContentQueryInput {
  @ApiPropertyOptional({ description: "Filter by program ID" })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiPropertyOptional({ enum: ContentType })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @ApiPropertyOptional({ enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ enum: Source })
  @IsOptional()
  @IsEnum(Source)
  source?: Source;

  @ApiPropertyOptional({ description: "Language code" })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
