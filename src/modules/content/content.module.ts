import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Program } from './domain/entities/program.entity';
import { Content } from './domain/entities/content.entity';
import { ProgramRepository } from './infrastructure/repositories/program.repository';
import { ContentRepository } from './infrastructure/repositories/content.repository';
import { ProgramService } from './application/services/program.service';
import { ContentService } from './application/services/content.service';
import { PROGRAM_REPOSITORY } from './application/interfaces/program.repository.interface';
import { CONTENT_REPOSITORY } from './application/interfaces/content.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Program, Content]),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    // Repositories
    {
      provide: PROGRAM_REPOSITORY,
      useClass: ProgramRepository,
    },
    {
      provide: CONTENT_REPOSITORY,
      useClass: ContentRepository,
    },
    // Services
    ProgramService,
    ContentService,
  ],
  exports: [ProgramService, ContentService, PROGRAM_REPOSITORY, CONTENT_REPOSITORY],
})
export class ContentModule {}
