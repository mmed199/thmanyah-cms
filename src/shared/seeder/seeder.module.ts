/**
 * Seeder Module
 *
 * Provides database seeding functionality.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeederService } from "./seeder.service";
import { ProgramOrmEntity, ContentOrmEntity } from "../persistence";

@Module({
  imports: [TypeOrmModule.forFeature([ProgramOrmEntity, ContentOrmEntity])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
