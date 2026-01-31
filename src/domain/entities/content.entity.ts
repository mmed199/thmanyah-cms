import { ContentType, Category, Status, Source } from "../enums";
import { ContentMetadata } from "./metadata";

export interface CreateContentProps {
  id: string;
  programId?: string | null;
  title: string;
  description?: string;
  type: ContentType;
  category: Category;
  language?: string;
  status?: Status;
  source?: Source;
  externalId?: string | null;
  metadata?: ContentMetadata;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Content {
  public readonly id: string;
  public programId: string | null;
  public title: string;
  public description: string | null;
  public type: ContentType;
  public category: Category;
  public language: string;
  public status: Status;
  public source: Source;
  public externalId: string | null;
  public metadata: ContentMetadata | null;
  public publishedAt: Date | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: CreateContentProps) {
    this.id = props.id;
    this.programId = props.programId ?? null;
    this.title = props.title;
    this.description = props.description ?? null;
    this.type = props.type;
    this.category = props.category;
    this.language = props.language ?? "ar";
    this.status = props.status ?? Status.DRAFT;
    this.source = props.source ?? Source.MANUAL;
    this.externalId = props.externalId ?? null;
    this.metadata = props.metadata ?? null;
    this.publishedAt = props.publishedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Update content properties
   * Excluding id, createdAt, and status
   */
  update(props: Partial<Omit<CreateContentProps, "id" | "createdAt" | "status" | "publishedAt">>): void {
    if (props.programId !== undefined) this.programId = props.programId;
    if (props.title !== undefined) this.title = props.title;
    if (props.description !== undefined) this.description = props.description ?? null;
    if (props.type !== undefined) this.type = props.type;
    if (props.category !== undefined) this.category = props.category;
    if (props.language !== undefined) this.language = props.language;
    if (props.source !== undefined) this.source = props.source;
    if (props.externalId !== undefined) this.externalId = props.externalId;
    if (props.metadata !== undefined) this.metadata = props.metadata ?? null;
    this.updatedAt = new Date();
  }

  /**
   * Publish the content
   */
  publish(): void {
    if (this.status === Status.ARCHIVED) {
      throw new Error("Cannot publish archived content");
    }
    this.status = Status.PUBLISHED;
    this.publishedAt = this.publishedAt ?? new Date();
    this.updatedAt = new Date();
  }

  /**
   * Archive the content
   */
  archive(): void {
    this.status = Status.ARCHIVED;
    this.updatedAt = new Date();
  }

  /**
   * Revert to draft status
   */
  revertToDraft(): void {
    this.status = Status.DRAFT;
    this.updatedAt = new Date();
  }

  /**
   * Check if status transition is valid
   */
  canTransitionTo(newStatus: Status): boolean {
    const allowedTransitions: Record<Status, Status[]> = {
      [Status.DRAFT]: [Status.PUBLISHED],
      [Status.PUBLISHED]: [Status.ARCHIVED, Status.DRAFT],
      [Status.ARCHIVED]: [Status.DRAFT],
    };
    return allowedTransitions[this.status]?.includes(newStatus) ?? false;
  }

  /**
   * Check if content is published
   */
  isPublished(): boolean {
    return this.status === Status.PUBLISHED;
  }

  /**
   * Check if content was imported from external source
   */
  isImported(): boolean {
    return this.source !== Source.MANUAL && this.externalId !== null;
  }
}
