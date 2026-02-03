/**
 * Test Utilities
 *
 * Helper functions for e2e tests using Testcontainers.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule, getDataSourceToken } from "@nestjs/typeorm";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { appConfig, databaseConfig, redisConfig } from "src/config";
import { CmsModule } from "src/cms";
import { IngestionModule } from "src/ingestion";
import { DiscoveryModule } from "src/discovery";
import { ContentOrmEntity, ProgramOrmEntity } from "src/shared/persistence";

let postgresContainer: StartedPostgreSqlContainer | null = null;
let redisContainer: StartedTestContainer | null = null;

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
 * Start the Redis container (shared across tests in a file)
 */
export async function startRedisContainer(): Promise<StartedTestContainer> {
  if (!redisContainer) {
    redisContainer = await new GenericContainer("redis:7-alpine")
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forListeningPorts())
      .withStartupTimeout(60000)
      .start();
  }
  return redisContainer;
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
 * Stop the Redis container
 */
export async function stopRedisContainer(): Promise<void> {
  if (redisContainer) {
    await redisContainer.stop();
    redisContainer = null;
  }
}

/**
 * Stop all test containers
 */
export async function stopAllContainers(): Promise<void> {
  await stopPostgresContainer();
  await stopRedisContainer();
}

/**
 * Add search_vector columns that TypeORM synchronize doesn't support
 */
async function addSearchVectorColumns(dataSource: any): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  try {
    // Add search_vector to programs table
    await queryRunner.query(`
      ALTER TABLE "programs" 
      ADD COLUMN IF NOT EXISTS "search_vector" tsvector 
      GENERATED ALWAYS AS (to_tsvector('simple', COALESCE(title,'') || ' ' || COALESCE(description,''))) STORED
    `);
    
    // Add search_vector to content table
    await queryRunner.query(`
      ALTER TABLE "content" 
      ADD COLUMN IF NOT EXISTS "search_vector" tsvector 
      GENERATED ALWAYS AS (to_tsvector('simple', COALESCE(title,'') || ' ' || COALESCE(description,''))) STORED
    `);
    
    // Create GIN indexes for full-text search
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_program_search" ON "programs" USING GIN("search_vector")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_content_search" ON "content" USING GIN("search_vector")`);
  } finally {
    await queryRunner.release();
  }
}

/**
 * Create a test application with Testcontainers Postgres and Redis
 */
export async function createTestApp(): Promise<INestApplication> {
  const pgContainer = await startPostgresContainer();
  const redisCtainer = await startRedisContainer();

  // Set REDIS_URL env var so DiscoveryModule's RedisModule picks it up
  const redisUrl = `redis://${redisCtainer.getHost()}:${redisCtainer.getMappedPort(6379)}`;
  process.env.REDIS_URL = redisUrl;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig, databaseConfig, redisConfig],
      }),
      TypeOrmModule.forRoot({
        type: "postgres",
        host: pgContainer.getHost(),
        port: pgContainer.getPort(),
        database: pgContainer.getDatabase(),
        username: pgContainer.getUsername(),
        password: pgContainer.getPassword(),
        entities: [ContentOrmEntity, ProgramOrmEntity],
        synchronize: true,
        dropSchema: true,
      }),
      CmsModule,
      IngestionModule,
      DiscoveryModule,
    ],
  }).compile();

  // Add search_vector columns after TypeORM syncs the schema
  const dataSource = moduleFixture.get(getDataSourceToken());
  await addSearchVectorColumns(dataSource);

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
