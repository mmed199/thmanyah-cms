/**
 * Program Created Event
 */

import { DomainEvent } from "../domain-event";

export class ProgramCreatedEvent extends DomainEvent {
  constructor(
    public readonly programId: string,
    public readonly title: string,
  ) {
    super();
  }

  get eventName(): string {
    return "program.created";
  }
}
