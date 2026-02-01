import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProgramType } from "@shared/enums/program-type.enum";
import { Category } from "@shared/enums/category.enum";
import { Status } from "@shared/enums/status.enum";
import { ContentType } from "@shared/enums/content-type.enum";

/**
 * Pure interface for service layer
 */
export interface ProgramResponse {
  id: string;
  title: string;
  description: string | null;
  type: ProgramType;
  category: Category;
  language: string;
  status: Status;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * HTTP DTO with Swagger decorators
 */
export class ProgramResponseDto implements ProgramResponse {
  @ApiProperty({ description: "Program ID" })
  id: string;

  @ApiProperty({ description: "Program title" })
  title: string;

  @ApiPropertyOptional({ description: "Program description" })
  description: string | null;

  @ApiProperty({ enum: ProgramType })
  type: ProgramType;

  @ApiProperty({ enum: Category })
  category: Category;

  @ApiProperty({ description: "Language code" })
  language: string;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiPropertyOptional({ description: "Additional metadata" })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
}

export class ProgramContentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ContentType })
  type: ContentType;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiPropertyOptional()
  publishedAt: Date | null;
}

export class ProgramWithContentsResponseDto extends ProgramResponseDto {
  @ApiProperty({ type: [ProgramContentDto] })
  contents: ProgramContentDto[];
}

/**
 * Paginated response interface
 */
export interface PaginatedProgramsResponse {
  items: ProgramResponse[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

/**
 * Paginated HTTP DTO
 */
export class PaginatedProgramsDto implements PaginatedProgramsResponse {
  @ApiProperty({ type: [ProgramResponseDto] })
  items: ProgramResponseDto[];

  @ApiProperty({ description: "Total number of items" })
  total: number;

  @ApiProperty({ description: "Items per page" })
  limit: number;

  @ApiProperty({ description: "Current offset" })
  offset: number;

  @ApiProperty({ description: "Total number of pages" })
  totalPages: number;
}
