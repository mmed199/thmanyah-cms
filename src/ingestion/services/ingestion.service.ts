/**
 * Ingestion Service
 *
 * Orchestrates content import from external sources using strategy pattern.
 * Handles idempotent imports (skips already-existing content by externalId).
 */

import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { Content } from "../../shared/entities/content.entity";
import { Program } from "../../shared/entities/program.entity";
import { Source, ContentType, Category, ProgramType } from "../../shared/enums";
import { ContentCreatedEvent } from "../../shared/events/content";
import { ProgramCreatedEvent } from "../../shared/events/program";
import type { IIngestionContentWriter } from "../repositories/content-writer.interface";
import { INGESTION_CONTENT_WRITER } from "../repositories/content-writer.interface";
import type { IIngestionProgramRepository } from "../repositories/program-repository.interface";
import { INGESTION_PROGRAM_REPOSITORY } from "../repositories/program-repository.interface";
import type { IIngestionEventPublisher } from "../repositories/event-publisher.interface";
import { INGESTION_EVENT_PUBLISHER } from "../repositories/event-publisher.interface";
import {
  IIngestionStrategy,
  INGESTION_STRATEGIES,
  ImportRequest,
  ImportResult,
  ExternalContentItem,
} from "../interfaces/ingestion.interface";

@Injectable()
export class IngestionService {
  private strategyMap: Map<Source, IIngestionStrategy>;

  constructor(
    @Inject(INGESTION_STRATEGIES)
    private readonly strategies: IIngestionStrategy[],
    @Inject(INGESTION_CONTENT_WRITER)
    private readonly contentWriter: IIngestionContentWriter,
    @Inject(INGESTION_PROGRAM_REPOSITORY)
    private readonly programRepository: IIngestionProgramRepository,
    @Inject(INGESTION_EVENT_PUBLISHER)
    private readonly eventPublisher: IIngestionEventPublisher,
  ) {
    // Build strategy map for O(1) lookup
    this.strategyMap = new Map(strategies.map((strategy) => [strategy.source, strategy]));
  }

  /**
   * Import content from external source
   */
  async import(request: ImportRequest): Promise<ImportResult> {
    const strategy = this.strategyMap.get(request.source);
    if (!strategy) {
      throw new BadRequestException(`No strategy registered for source: ${request.source}`);
    }

    // Get or create program
    let programId = request.programId;
    if (!programId) {
      programId = await this.getOrCreateProgram(strategy, request);
    } else {
      // Verify program exists
      const program = await this.programRepository.findById(programId);
      if (!program) {
        throw new NotFoundException(`Program with ID ${programId} not found`);
      }
    }

    // Fetch content from external source
    const fetchResult = await strategy.fetch(request.channelId, {
      maxResults: request.maxResults ?? 50,
    });

    // Import content items
    const result: ImportResult = {
      source: request.source,
      channelId: request.channelId,
      programId,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (const item of fetchResult.items) {
      try {
        const imported = await this.importItem(
          item,
          programId,
          request.source,
          request.contentType ?? ContentType.PODCAST_EPISODE,
          request.category ?? Category.ENTERTAINMENT,
        );

        if (imported) {
          result.imported++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(
          `Failed to import ${item.externalId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return result;
  }

  /**
   * Get available sources (strategies)
   */
  getAvailableSources(): Source[] {
    return Array.from(this.strategyMap.keys());
  }

  /**
   * Import a single content item (idempotent)
   */
  private async importItem(
    item: ExternalContentItem,
    programId: string,
    source: Source,
    contentType: ContentType,
    category: Category,
  ): Promise<boolean> {
    // Check if content already exists (idempotent import)
    const existing = await this.contentWriter.findByExternalId(source, item.externalId);
    if (existing) {
      return false; // Skip - already imported
    }

    // Create new content
    const content = new Content({
      id: uuid(),
      programId,
      title: item.title,
      description: item.description,
      type: contentType,
      category,
      language: "ar", // Default to Arabic for Thmanyah
      source,
      externalId: item.externalId,
      metadata: {
        ...item.metadata,
        duration: item.duration,
        thumbnailUrl: item.thumbnailUrl,
        originalPublishedAt: item.publishedAt,
      },
    });

    const saved = await this.contentWriter.save(content);

    await this.eventPublisher.publish(
      new ContentCreatedEvent(
        saved.id,
        saved.programId,
        saved.title,
        saved.type,
        saved.category,
        saved.language,
      ),
    );

    return true;
  }

  /**
   * Get or create program based on channel info
   */
  private async getOrCreateProgram(
    strategy: IIngestionStrategy,
    request: ImportRequest,
  ): Promise<string> {
    // Try to get channel info if strategy supports it
    let channelInfo: { title: string; description?: string } = {
      title: `Imported from ${request.source}`,
      description: undefined,
    };

    if (strategy.getChannelInfo) {
      const info = await strategy.getChannelInfo(request.channelId);
      channelInfo = { title: info.title, description: info.description };
    }

    // Create program
    const program = new Program({
      id: uuid(),
      title: channelInfo.title,
      description: channelInfo.description,
      type: ProgramType.PODCAST_SERIES, // Default
      category: request.category ?? Category.ENTERTAINMENT,
      language: "ar",
      metadata: {
        externalChannelId: request.channelId,
        source: request.source,
      },
    });

    const saved = await this.programRepository.save(program);

    await this.eventPublisher.publish(new ProgramCreatedEvent(saved.id, saved.title));

    return saved.id;
  }
}
