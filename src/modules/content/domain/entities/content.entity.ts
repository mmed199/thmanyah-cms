import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContentType } from '../enums/content-type.enum';
import { Category } from '../enums/category.enum';
import { Status } from '../enums/status.enum';
import { Source } from '../enums/source.enum';
import { Program } from './program.entity';

export interface ContentMetadata {
  duration?: number; // seconds
  episodeNumber?: number;
  seasonNumber?: number;
  guests?: string[];
  thumbnailUrl?: string;
  [key: string]: unknown;
}

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'program_id', type: 'uuid', nullable: true })
  programId: string | null;

  @ManyToOne(() => Program, (program) => program.contents, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  type: ContentType;

  @Column({
    type: 'enum',
    enum: Category,
  })
  category: Category;

  @Column({ type: 'varchar', length: 10, default: 'ar' })
  language: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.DRAFT,
  })
  status: Status;

  @Column({
    type: 'enum',
    enum: Source,
    default: Source.MANUAL,
  })
  source: Source;

  @Column({ name: 'external_id', type: 'varchar', length: 255, nullable: true })
  externalId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: ContentMetadata;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
