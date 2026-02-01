/**
 * CMS Content Service Unit Tests
 *
 * Tests business logic with mocked repositories.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { CmsContentService } from "../content.service";
import {
  IContentRepository,
  CMS_CONTENT_REPOSITORY,
} from "../../adapters/persistence/content.repository.interface";
import {
  ICmsProgramRepository,
  CMS_PROGRAM_REPOSITORY,
} from "../../adapters/persistence/program.repository.interface";
import {
  ICmsEventPublisher,
  CMS_EVENT_PUBLISHER,
} from "../../adapters/messaging/event-publisher.interface";
import { Content } from "@shared/entities/content.entity";
import { Program } from "@shared/entities/program.entity";
import { ContentType, Category, Status, Source, ProgramType } from "@shared/enums";

describe("CmsContentService", () => {
  let service: CmsContentService;
  let contentRepository: jest.Mocked<IContentRepository>;
  let programRepository: jest.Mocked<ICmsProgramRepository>;
  let eventPublisher: jest.Mocked<ICmsEventPublisher>;

  const mockContent = new Content({
    id: "content-123",
    programId: "program-123",
    title: "Test Episode",
    description: "Test description",
    type: ContentType.PODCAST_EPISODE,
    category: Category.TECHNOLOGY,
    language: "ar",
    status: Status.DRAFT,
    source: Source.MANUAL,
  });

  const mockProgram = new Program({
    id: "program-123",
    title: "Test Program",
    description: "Test program description",
    type: ProgramType.PODCAST_SERIES,
    category: Category.TECHNOLOGY,
    language: "ar",
  });

  beforeEach(async () => {
    // Create mock implementations
    contentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdWithProgram: jest.fn(),
      delete: jest.fn(),
      findByProgramId: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    programRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdWithContents: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    eventPublisher = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CmsContentService,
        { provide: CMS_CONTENT_REPOSITORY, useValue: contentRepository },
        { provide: CMS_PROGRAM_REPOSITORY, useValue: programRepository },
        { provide: CMS_EVENT_PUBLISHER, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<CmsContentService>(CmsContentService);
  });

  describe("create", () => {
    it("should create content successfully", async () => {
      programRepository.findById.mockResolvedValue(mockProgram);
      contentRepository.save.mockResolvedValue(mockContent);
      eventPublisher.publish.mockResolvedValue(undefined);

      const input = {
        programId: "program-123",
        title: "Test Episode",
        description: "Test description",
        type: ContentType.PODCAST_EPISODE,
        category: Category.TECHNOLOGY,
        language: "ar",
      };

      const result = await service.create(input);

      expect(result).toBeDefined();
      expect(contentRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it("should create content without program", async () => {
      contentRepository.save.mockResolvedValue(mockContent);
      eventPublisher.publish.mockResolvedValue(undefined);

      const input = {
        title: "Standalone Content",
        type: ContentType.ARTICLE,
        category: Category.BUSINESS,
        language: "ar",
      };

      const result = await service.create(input);

      expect(result).toBeDefined();
      expect(programRepository.findById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when program does not exist", async () => {
      programRepository.findById.mockResolvedValue(null);

      const input = {
        programId: "nonexistent-program",
        title: "Test Episode",
        type: ContentType.PODCAST_EPISODE,
        category: Category.TECHNOLOGY,
        language: "ar",
      };

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update content successfully", async () => {
      contentRepository.findById.mockResolvedValue(mockContent);
      contentRepository.save.mockResolvedValue(mockContent);
      eventPublisher.publish.mockResolvedValue(undefined);

      const result = await service.update("content-123", { title: "Updated Title" });

      expect(result).toBeDefined();
      expect(contentRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it("should throw NotFoundException when content does not exist", async () => {
      contentRepository.findById.mockResolvedValue(null);

      await expect(service.update("nonexistent", { title: "New Title" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should publish content and emit event", async () => {
      const draftContent = new Content({
        ...mockContent,
        id: "draft-content",
        status: Status.DRAFT,
      });
      const publishedContent = new Content({
        ...mockContent,
        id: "draft-content",
        status: Status.PUBLISHED,
        publishedAt: new Date(),
      });

      contentRepository.findById.mockResolvedValue(draftContent);
      contentRepository.save.mockResolvedValue(publishedContent);
      eventPublisher.publish.mockResolvedValue(undefined);

      await service.publish("draft-content");

      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it("should reject invalid status transitions", async () => {
      const archivedContent = new Content({
        ...mockContent,
        id: "archived-content",
        status: Status.ARCHIVED,
      });

      contentRepository.findById.mockResolvedValue(archivedContent);

      await expect(service.update("archived-content", { status: Status.PUBLISHED })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("delete", () => {
    it("should delete content successfully", async () => {
      contentRepository.findById.mockResolvedValue(mockContent);
      contentRepository.delete.mockResolvedValue(true);
      eventPublisher.publish.mockResolvedValue(undefined);

      await service.delete("content-123");

      expect(contentRepository.delete).toHaveBeenCalledWith("content-123");
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it("should throw NotFoundException when content does not exist", async () => {
      contentRepository.findById.mockResolvedValue(null);

      await expect(service.delete("nonexistent")).rejects.toThrow(NotFoundException);
    });
  });

  describe("findById", () => {
    it("should return content when found", async () => {
      contentRepository.findById.mockResolvedValue(mockContent);

      const result = await service.findById("content-123");

      expect(result).toEqual(mockContent);
    });

    it("should throw NotFoundException when content not found", async () => {
      contentRepository.findById.mockResolvedValue(null);

      await expect(service.findById("nonexistent")).rejects.toThrow(NotFoundException);
    });
  });

  describe("findAll", () => {
    it("should return paginated results", async () => {
      const paginatedResult = {
        data: [mockContent],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      contentRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result).toEqual(paginatedResult);
      expect(contentRepository.findAll).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
    });
  });
});
