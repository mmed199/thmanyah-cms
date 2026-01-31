/**
 * Content Archived Event
 */

import { DomainEvent } from "../domain-event";

export class ContentArchivedEvent extends DomainEvent {
  constructor(
    public readonly contentId: string,
    public readonly programId: string | null,
  ) {
    super();
  }

  get eventName(): string {
    return "content.archived";
  }
}
