/**
 * CMS Event Publisher
 *
 * Implementation of ICmsEventPublisher using NestJS EventEmitter2.
 */

import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { ICmsEventPublisher } from "./event-publisher.interface";
import { DomainEvent } from "../../shared/events/domain-event";

@Injectable()
export class EventPublisher implements ICmsEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    this.eventEmitter.emit(event.eventName, event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }
}
