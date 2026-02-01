/**
 * Content ORM Entity
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
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ContentType, Category, Status, Source } from "../../enums";
import { ProgramOrmEntity } from "./program.orm-entity";

@Entity("content")
@Index("idx_content_external_source", ["source", "externalId"], {
  unique: true,
  where: '"external_id" IS NOT NULL',
})
export class ContentOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "program_id", type: "uuid", nullable: true })
  programId: string | null;

  @ManyToOne(() => ProgramOrmEntity, (program) => program.contents, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "program_id" })
  program: ProgramOrmEntity | null;

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({
    type: "enum",
    enum: ContentType,
  })
  type: ContentType;

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

  @Column({
    type: "enum",
    enum: Source,
    default: Source.MANUAL,
  })
  source: Source;

  @Column({ name: "external_id", type: "varchar", length: 255, nullable: true })
  externalId: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: "published_at", type: "timestamp", nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
