import { Resolver, Query, Args, ID, Int, ResolveField, Parent } from "@nestjs/graphql";
import { ProgramGraphQLType } from "../types/program/program.type";
import { ContentGraphQLType } from "../types/content/content.type";
import { PaginatedPrograms } from "../types/search/search.type";
import { SearchService } from "../services/search.service";
import { CacheService } from "../services/cache.service";
import type { IDiscoveryProgramReader } from "../adapters/persistence/program-reader.interface";
import { DISCOVERY_PROGRAM_READER } from "../adapters/persistence/program-reader.interface";
import { Category } from "@shared/enums/category.enum";
import { ProgramType } from "@shared/enums/program-type.enum";
import { Inject } from "@nestjs/common";

/**
 * Programs Resolver
 *
 * GraphQL resolver for Program queries.
 */
@Resolver(() => ProgramGraphQLType)
export class ProgramsResolver {
  constructor(
    @Inject(DISCOVERY_PROGRAM_READER)
    private readonly programReader: IDiscoveryProgramReader,
    private readonly searchService: SearchService,
    private readonly cacheService: CacheService,
  ) {}

  @Query(() => ProgramGraphQLType, { name: "program", nullable: true })
  async getProgram(@Args("id", { type: () => ID }) id: string): Promise<ProgramGraphQLType | null> {
    // Try cache first
    const cached = await this.cacheService.getProgram<ProgramGraphQLType>(id);
    if (cached) {
      return cached;
    }

    try {
      // programReader already filters for published programs
      const program = await this.programReader.findById(id);
      if (!program) {
        return null;
      }

      const result = this.mapToGraphQL(program);
      await this.cacheService.setProgram(id, result);
      return result;
    } catch {
      return null;
    }
  }

  @Query(() => PaginatedPrograms, { name: "programs" })
  async getPrograms(
    @Args("category", { type: () => Category, nullable: true }) category?: Category,
    @Args("type", { type: () => ProgramType, nullable: true }) type?: ProgramType,
    @Args("language", { nullable: true }) language?: string,
    @Args("limit", { type: () => Int, nullable: true, defaultValue: 20 }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<PaginatedPrograms> {
    const cacheKey = this.cacheService.generateSearchKey({
      category,
      type,
      language,
      limit,
      offset,
    });

    // Try cache first
    const cached = await this.cacheService.getSearchResults<PaginatedPrograms>(
      `programs:${cacheKey}`,
    );
    if (cached) {
      return cached;
    }

    const results = await this.searchService.searchPrograms({
      categories: category ? [category] : undefined,
      programTypes: type ? [type] : undefined,
      language,
      limit: limit ?? 20,
      offset: offset ?? 0,
    });

    const response: PaginatedPrograms = {
      items: results.items.map(this.mapToGraphQL),
      total: results.total,
      limit: limit ?? 20,
      offset: offset ?? 0,
    };

    await this.cacheService.setSearchResults(`programs:${cacheKey}`, response);
    return response;
  }

  @ResolveField(() => [ContentGraphQLType], { name: "contents" })
  async getContents(
    @Parent() program: ProgramGraphQLType,
    @Args("limit", { type: () => Int, nullable: true, defaultValue: 20 }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<ContentGraphQLType[]> {
    // Try cache first
    const cacheKey = `${program.id}:${limit}:${offset}`;
    const cached = await this.cacheService.getProgramContents<ContentGraphQLType[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const results = await this.searchService.getPublishedContentsByProgram(
      program.id,
      limit ?? 20,
      offset ?? 0,
    );

    const mapped = results.items.map(this.mapContentToGraphQL);
    await this.cacheService.setProgramContents(cacheKey, mapped);
    return mapped;
  }

  @ResolveField(() => Int, { name: "contentCount" })
  async getContentCount(@Parent() program: ProgramGraphQLType): Promise<number> {
    const results = await this.searchService.getPublishedContentsByProgram(program.id, 1, 0);
    return results.total;
  }

  private mapToGraphQL(program: any): ProgramGraphQLType {
    return {
      id: program.id,
      title: program.title,
      description: program.description ?? undefined,
      type: program.type,
      category: program.category,
      language: program.language,
      status: program.status,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }

  private mapContentToGraphQL(content: any): ContentGraphQLType {
    return {
      id: content.id,
      programId: content.programId ?? undefined,
      title: content.title,
      description: content.description ?? undefined,
      type: content.type,
      category: content.category,
      language: content.language,
      status: content.status,
      source: content.source,
      externalId: content.externalId ?? undefined,
      publishedAt: content.publishedAt ?? undefined,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      duration: content.metadata?.duration,
      thumbnailUrl: content.metadata?.thumbnailUrl,
    };
  }
}
