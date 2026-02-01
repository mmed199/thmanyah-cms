import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ContentResponseDto, PaginatedContentsDto } from "../dto/content/content-response.dto";
import { CreateContentDto } from "../dto/content/create-content.dto";
import { UpdateContentDto } from "../dto/content/update-content.dto";

export function ApiCreateContent() {
  return applyDecorators(
    ApiOperation({ summary: "Create new content" }),
    ApiBody({ type: CreateContentDto }),
    ApiResponse({
      status: 201,
      description: "Content created successfully",
      type: ContentResponseDto,
    }),
  );
}

export function ApiGetContent() {
  return applyDecorators(
    ApiOperation({ summary: "Get content by ID" }),
    ApiParam({ name: "id", description: "Content UUID" }),
    ApiResponse({
      status: 200,
      description: "Content found",
      type: ContentResponseDto,
    }),
    ApiResponse({ status: 404, description: "Content not found" }),
  );
}

export function ApiListContents() {
  return applyDecorators(
    ApiOperation({ summary: "List contents with pagination and filters" }),
    ApiQuery({ name: "programId", required: false }),
    ApiQuery({ name: "status", required: false }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({ name: "offset", required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: "Paginated content list",
      type: PaginatedContentsDto,
    }),
  );
}

export function ApiUpdateContent() {
  return applyDecorators(
    ApiOperation({ summary: "Update existing content" }),
    ApiParam({ name: "id", description: "Content UUID" }),
    ApiBody({ type: UpdateContentDto }),
    ApiResponse({
      status: 200,
      description: "Content updated successfully",
      type: ContentResponseDto,
    }),
  );
}

export function ApiPublishContent() {
  return applyDecorators(
    ApiOperation({ summary: "Publish content" }),
    ApiParam({ name: "id", description: "Content UUID" }),
    ApiResponse({
      status: 200,
      description: "Content published successfully",
      type: ContentResponseDto,
    }),
    ApiResponse({ status: 400, description: "Invalid status transition" }),
    ApiResponse({ status: 404, description: "Content not found" }),
  );
}

export function ApiArchiveContent() {
  return applyDecorators(
    ApiOperation({ summary: "Archive content" }),
    ApiParam({ name: "id", description: "Content UUID" }),
    ApiResponse({
      status: 200,
      description: "Content archived successfully",
      type: ContentResponseDto,
    }),
    ApiResponse({ status: 400, description: "Invalid status transition" }),
    ApiResponse({ status: 404, description: "Content not found" }),
  );
}

export function ApiDeleteContent() {
  return applyDecorators(
    ApiOperation({ summary: "Delete content" }),
    ApiParam({ name: "id", description: "Content UUID" }),
    ApiResponse({ status: 204, description: "Content deleted successfully" }),
  );
}
