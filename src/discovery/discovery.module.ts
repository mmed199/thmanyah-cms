import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RedisModule } from "@nestjs-modules/ioredis";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";

// Shared persistence entities
import { ContentOrmEntity, ProgramOrmEntity } from "../shared/persistence";

// Resolvers
import { ProgramsResolver } from "./resolvers/programs.resolver";
import { ContentsResolver } from "./resolvers/contents.resolver";
import { SearchResolver } from "./resolvers/search.resolver";

// Services
import { SearchService } from "./services/search.service";
import { CacheService } from "./services/cache.service";

// Repositories (interfaces and implementations)
import { DISCOVERY_CONTENT_READER } from "./repositories/content-reader.interface";
import { DISCOVERY_PROGRAM_READER } from "./repositories/program-reader.interface";
import { DISCOVERY_CACHE } from "./repositories/cache.interface";
import { ContentReader } from "./repositories/content-reader";
import { ProgramReader } from "./repositories/program-reader";
import { CacheRepository } from "./repositories/cache";

/**
 * Discovery Module
 *
 * Self-contained module for content discovery (consumer-facing GraphQL API).
 * Provides search, filtering, and caching for optimal read performance.
 * Owns its own ports, adapters, and services.
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/discovery/schema.gql"),
      sortSchema: true,
      playground: true,
      introspection: true,
      path: "/graphql",
      context: ({ req }) => ({ req }),
    }),
    TypeOrmModule.forFeature([ContentOrmEntity, ProgramOrmEntity]),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "single",
        url: config.get("REDIS_URL", "redis://localhost:6379"),
      }),
    }),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    // Resolvers
    ProgramsResolver,
    ContentsResolver,
    SearchResolver,
    // Services
    SearchService,
    CacheService,
    // Repositories
    {
      provide: DISCOVERY_CONTENT_READER,
      useClass: ContentReader,
    },
    {
      provide: DISCOVERY_PROGRAM_READER,
      useClass: ProgramReader,
    },
    {
      provide: DISCOVERY_CACHE,
      useClass: CacheRepository,
    },
  ],
  exports: [SearchService, CacheService],
})
export class DiscoveryModule {}
