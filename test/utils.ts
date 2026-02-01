/**
 * Test Utilities
 *
 * Helper functions for e2e tests.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { appConfig, databaseConfig, redisConfig } from "src/config";
import { CmsModule } from "src/cms";
import { IngestionModule } from "src/ingestion";
import { DiscoveryModule } from "src/discovery";
import { ContentOrmEntity, ProgramOrmEntity } from "src/shared/persistence";

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig, databaseConfig, redisConfig],
        envFilePath: ".env.test",
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          type: "postgres",
          host: configService.get<string>("database.host", "localhost"),
          port: configService.get<number>("database.port", 5432),
          database: configService.get<string>("database.name", "thmanyah_test"),
          username: configService.get<string>("database.user", "postgres"),
          password: configService.get<string>("database.password", "postgres"),
          entities: [ContentOrmEntity, ProgramOrmEntity],
          synchronize: true, // Use synchronize for tests
          dropSchema: true, // Clean database before tests
        }),
      }),
      CmsModule,
      IngestionModule,
      DiscoveryModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Match main.ts configuration
  app.setGlobalPrefix("api");

  await app.init();

  return app;
}

export function generateTestProgram(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Program",
    description: "A test program description",
    type: "podcast_series",
    category: "technology",
    language: "ar",
    ...overrides,
  };
}

export function generateTestContent(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Content",
    description: "A test content description",
    type: "podcast_episode",
    category: "technology",
    language: "ar",
    ...overrides,
  };
}
