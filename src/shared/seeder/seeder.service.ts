/**
 * Database Seeder Service
 *
 * Populates initial data on application startup.
 * Only seeds if the database is empty.
 */

import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuid } from "uuid";
import { ProgramOrmEntity } from "../persistence/entities/program.orm-entity";
import { ContentOrmEntity } from "../persistence/entities/content.orm-entity";
import { ProgramType } from "../enums/program-type.enum";
import { Category } from "../enums/category.enum";
import { Status } from "../enums/status.enum";
import { ContentType } from "../enums/content-type.enum";
import { Source } from "../enums/source.enum";

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(ProgramOrmEntity)
    private readonly programRepository: Repository<ProgramOrmEntity>,
    @InjectRepository(ContentOrmEntity)
    private readonly contentRepository: Repository<ContentOrmEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    const programCount = await this.programRepository.count();

    if (programCount > 0) {
      this.logger.log("Database already seeded, skipping...");
      return;
    }

    this.logger.log("Seeding database with initial data...");

    // Create programs
    const programs = await this.createPrograms();

    // Create content for each program
    await this.createContent(programs);

    this.logger.log(`✅ Seeded ${programs.length} programs with content`);
  }

  private async createPrograms(): Promise<ProgramOrmEntity[]> {
    const now = new Date();

    const programsData: Partial<ProgramOrmEntity>[] = [
      {
        id: uuid(),
        title: "سوالف بزنس",
        description: "بودكاست عن ريادة الأعمال والاستثمار في الشرق الأوسط",
        type: ProgramType.PODCAST_SERIES,
        category: Category.BUSINESS,
        language: "ar",
        status: Status.PUBLISHED,
        metadata: {
          host: "مشهور الدبيان",
          website: "https://thmanyah.com/swalif",
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuid(),
        title: "فنجان",
        description: "بودكاست يناقش مواضيع ثقافية واجتماعية متنوعة مع ضيوف مميزين",
        type: ProgramType.PODCAST_SERIES,
        category: Category.SOCIETY,
        language: "ar",
        status: Status.PUBLISHED,
        metadata: {
          host: "عبدالرحمن أبومالح",
          website: "https://thmanyah.com/finjan",
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuid(),
        title: "بودكاست التقنية",
        description: "نناقش آخر أخبار التقنية والتطورات في عالم البرمجة والذكاء الاصطناعي",
        type: ProgramType.PODCAST_SERIES,
        category: Category.TECHNOLOGY,
        language: "ar",
        status: Status.PUBLISHED,
        metadata: {
          frequency: "weekly",
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuid(),
        title: "وثائقي: رحلة في التاريخ",
        description: "سلسلة وثائقية تستكشف أحداث تاريخية مهمة في المنطقة العربية",
        type: ProgramType.DOCUMENTARY_SERIES,
        category: Category.CULTURE,
        language: "ar",
        status: Status.PUBLISHED,
        metadata: {
          episodes: 12,
          season: 1,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuid(),
        title: "Draft Program",
        description: "This program is still in draft status",
        type: ProgramType.PODCAST_SERIES,
        category: Category.ENTERTAINMENT,
        language: "ar",
        status: Status.DRAFT,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const programs = this.programRepository.create(programsData);
    return this.programRepository.save(programs);
  }

  private async createContent(programs: ProgramOrmEntity[]): Promise<void> {
    const now = new Date();
    const publishedPrograms = programs.filter((p) => p.status === Status.PUBLISHED);

    const contentData: Partial<ContentOrmEntity>[] = [];

    // Swalif Business episodes
    const swalifBusiness = publishedPrograms.find((p) => p.title === "سوالف بزنس");
    if (swalifBusiness) {
      contentData.push(
        {
          id: uuid(),
          programId: swalifBusiness.id,
          title: "الحلقة 1: كيف تبدأ مشروعك الخاص",
          description: "في هذه الحلقة نناقش الخطوات الأولى لبدء مشروع ناجح",
          type: ContentType.PODCAST_EPISODE,
          category: Category.BUSINESS,
          language: "ar",
          status: Status.PUBLISHED,
          source: Source.MANUAL,
          metadata: { duration: 3600, episodeNumber: 1 },
          publishedAt: new Date("2025-01-15"),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          programId: swalifBusiness.id,
          title: "الحلقة 2: التمويل والاستثمار",
          description: "كيف تحصل على تمويل لمشروعك وما هي أفضل الطرق للتعامل مع المستثمرين",
          type: ContentType.PODCAST_EPISODE,
          category: Category.BUSINESS,
          language: "ar",
          status: Status.PUBLISHED,
          source: Source.MANUAL,
          metadata: { duration: 4200, episodeNumber: 2 },
          publishedAt: new Date("2025-01-22"),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          programId: swalifBusiness.id,
          title: "الحلقة 3: بناء فريق العمل",
          description: "حلقة قادمة عن كيفية اختيار وبناء فريق عمل ناجح",
          type: ContentType.PODCAST_EPISODE,
          category: Category.BUSINESS,
          language: "ar",
          status: Status.DRAFT,
          source: Source.MANUAL,
          metadata: { duration: 3800, episodeNumber: 3 },
          createdAt: now,
          updatedAt: now,
        },
      );
    }

    // Finjan episodes
    const finjan = publishedPrograms.find((p) => p.title === "فنجان");
    if (finjan) {
      contentData.push(
        {
          id: uuid(),
          programId: finjan.id,
          title: "لقاء مع كاتب سعودي شاب",
          description: "نستضيف كاتباً سعودياً شاباً للحديث عن تجربته في عالم الكتابة",
          type: ContentType.PODCAST_EPISODE,
          category: Category.SOCIETY,
          language: "ar",
          status: Status.PUBLISHED,
          source: Source.MANUAL,
          metadata: { duration: 5400, guest: "أحمد المحمد" },
          publishedAt: new Date("2025-01-10"),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          programId: finjan.id,
          title: "مستقبل التعليم في العالم العربي",
          description: "نناقش التحديات والفرص في قطاع التعليم",
          type: ContentType.PODCAST_EPISODE,
          category: Category.SOCIETY,
          language: "ar",
          status: Status.PUBLISHED,
          source: Source.MANUAL,
          metadata: { duration: 4800 },
          publishedAt: new Date("2025-01-17"),
          createdAt: now,
          updatedAt: now,
        },
      );
    }

    // Tech podcast episodes
    const techPodcast = publishedPrograms.find((p) => p.title === "بودكاست التقنية");
    if (techPodcast) {
      contentData.push(
        {
          id: uuid(),
          programId: techPodcast.id,
          title: "الذكاء الاصطناعي في 2025",
          description: "نظرة على أحدث تطورات الذكاء الاصطناعي وتأثيرها على حياتنا",
          type: ContentType.PODCAST_EPISODE,
          category: Category.TECHNOLOGY,
          language: "ar",
          status: Status.PUBLISHED,
          source: Source.MANUAL,
          metadata: { duration: 3200 },
          publishedAt: new Date("2025-01-20"),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          programId: techPodcast.id,
          title: "مقدمة في تطوير التطبيقات",
          description: "دليل المبتدئين لعالم تطوير التطبيقات",
          type: ContentType.PODCAST_EPISODE,
          category: Category.TECHNOLOGY,
          language: "ar",
          status: Status.PUBLISHED,
          source: Source.YOUTUBE,
          externalId: "yt_demo_123",
          metadata: { duration: 2700, thumbnailUrl: "https://example.com/thumb.jpg" },
          publishedAt: new Date("2025-01-25"),
          createdAt: now,
          updatedAt: now,
        },
      );
    }

    // Documentary episodes
    const documentary = publishedPrograms.find((p) => p.title === "وثائقي: رحلة في التاريخ");
    if (documentary) {
      contentData.push(
        {
          id: uuid(),
          programId: documentary.id,
          title: "الحلقة 1: نشأة الحضارة العربية",
          description: "رحلة إلى بدايات الحضارة العربية وإنجازاتها",
          type: ContentType.DOCUMENTARY_EPISODE,
          category: Category.CULTURE,
          language: "ar",
          status: Status.PUBLISHED,
          source: Source.MANUAL,
          metadata: { duration: 2700, episodeNumber: 1 },
          publishedAt: new Date("2025-01-05"),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuid(),
          programId: documentary.id,
          title: "الحلقة 2: العصر الذهبي للعلوم",
          description: "نستعرض إنجازات العلماء العرب في العصر الذهبي",
          type: ContentType.DOCUMENTARY_EPISODE,
          category: Category.CULTURE,
          language: "ar",
          status: Status.PUBLISHED,
          source: Source.MANUAL,
          metadata: { duration: 3000, episodeNumber: 2 },
          publishedAt: new Date("2025-01-12"),
          createdAt: now,
          updatedAt: now,
        },
      );
    }

    // Standalone content (no program)
    contentData.push({
      id: uuid(),
      programId: null,
      title: "مقطع تعريفي: من نحن",
      description: "تعرف على ثمانية وما نقدمه من محتوى",
      type: ContentType.STANDALONE_VIDEO,
      category: Category.ENTERTAINMENT,
      language: "ar",
      status: Status.PUBLISHED,
      source: Source.MANUAL,
      metadata: { duration: 120 },
      publishedAt: new Date("2025-01-01"),
      createdAt: now,
      updatedAt: now,
    });

    const contents = this.contentRepository.create(contentData);
    await this.contentRepository.save(contents);
  }
}
