import { Inject } from "@nestjs/common";
import { Resolver, Query, Args, ID, Int } from "@nestjs/graphql";
import { ContentGraphQLType } from "../types/content/content.type";
import { PaginatedContents } from "../types/search/search.type";
import { SearchService } from "../services/search.service";
import { CacheService } from "../services/cache.service";
import type { IDiscoveryContentReader } from "../adapters/persistence/content-reader.interface";
import { DISCOVERY_CONTENT_READER } from "../adapters/persistence/content-reader.interface";
import { Category } from "@shared/enums/category.enum";
import { ContentType } from "@shared/enums/content-type.enum";

/**
 * Contents Resolver
 *
 * GraphQL resolver for Content queries.
 */
@Resolver(() => ContentGraphQLType)
export class ContentsResolver {
  constructor(
    @Inject(DISCOVERY_CONTENT_READER)
    private readonly contentReader: IDiscoveryContentReader,
    private readonly searchService: SearchService,
    private readonly cacheService: CacheService,
  ) {}

  @Query(() => ContentGraphQLType, { name: "content", nullable: true })
  async getContent(@Args("id", { type: () => ID }) id: string): Promise<ContentGraphQLType | null> {
    // Try cache first
    const cached = await this.cacheService.getContent<ContentGraphQLType>(id);
    if (cached) {
      return cached;
    }

    try {
      // contentReader already filters for published content
      const content = await this.contentReader.findById(id);
      if (!content) {
        return null;
      }

      const result = this.mapToGraphQL(content);
      await this.cacheService.setContent(id, result);
      return result;
    } catch {
      return null;
    }
  }

  @Query(() => PaginatedContents, { name: "contents" })
  async getContents(
    @Args("programId", { type: () => ID, nullable: true }) programId?: string,
    @Args("category", { type: () => Category, nullable: true }) category?: Category,
    @Args("type", { type: () => ContentType, nullable: true }) type?: ContentType,
    @Args("language", { nullable: true }) language?: string,
    @Args("limit", { type: () => Int, nullable: true, defaultValue: 20 }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<PaginatedContents> {
    const cacheKey = this.cacheService.generateSearchKey({
      programId,
      category,
      type,
      language,
      limit,
      offset,
    });

    // Try cache first
    const cached = await this.cacheService.getSearchResults<PaginatedContents>(
      `contents:${cacheKey}`,
    );
    if (cached) {
      return cached;
    }

    let results;

    if (programId) {
      results = await this.searchService.getPublishedContentsByProgram(
        programId,
        limit ?? 20,
        offset ?? 0,
      );
    } else {
      results = await this.searchService.searchContents({
        categories: category ? [category] : undefined,
        contentTypes: type ? [type] : undefined,
        language,
        limit: limit ?? 20,
        offset: offset ?? 0,
      });
    }

    const response: PaginatedContents = {
      items: results.items.map(this.mapToGraphQL),
      total: results.total,
      limit: limit ?? 20,
      offset: offset ?? 0,
    };

    await this.cacheService.setSearchResults(`contents:${cacheKey}`, response);
    return response;
  }

  private mapToGraphQL(content: any): ContentGraphQLType {
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
