/**
 * CMS Event Publisher Interface
 *
 * Interface for publishing domain events from CMS module.
 */

import { DomainEvent } from "../../shared/events/domain-event";

export const CMS_EVENT_PUBLISHER = Symbol("CMS_EVENT_PUBLISHER");

export interface ICmsEventPublisher {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}
