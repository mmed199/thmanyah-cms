/**
 * Content Published Event
 */

import { DomainEvent } from "../domain-event";
import { ContentType, Category } from "../../enums";
import type { ContentMetadata } from "../../entities/metadata";

export class ContentPublishedEvent extends DomainEvent {
  constructor(
    public readonly contentId: string,
    public readonly programId: string | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly type: ContentType,
    public readonly category: Category,
    public readonly language: string,
    public readonly metadata: ContentMetadata | null,
    public readonly publishedAt: Date,
  ) {
    super();
  }

  get eventName(): string {
    return "content.published";
  }
}
