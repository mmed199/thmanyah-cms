import { DomainEvent } from './domain-event';
import { ContentType } from '../enums/content-type.enum';
import { Category } from '../enums/category.enum';
import { ContentMetadata } from '../entities/content.entity';

export class ContentCreatedEvent extends DomainEvent {
  constructor(
    public readonly contentId: string,
    public readonly programId: string | null,
    public readonly title: string,
    public readonly type: ContentType,
    public readonly category: Category,
    public readonly language: string,
  ) {
    super();
  }

  get eventName(): string {
    return 'content.created';
  }
}

export class ContentUpdatedEvent extends DomainEvent {
  constructor(
    public readonly contentId: string,
    public readonly programId: string | null,
    public readonly status: string,
    public readonly updatedFields: string[],
  ) {
    super();
  }

  get eventName(): string {
    return 'content.updated';
  }
}

export class ContentPublishedEvent extends DomainEvent {
  constructor(
    public readonly contentId: string,
    public readonly programId: string | null,
    public readonly title: string,
    public readonly description: string,
    public readonly type: ContentType,
    public readonly category: Category,
    public readonly language: string,
    public readonly metadata: ContentMetadata | null,
    public readonly publishedAt: Date,
  ) {
    super();
  }

  get eventName(): string {
    return 'content.published';
  }
}

export class ContentArchivedEvent extends DomainEvent {
  constructor(
    public readonly contentId: string,
    public readonly programId: string | null,
  ) {
    super();
  }

  get eventName(): string {
    return 'content.archived';
  }
}

export class ContentDeletedEvent extends DomainEvent {
  constructor(
    public readonly contentId: string,
    public readonly programId: string | null,
  ) {
    super();
  }

  get eventName(): string {
    return 'content.deleted';
  }
}
