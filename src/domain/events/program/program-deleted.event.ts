/**
 * Program Deleted Event
 */

import { DomainEvent } from "../domain-event";

export class ProgramDeletedEvent extends DomainEvent {
  constructor(public readonly programId: string) {
    super();
  }

  get eventName(): string {
    return "program.deleted";
  }
}
