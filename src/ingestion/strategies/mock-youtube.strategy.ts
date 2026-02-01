/**
 * Mock YouTube Strategy
 *
 * Returns fake YouTube data for testing/demo purposes.
 * In production, this would be replaced with real YouTube API integration.
 */

import { Injectable } from "@nestjs/common";
import { Source } from "@shared/enums/source.enum";
import {
  IIngestionStrategy,
  FetchResult,
  FetchOptions,
  ExternalContentItem,
} from "../interfaces/ingestion.interface";

// Sample Arabic podcast episode titles for realistic demo data
const SAMPLE_EPISODES = [
  { title: "الحلقة 1: بداية الرحلة", description: "نتحدث عن كيف بدأت رحلتنا في عالم الأعمال" },
  { title: "الحلقة 2: تحديات البدايات", description: "التحديات التي واجهناها في بداية المشروع" },
  { title: "الحلقة 3: الفشل والنجاح", description: "دروس مستفادة من الفشل وكيف نهضنا مجدداً" },
  { title: "الحلقة 4: بناء الفريق", description: "كيف تبني فريق عمل ناجح ومتماسك" },
  { title: "الحلقة 5: التمويل والاستثمار", description: "نصائح للحصول على التمويل المناسب" },
  { title: "الحلقة 6: التسويق الرقمي", description: "استراتيجيات التسويق في العصر الرقمي" },
  { title: "الحلقة 7: قصص نجاح عربية", description: "نستضيف رواد أعمال عرب ناجحين" },
  { title: "الحلقة 8: المستقبل", description: "رؤيتنا للمستقبل وخططنا القادمة" },
  { title: "الحلقة 9: الذكاء الاصطناعي", description: "كيف يغير الذكاء الاصطناعي عالم الأعمال" },
  { title: "الحلقة 10: ريادة الأعمال الاجتماعية", description: "الأثر الاجتماعي للمشاريع الريادية" },
];

const SAMPLE_CHANNELS: Record<string, { title: string; description: string }> = {
  UC_demo_channel_1: {
    title: "سوالف بزنس",
    description: "بودكاست أسبوعي يناقش آخر أخبار وتطورات عالم الأعمال في المنطقة العربية",
  },
  UC_demo_channel_2: {
    title: "فنجان",
    description: "بودكاست يستضيف شخصيات ملهمة من مختلف المجالات",
  },
  UC_demo_channel_3: {
    title: "بودكاست التقنية",
    description: "نناقش آخر التطورات التقنية وتأثيرها على حياتنا",
  },
};

@Injectable()
export class MockYouTubeStrategy implements IIngestionStrategy {
  readonly source = Source.YOUTUBE;

  async fetch(channelId: string, options?: FetchOptions): Promise<FetchResult> {
    // Simulate API delay
    await this.delay(100);

    const maxResults = options?.maxResults ?? 10;
    const pageToken = options?.pageToken;
    const startIndex = pageToken ? parseInt(pageToken, 10) : 0;

    // Generate mock items
    const items: ExternalContentItem[] = [];
    for (let i = 0; i < Math.min(maxResults, SAMPLE_EPISODES.length - startIndex); i++) {
      const episodeIndex = (startIndex + i) % SAMPLE_EPISODES.length;
      const episode = SAMPLE_EPISODES[episodeIndex];

      items.push({
        externalId: `yt_${channelId}_${startIndex + i}_${Date.now()}`,
        title: episode.title,
        description: episode.description,
        publishedAt: this.randomPastDate(90), // Random date within last 90 days
        duration: this.randomDuration(1800, 7200), // 30min to 2hr
        thumbnailUrl: `https://i.ytimg.com/vi/mock_${startIndex + i}/hqdefault.jpg`,
        metadata: {
          viewCount: Math.floor(Math.random() * 100000),
          likeCount: Math.floor(Math.random() * 5000),
          channelId,
        },
      });
    }

    // Calculate next page token
    const nextIndex = startIndex + items.length;
    const hasMore = nextIndex < SAMPLE_EPISODES.length;

    return {
      items,
      nextPageToken: hasMore ? nextIndex.toString() : undefined,
      totalResults: SAMPLE_EPISODES.length,
    };
  }

  async getChannelInfo(channelId: string): Promise<{
    title: string;
    description?: string;
    thumbnailUrl?: string;
    metadata?: Record<string, unknown>;
  }> {
    // Simulate API delay
    await this.delay(50);

    const channel = SAMPLE_CHANNELS[channelId] ?? {
      title: `قناة ${channelId}`,
      description: "قناة تجريبية للعرض",
    };

    return {
      title: channel.title,
      description: channel.description,
      thumbnailUrl: `https://yt3.ggpht.com/mock_channel_${channelId}`,
      metadata: {
        subscriberCount: Math.floor(Math.random() * 1000000),
        videoCount: Math.floor(Math.random() * 500),
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private randomPastDate(maxDaysAgo: number): Date {
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  private randomDuration(minSeconds: number, maxSeconds: number): number {
    return Math.floor(Math.random() * (maxSeconds - minSeconds) + minSeconds);
  }
}
