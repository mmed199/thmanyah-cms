/**
 * Test Utilities
 *
 * Helper functions for e2e tests using Testcontainers.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";
import { appConfig, databaseConfig, redisConfig } from "src/config";
import { CmsModule } from "src/cms";
import { IngestionModule } from "src/ingestion";
import { DiscoveryModule } from "src/discovery";
import { ContentOrmEntity, ProgramOrmEntity } from "src/shared/persistence";

let postgresContainer: StartedPostgreSqlContainer | null = null;

/**
 * Start the Postgres container (shared across tests in a file)
 * Works with both Docker and Podman
 */
export async function startPostgresContainer(): Promise<StartedPostgreSqlContainer> {
  if (!postgresContainer) {
    postgresContainer = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("thmanyah_test")
      .withUsername("test")
      .withPassword("test")
      .withWaitStrategy(Wait.forListeningPorts())
      .withStartupTimeout(120000)
      .start();
  }
  return postgresContainer;
}

/**
 * Stop the Postgres container
 */
export async function stopPostgresContainer(): Promise<void> {
  if (postgresContainer) {
    await postgresContainer.stop();
    postgresContainer = null;
  }
}

/**
 * Create a test application with Testcontainers Postgres
 */
export async function createTestApp(): Promise<INestApplication> {
  const container = await startPostgresContainer();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig, databaseConfig, redisConfig],
      }),
      TypeOrmModule.forRoot({
        type: "postgres",
        host: container.getHost(),
        port: container.getPort(),
        database: container.getDatabase(),
        username: container.getUsername(),
        password: container.getPassword(),
        entities: [ContentOrmEntity, ProgramOrmEntity],
        synchronize: true,
        dropSchema: true,
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
