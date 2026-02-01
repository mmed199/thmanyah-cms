import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEnum, IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ProgramType, Category, Status } from "@shared/enums";

/**
 * Pure interface for service layer
 */
export interface ProgramQueryInput {
  type?: ProgramType;
  category?: Category;
  status?: Status;
  language?: string;
  page?: number;
  limit?: number;
}

/**
 * HTTP DTO with validation decorators
 */
export class ProgramQueryDto implements ProgramQueryInput {
  @ApiPropertyOptional({ enum: ProgramType })
  @IsOptional()
  @IsEnum(ProgramType)
  type?: ProgramType;

  @ApiPropertyOptional({ enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

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
