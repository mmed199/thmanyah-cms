/**
 * Ingestion Event Publisher Repository
 *
 * EventEmitter2 implementation of IIngestionEventPublisher.
 */

import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DomainEvent } from "@shared/events/domain-event";
import type { IIngestionEventPublisher } from "./event-publisher.interface";

@Injectable()
export class EventPublisher implements IIngestionEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    this.eventEmitter.emit(event.eventName, event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
