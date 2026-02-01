/**
 * Program ORM Entity
 *
 * TypeORM entity for database persistence.
 * This is separate from the domain entity to keep domain pure.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { ProgramType, Category, Status } from "../../enums";
import { ContentOrmEntity } from "./content.orm-entity";

@Entity("programs")
export class ProgramOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({
    type: "enum",
    enum: ProgramType,
  })
  type: ProgramType;

  @Column({
    type: "enum",
    enum: Category,
  })
  category: Category;

  @Column({ type: "varchar", length: 10, default: "ar" })
  language: string;

  @Column({
    type: "enum",
    enum: Status,
    default: Status.DRAFT,
  })
  status: Status;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => ContentOrmEntity, (content) => content.program)
  contents: ContentOrmEntity[];
}
