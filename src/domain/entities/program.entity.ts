/**
 * Program Entity - Pure Domain Model
 *
 * This is a pure domain entity with no framework dependencies.
 * Business logic and invariants are enforced here.
 */

import { ProgramType, Category, Status } from "../enums";
import { ProgramMetadata } from "./metadata";
import type { Content } from "./content.entity";

export interface CreateProgramProps {
  id?: string;
  title: string;
  description?: string;
  type: ProgramType;
  category: Category;
  language?: string;
  status?: Status;
  metadata?: ProgramMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Program {
  public readonly id: string;
  public title: string;
  public description: string | null;
  public type: ProgramType;
  public category: Category;
  public language: string;
  public status: Status;
  public metadata: ProgramMetadata | null;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public contents?: Content[];

  constructor(props: CreateProgramProps & { id: string }) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description ?? null;
    this.type = props.type;
    this.category = props.category;
    this.language = props.language ?? "ar";
    this.status = props.status ?? Status.DRAFT;
    this.metadata = props.metadata ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  /**
   * Publish the program
   */
  publish(): void {
    if (this.status === Status.ARCHIVED) {
      throw new Error("Cannot publish an archived program");
    }
    this.status = Status.PUBLISHED;
    this.updatedAt = new Date();
  }

  /**
   * Archive the program
   */
  archive(): void {
    this.status = Status.ARCHIVED;
    this.updatedAt = new Date();
  }

  /**
   * Revert to draft status
   */
  revertToDraft(): void {
    this.status = Status.DRAFT;
    this.updatedAt = new Date();
  }

  /**
   * Update program properties
   */
  update(props: Partial<Omit<CreateProgramProps, "id" | "createdAt">>): void {
    if (props.title !== undefined) this.title = props.title;
    if (props.description !== undefined) this.description = props.description ?? null;
    if (props.type !== undefined) this.type = props.type;
    if (props.category !== undefined) this.category = props.category;
    if (props.language !== undefined) this.language = props.language;
    if (props.metadata !== undefined) this.metadata = props.metadata ?? null;
    this.updatedAt = new Date();
  }

  /**
   * Check if status transition is valid
   */
  canTransitionTo(newStatus: Status): boolean {
    const allowedTransitions: Record<Status, Status[]> = {
      [Status.DRAFT]: [Status.PUBLISHED],
      [Status.PUBLISHED]: [Status.ARCHIVED, Status.DRAFT],
      [Status.ARCHIVED]: [Status.DRAFT],
    };
    return allowedTransitions[this.status]?.includes(newStatus) ?? false;
  }
}
