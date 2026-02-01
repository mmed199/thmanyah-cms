/**
 * Ingestion Module
 *
 * Self-contained module for content ingestion from external sources.
 * Uses strategy pattern for pluggable source adapters.
 * Owns its own ports, adapters, and services.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";

// Shared persistence entities
import { ContentOrmEntity } from "@shared/persistence/entities/content.orm-entity";
import { ProgramOrmEntity } from "@shared/persistence/entities/program.orm-entity";

// Controllers
import { IngestionController } from "./controllers/ingestion.controller";

// Services
import { IngestionService } from "./services/ingestion.service";

// Strategies
import { MockYouTubeStrategy } from "./strategies/mock-youtube.strategy";
import { INGESTION_STRATEGIES } from "./interfaces/ingestion.interface";

// Repositories (interfaces and implementations)
import { INGESTION_CONTENT_WRITER } from "./adapters/persistence/content-writer.interface";
import { INGESTION_PROGRAM_REPOSITORY } from "./adapters/persistence/program-repository.interface";
import { INGESTION_EVENT_PUBLISHER } from "./adapters/messaging/event-publisher.interface";
import { ContentWriter } from "./adapters/persistence/content-writer";
import { ProgramRepository } from "./adapters/persistence/program-repository";
import { EventPublisher } from "./adapters/messaging/event-publisher";

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentOrmEntity, ProgramOrmEntity]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [IngestionController],
  providers: [
    // Services
    IngestionService,
    // Strategies
    MockYouTubeStrategy,
    {
      provide: INGESTION_STRATEGIES,
      useFactory: (mockYoutube: MockYouTubeStrategy) => [mockYoutube],
      inject: [MockYouTubeStrategy],
    },
    // Repositories
    {
      provide: INGESTION_CONTENT_WRITER,
      useClass: ContentWriter,
    },
    {
      provide: INGESTION_PROGRAM_REPOSITORY,
      useClass: ProgramRepository,
    },
    {
      provide: INGESTION_EVENT_PUBLISHER,
      useClass: EventPublisher,
    },
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
