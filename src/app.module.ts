/**
 * App Module
 *
 * Root module that bootstraps the application.
 * Each feature module (CMS, Discovery, Ingestion) is self-contained
 * with its own ports, adapters, and services.
 */

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { appConfig, databaseConfig, redisConfig } from "./config";
import { CmsModule } from "./cms";
import { IngestionModule } from "./ingestion";
import { DiscoveryModule } from "./discovery";
import { SeederModule } from "./shared/seeder";

// Shared persistence entities for TypeORM auto-loading
import { ContentOrmEntity, ProgramOrmEntity } from "./shared/persistence";

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("database.host"),
        port: configService.get<number>("database.port"),
        database: configService.get<string>("database.name"),
        username: configService.get<string>("database.user"),
        password: configService.get<string>("database.password"),
        entities: [ContentOrmEntity, ProgramOrmEntity],
        synchronize: configService.get<string>("app.nodeEnv") === "development",
        logging: configService.get<string>("app.nodeEnv") === "development",
      }),
    }),

    // Feature Modules (each self-contained with own ports & adapters)
    CmsModule, // REST API for content management
    IngestionModule, // Content ingestion from external sources
    DiscoveryModule, // GraphQL API for consumers

    // Seeder (populates initial data in development)
    SeederModule,
  ],
})
export class AppModule {}
