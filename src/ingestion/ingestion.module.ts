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
import { ContentOrmEntity, ProgramOrmEntity } from "../shared/persistence";

// Controllers
import { IngestionController } from "./controllers/ingestion.controller";

// Services
import { IngestionService } from "./services/ingestion.service";

// Strategies
import { MockYouTubeStrategy } from "./strategies/mock-youtube.strategy";
import { INGESTION_STRATEGIES } from "./interfaces/ingestion.interface";

// Repositories (interfaces and implementations)
import { INGESTION_CONTENT_WRITER } from "./repositories/content-writer.interface";
import { INGESTION_PROGRAM_REPOSITORY } from "./repositories/program-repository.interface";
import { INGESTION_EVENT_PUBLISHER } from "./repositories/event-publisher.interface";
import { ContentWriter } from "./repositories/content-writer";
import { ProgramRepository } from "./repositories/program-repository";
import { EventPublisher } from "./repositories/event-publisher";

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
