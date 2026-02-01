import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ContentOrmEntity } from "@shared/persistence/entities/content.orm-entity";
import { ProgramOrmEntity } from "@shared/persistence/entities/program.orm-entity";
import { ProgramsController } from "./controllers/programs.controller";
import { ContentsController } from "./controllers/contents.controller";
import { CmsContentService } from "./services/content.service";
import { CmsProgramService } from "./services/program.service";
import { CMS_CONTENT_REPOSITORY } from "./adapters/persistence/content.repository.interface";
import { CMS_PROGRAM_REPOSITORY } from "./adapters/persistence/program.repository.interface";
import { CMS_EVENT_PUBLISHER } from "./adapters/messaging/event-publisher.interface";
import { ContentRepository } from "./adapters/persistence/content.repository";
import { ProgramRepository } from "./adapters/persistence/program.repository";
import { EventPublisher } from "./adapters/messaging/event-publisher";

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
    // Repositories & Event Publisher
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
