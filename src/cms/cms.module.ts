/**
 * CMS Module
 *
 * Self-contained module for content management system operations.
 * Owns its own ports, adapters, and services.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";

// Shared persistence entities
import { ContentOrmEntity, ProgramOrmEntity } from "../shared/persistence";

// Controllers
import { ProgramsController } from "./controllers/programs.controller";
import { ContentsController } from "./controllers/contents.controller";

// Services
import { CmsContentService } from "./services/content.service";
import { CmsProgramService } from "./services/program.service";

// Repositories (interfaces and implementations)
import { CMS_CONTENT_REPOSITORY } from "./repositories/content.repository.interface";
import { CMS_PROGRAM_REPOSITORY } from "./repositories/program.repository.interface";
import { CMS_EVENT_PUBLISHER } from "./repositories/event-publisher.interface";
import { ContentRepository } from "./repositories/content.repository";
import { ProgramRepository } from "./repositories/program.repository";
import { EventPublisher } from "./repositories/event-publisher";

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentOrmEntity, ProgramOrmEntity]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [ProgramsController, ContentsController],
  providers: [
    // Services
    CmsContentService,
    CmsProgramService,
    // Infrastructure implementations
    {
      provide: CMS_CONTENT_REPOSITORY,
      useClass: ContentRepository,
    },
    {
      provide: CMS_PROGRAM_REPOSITORY,
      useClass: ProgramRepository,
    },
    {
      provide: CMS_EVENT_PUBLISHER,
      useClass: EventPublisher,
    },
  ],
  exports: [CmsContentService, CmsProgramService],
})
export class CmsModule {}
