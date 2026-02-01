import { DomainEvent } from "@shared/events/domain-event";

export const INGESTION_EVENT_PUBLISHER = Symbol("INGESTION_EVENT_PUBLISHER");

/**
 * Ingestion Event Publisher Interface
 *
 * Interface for publishing domain events from Ingestion module.
 */
export interface IIngestionEventPublisher {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}
