/**
 * Program Updated Event
 */

import { DomainEvent } from "../domain-event";

export class ProgramUpdatedEvent extends DomainEvent {
  constructor(
    public readonly programId: string,
    public readonly updatedFields: string[],
  ) {
    super();
  }

  get eventName(): string {
    return "program.updated";
  }
}
