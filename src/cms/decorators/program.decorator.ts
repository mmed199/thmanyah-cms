import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from "@nestjs/swagger";
import {
  ProgramResponseDto,
  PaginatedProgramsDto,
  ProgramWithContentsResponseDto,
} from "../dto/program/program-response.dto";
import { CreateProgramDto } from "../dto/program/create-program.dto";
import { UpdateProgramDto } from "../dto/program/update-program.dto";

export function ApiCreateProgram() {
  return applyDecorators(
    ApiOperation({ summary: "Create new program" }),
    ApiBody({ type: CreateProgramDto }),
    ApiResponse({
      status: 201,
      description: "Program created successfully",
      type: ProgramResponseDto,
    }),
  );
}

export function ApiGetProgram() {
  return applyDecorators(
    ApiOperation({ summary: "Get program by ID" }),
    ApiParam({ name: "id", description: "Program UUID" }),
    ApiResponse({
      status: 200,
      description: "Program found",
      type: ProgramResponseDto,
    }),
    ApiResponse({ status: 404, description: "Program not found" }),
  );
}

export function ApiGetProgramWithContents() {
  return applyDecorators(
    ApiOperation({ summary: "Get a program with its contents" }),
    ApiParam({ name: "id", description: "Program UUID" }),
    ApiResponse({
      status: 200,
      description: "Program with contents found",
      type: ProgramWithContentsResponseDto,
    }),
    ApiResponse({ status: 404, description: "Program not found" }),
  );
}

export function ApiListPrograms() {
  return applyDecorators(
    ApiOperation({ summary: "List programs with pagination and filters" }),
    ApiQuery({ name: "type", required: false }),
    ApiQuery({ name: "category", required: false }),
    ApiQuery({ name: "limit", required: false, type: Number }),
    ApiQuery({ name: "offset", required: false, type: Number }),
    ApiResponse({
      status: 200,
      description: "Paginated program list",
      type: PaginatedProgramsDto,
    }),
  );
}

export function ApiUpdateProgram() {
  return applyDecorators(
    ApiOperation({ summary: "Update existing program" }),
    ApiParam({ name: "id", description: "Program UUID" }),
    ApiBody({ type: UpdateProgramDto }),
    ApiResponse({
      status: 200,
      description: "Program updated successfully",
      type: ProgramResponseDto,
    }),
  );
}

export function ApiPublishProgram() {
  return applyDecorators(
    ApiOperation({ summary: "Publish program" }),
    ApiParam({ name: "id", description: "Program UUID" }),
    ApiResponse({
      status: 200,
      description: "Program published successfully",
      type: ProgramResponseDto,
    }),
    ApiResponse({ status: 400, description: "Invalid status transition" }),
    ApiResponse({ status: 404, description: "Program not found" }),
  );
}

export function ApiArchiveProgram() {
  return applyDecorators(
    ApiOperation({ summary: "Archive program" }),
    ApiParam({ name: "id", description: "Program UUID" }),
    ApiResponse({
      status: 200,
      description: "Program archived successfully",
      type: ProgramResponseDto,
    }),
    ApiResponse({ status: 400, description: "Invalid status transition" }),
    ApiResponse({ status: 404, description: "Program not found" }),
  );
}

export function ApiDeleteProgram() {
  return applyDecorators(
    ApiOperation({ summary: "Delete program" }),
    ApiParam({ name: "id", description: "Program UUID" }),
    ApiResponse({ status: 204, description: "Program deleted successfully" }),
  );
}
