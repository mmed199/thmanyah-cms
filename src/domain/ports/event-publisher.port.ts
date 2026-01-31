/**
 * Event Publisher Port
 *
 * Interface for publishing domain events.
 * Allows the domain to emit events without knowing the implementation.
 */

import { DomainEvent } from "../events/domain-event";

export const EVENT_PUBLISHER = Symbol("EVENT_PUBLISHER");

export interface IEventPublisher {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): void;

  /**
   * Publish multiple domain events
   */
  publishAll(events: DomainEvent[]): void;
}
