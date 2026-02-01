import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContentType, Category, Status, Source } from "@shared/enums";

/**
 * Pure interface for service layer
 */
export interface ContentResponse {
  id: string;
  programId: string | null;
  title: string;
  description: string | null;
  type: ContentType;
  category: Category;
  language: string;
  status: Status;
  source: Source;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * HTTP DTO with Swagger decorators
 */
export class ContentResponseDto implements ContentResponse {
  @ApiProperty({ description: "Content ID" })
  id: string;

  @ApiPropertyOptional({ description: "Parent program ID" })
  programId: string | null;

  @ApiProperty({ description: "Content title" })
  title: string;

  @ApiPropertyOptional({ description: "Content description" })
  description: string | null;

  @ApiProperty({ enum: ContentType })
  type: ContentType;

  @ApiProperty({ enum: Category })
  category: Category;

  @ApiProperty({ description: "Language code" })
  language: string;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty({ enum: Source })
  source: Source;

  @ApiPropertyOptional({ description: "External ID" })
  externalId: string | null;

  @ApiPropertyOptional({ description: "Additional metadata" })
  metadata: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: "Publication timestamp" })
  publishedAt: Date | null;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
}

/**
 * Paginated response interface
 */
export interface PaginatedContentsResponse {
  items: ContentResponse[];
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

/**
 * Paginated HTTP DTO
 */
export class PaginatedContentsDto implements PaginatedContentsResponse {
  @ApiProperty({ type: [ContentResponseDto] })
  items: ContentResponseDto[];

  @ApiProperty({ description: "Total number of items" })
  total: number;

  @ApiProperty({ description: "Items per page" })
  limit: number;

  @ApiProperty({ description: "Current offset" })
  offset: number;

  @ApiProperty({ description: "Total number of pages" })
  totalPages: number;
}
