/**
 * Domain Module
 *
 * Contains pure domain logic: entities, events, ports, and services.
 * Infrastructure adapters are injected through ports.
 */

import { Module } from "@nestjs/common";
import { InfrastructureModule } from "../infrastructure/infrastructure.module";
import { ProgramService } from "./services/program.service";
import { ContentService } from "./services/content.service";

@Module({
  imports: [InfrastructureModule],
  providers: [ProgramService, ContentService],
  exports: [ProgramService, ContentService],
})
export class DomainModule {}
