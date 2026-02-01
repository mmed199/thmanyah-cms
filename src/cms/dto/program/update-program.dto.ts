/**
 * Update Program DTO
 */

import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsOptional, IsEnum } from "class-validator";
import { Status } from "../../../shared/enums";
import { CreateProgramDto, CreateProgramInput } from "./create-program.dto";

/**
 * Pure interface for service layer
 */
export interface UpdateProgramInput extends Partial<CreateProgramInput> {
  status?: Status;
}

/**
 * HTTP DTO with validation decorators
 */
export class UpdateProgramDto extends PartialType(CreateProgramDto) implements UpdateProgramInput {
  @ApiPropertyOptional({ enum: Status, description: "Program status" })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
