import { Resolver, Query, Args } from "@nestjs/graphql";
import { SearchInput, SearchResult, SearchResultItem } from "../types/search/search.type";
import { SearchService } from "../services/search.service";
import { CacheService } from "../services/cache.service";

/**
 * Search Resolver
 *
 * GraphQL resolver for unified search queries.
 */
@Resolver()
export class SearchResolver {
  constructor(
    private readonly searchService: SearchService,
    private readonly cacheService: CacheService,
  ) {}

  @Query(() => SearchResult, { name: "search" })
  async search(@Args("input") input: SearchInput): Promise<SearchResult> {
    const cacheKey = this.cacheService.generateSearchKey(
      input as unknown as Record<string, unknown>,
    );

    // Try cache first
    const cached = await this.cacheService.getSearchResults<SearchResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const results = await this.searchService.search({
      query: input.query,
      categories: input.categories,
      contentTypes: input.contentTypes,
      programTypes: input.programTypes,
      language: input.language,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    });

    const response: SearchResult = {
      items: results.items.map((item) => this.mapToGraphQL(item)),
      total: results.total,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
      query: input.query,
    };

    await this.cacheService.setSearchResults(cacheKey, response);
    return response;
  }

  private mapToGraphQL(item: any): SearchResultItem {
    const result: SearchResultItem = {
      score: item.score,
    };

    if (item.program) {
      result.program = {
        id: item.program.id,
        title: item.program.title,
        description: item.program.description ?? undefined,
        type: item.program.type,
        category: item.program.category,
        language: item.program.language,
        status: item.program.status,
        createdAt: item.program.createdAt,
        updatedAt: item.program.updatedAt,
      };
    }

    if (item.content) {
      result.content = {
        id: item.content.id,
        programId: item.content.programId ?? undefined,
        title: item.content.title,
        description: item.content.description ?? undefined,
        type: item.content.type,
        category: item.content.category,
        language: item.content.language,
        status: item.content.status,
        source: item.content.source,
        externalId: item.content.externalId ?? undefined,
        publishedAt: item.content.publishedAt ?? undefined,
        createdAt: item.content.createdAt,
        updatedAt: item.content.updatedAt,
        duration: item.content.metadata?.duration,
        thumbnailUrl: item.content.metadata?.thumbnailUrl,
      };
    }

    return result;
  }
}
