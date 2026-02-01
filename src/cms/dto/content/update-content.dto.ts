/**
 * Update Content DTO
 */

import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsOptional, IsEnum } from "class-validator";
import { Status } from "../../../shared/enums";
import { CreateContentDto, CreateContentInput } from "./create-content.dto";

/**
 * Pure interface for service layer
 */
export interface UpdateContentInput extends Partial<CreateContentInput> {
  status?: Status;
}

/**
 * HTTP DTO with validation decorators
 */
export class UpdateContentDto extends PartialType(CreateContentDto) implements UpdateContentInput {
  @ApiPropertyOptional({ enum: Status, description: "Content status" })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
