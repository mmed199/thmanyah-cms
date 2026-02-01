/**
 * Content Created Event
 */

import { DomainEvent } from "../domain-event";
import { ContentType, Category } from "../../enums";

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
    return "content.created";
  }
}
