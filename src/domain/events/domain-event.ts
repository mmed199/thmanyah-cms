/**
 * Base Domain Event
 *
 * All domain events extend this class.
 * Events are pure TypeScript classes - no Protobuf needed.
 */

export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }

  abstract get eventName(): string;
}
