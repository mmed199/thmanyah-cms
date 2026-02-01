/**
 * Content Updated Event
 */

import { DomainEvent } from "../domain-event";

export class ContentUpdatedEvent extends DomainEvent {
  constructor(
    public readonly contentId: string,
    public readonly programId: string | null,
    public readonly updatedFields: string[],
  ) {
    super();
  }

  get eventName(): string {
    return "content.updated";
  }
}
